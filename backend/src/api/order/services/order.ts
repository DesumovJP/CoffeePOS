import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::order.order', ({ strapi }) => ({
  /**
   * Deduct inventory for an order's items — race-safe.
   *
   * Two tracking strategies, resolved per-product:
   *   A) `trackInventory: true` → decrement product.stockQuantity directly
   *      (used for pre-made/purchased goods: bottled water, packaged desserts…)
   *   B) Recipe-based → decrement each ingredient.quantity via the matching recipe
   *      (used for items assembled from raw ingredients: drinks, food)
   *
   * Concurrency:
   *   Each decrement runs in a short transaction with `SELECT … FOR UPDATE` on
   *   the target row, then `UPDATE … SET x = GREATEST(0, x - n)`. This serialises
   *   concurrent orders that touch the same product/ingredient row, preventing the
   *   classic read-modify-write oversell race under parallel barista checkout.
   *
   * Lookup strategy (Strapi 5 — numeric `id` is dynamic, prefer stable refs):
   *   - Product    → by `productDocumentId` (stable), falls back to numeric `product` id
   *   - Ingredient → by `ingredientSlug`    (stable), falls back to numeric `ingredientId`
   */
  async deductInventory(orderId: number, items: any[], shiftId?: number) {
    const knex = strapi.db.connection;

    /**
     * Atomic decrement helper — returns the *actual* previous and new quantity
     * from the DB so the audit-log reflects what really happened.
     */
    async function atomicDecrement(
      table: 'products' | 'ingredients',
      column: string,
      rowId: number,
      amount: number,
    ): Promise<{ previousQty: number; newQty: number }> {
      return knex.transaction(async (tx) => {
        const [row] = await tx(table).where({ id: rowId }).forUpdate().select(column);
        const previousQty = Number(row?.[column]) || 0;
        const newQty      = Math.max(0, previousQty - amount);
        await tx(table).where({ id: rowId }).update({ [column]: newQty });
        return { previousQty, newQty };
      });
    }

    for (const item of items) {
      const hasDocumentId = !!item.productDocumentId;
      const hasNumericId  = !!item.product;
      if (!hasDocumentId && !hasNumericId) continue;

      // Resolve the product — needed to pick a deduction strategy
      const productWhere = hasDocumentId
        ? { documentId: item.productDocumentId }
        : { id: item.product };

      const product = await strapi.db.query('api::product.product').findOne({
        where:  productWhere,
        select: ['id', 'trackInventory', 'stockQuantity'],
      }) as any;

      // ── Strategy A: direct atomic stockQuantity decrement ───────────
      if (product?.trackInventory) {
        const qty = Number(item.quantity) || 1;
        const { previousQty, newQty } = await atomicDecrement(
          'products', 'stock_quantity', product.id, qty,
        );

        await strapi.db.query('api::inventory-transaction.inventory-transaction').create({
          data: {
            type:        'sale',
            product:     product.id,
            quantity:    -qty,
            previousQty,
            newQty,
            reference:   `ORD-${orderId}`,
            shift:       shiftId || undefined,
          },
        });
        continue; // Done — simple tracked products do not also use recipes
      }

      // ── Strategy B: recipe-based ingredient deduction ───────────────
      const recipeWhere = hasDocumentId
        ? { product: { documentId: item.productDocumentId } }
        : { product: item.product };

      const recipes = await strapi.db.query('api::recipe.recipe').findMany({
        where: recipeWhere,
      });

      if (!recipes || recipes.length === 0) continue;

      // Match recipe by variantId (legacy: sizeId), fall back to isDefault, then first
      let recipe = recipes.find((r: any) => r.isDefault);
      const vid = item.variantId || item.sizeId;
      if (vid) {
        const matched = recipes.find((r: any) => r.variantId === vid || r.sizeId === vid);
        if (matched) recipe = matched;
      }
      if (!recipe) recipe = recipes[0];

      const recipeIngredients = recipe.ingredients;
      if (!Array.isArray(recipeIngredients)) continue;

      for (const ri of recipeIngredients) {
        const amount = Number(ri.amount) || 0;
        if (amount <= 0) continue; // no-op — skip

        const ingredientWhere = ri.ingredientSlug
          ? { slug: ri.ingredientSlug }
          : { id: ri.ingredientId };

        const ingredient = await strapi.db.query('api::ingredient.ingredient').findOne({
          where:  ingredientWhere,
          select: ['id'],
        });
        if (!ingredient) continue;

        const deductAmount = amount * (Number(item.quantity) || 1);
        const { previousQty, newQty } = await atomicDecrement(
          'ingredients', 'quantity', ingredient.id, deductAmount,
        );

        await strapi.db.query('api::inventory-transaction.inventory-transaction').create({
          data: {
            type:        'sale',
            ingredient:  ingredient.id,
            product:     item.product || undefined,
            quantity:    -deductAmount,
            previousQty,
            newQty,
            reference:   `ORD-${orderId}`,
            shift:       shiftId || undefined,
          },
        });
      }
    }
  },

  /**
   * Refund inventory for a cancelled order — reverses every `sale` transaction
   * previously logged under `ORD-{orderId}` by creating equal-and-opposite
   * `adjustment` rows and restoring the stock row atomically.
   *
   * Idempotency: a refund writes `adjustment` reference `REFUND-ORD-{orderId}`;
   * if any such row already exists we short-circuit so repeated cancel clicks
   * can't double-credit stock.
   */
  async refundInventory(orderId: number, shiftId?: number) {
    const knex = strapi.db.connection;

    async function atomicIncrement(
      table: 'products' | 'ingredients',
      column: string,
      rowId: number,
      amount: number,
    ): Promise<{ previousQty: number; newQty: number }> {
      return knex.transaction(async (tx) => {
        const [row] = await tx(table).where({ id: rowId }).forUpdate().select(column);
        const previousQty = Number(row?.[column]) || 0;
        const newQty      = previousQty + amount;
        await tx(table).where({ id: rowId }).update({ [column]: newQty });
        return { previousQty, newQty };
      });
    }

    const refundRef = `REFUND-ORD-${orderId}`;
    const existing = await strapi.db.query('api::inventory-transaction.inventory-transaction').findOne({
      where: { reference: refundRef },
      select: ['id'],
    });
    if (existing) return { refunded: 0, alreadyRefunded: true };

    const saleRef = `ORD-${orderId}`;
    const sales = await strapi.db.query('api::inventory-transaction.inventory-transaction').findMany({
      where:    { reference: saleRef, type: 'sale' },
      populate: { product: { select: ['id'] }, ingredient: { select: ['id'] } },
    }) as any[];

    let refunded = 0;
    for (const s of sales) {
      const refundQty = Math.abs(Number(s.quantity) || 0);
      if (refundQty <= 0) continue;

      const productId    = s.product?.id    || null;
      const ingredientId = s.ingredient?.id || null;

      let result: { previousQty: number; newQty: number } | null = null;
      if (ingredientId) {
        result = await atomicIncrement('ingredients', 'quantity', ingredientId, refundQty);
      } else if (productId) {
        result = await atomicIncrement('products', 'stock_quantity', productId, refundQty);
      } else {
        continue;
      }

      await strapi.db.query('api::inventory-transaction.inventory-transaction').create({
        data: {
          type:        'adjustment',
          ingredient:  ingredientId || undefined,
          product:     productId    || undefined,
          quantity:    refundQty,
          previousQty: result.previousQty,
          newQty:      result.newQty,
          reference:   refundRef,
          shift:       shiftId || undefined,
          notes:       'Auto-refund on order cancellation',
        },
      });
      refunded++;
    }

    return { refunded, alreadyRefunded: false };
  },
}));
