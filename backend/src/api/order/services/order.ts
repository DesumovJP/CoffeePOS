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
}));
