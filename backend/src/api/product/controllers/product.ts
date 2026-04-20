import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  /**
   * GET /api/products/availability
   *
   * Returns per-product availability (how many units/portions can be sold now):
   *   - `trackInventory: true`  → product.stockQuantity (integer)
   *   - recipe-based products   → max portions across variants, limited by ingredient stock
   *   - no recipe + no tracking → null (untracked / unlimited)
   *
   * Response: { data: { [productDocumentId]: number | null }, meta: { total, tracked } }
   */
  async getAvailability(ctx) {
    const productQuery    = strapi.db.query('api::product.product');
    const recipeQuery     = strapi.db.query('api::recipe.recipe');
    const ingredientQuery = strapi.db.query('api::ingredient.ingredient');

    const [products, recipes, ingredients] = await Promise.all([
      productQuery.findMany({
        where:  { isActive: true },
        select: ['id', 'documentId', 'trackInventory', 'stockQuantity'],
      }),
      recipeQuery.findMany({
        populate: { product: { select: ['id'] } },
      }),
      ingredientQuery.findMany({
        where:  { isActive: true },
        select: ['id', 'slug', 'quantity'],
      }),
    ]);

    // Lookup maps for ingredients — stable `slug` preferred, numeric `id` fallback
    const ingredientBySlug = new Map<string, any>();
    const ingredientById   = new Map<number, any>();
    for (const ing of ingredients) {
      if (ing.slug) ingredientBySlug.set(ing.slug, ing);
      ingredientById.set(ing.id, ing);
    }

    // Group recipes by product.id
    const recipesByProductId = new Map<number, any[]>();
    for (const r of recipes) {
      const pid = r.product?.id;
      if (!pid) continue;
      if (!recipesByProductId.has(pid)) recipesByProductId.set(pid, []);
      recipesByProductId.get(pid)!.push(r);
    }

    const availability: Record<string, number | null> = {};
    let trackedCount = 0;

    for (const p of products as any[]) {
      // 1. Simple tracked product — use its own stockQuantity
      if (p.trackInventory) {
        availability[p.documentId] = Math.max(0, p.stockQuantity || 0);
        trackedCount++;
        continue;
      }

      // 2. Recipe-based — compute portions per variant, take the max
      const prodRecipes = recipesByProductId.get(p.id) || [];
      if (prodRecipes.length === 0) {
        availability[p.documentId] = null;
        continue;
      }

      let bestPortions = 0;
      let anyVariantValid = false;

      for (const recipe of prodRecipes) {
        const riList = recipe.ingredients;
        if (!Array.isArray(riList) || riList.length === 0) continue;

        let variantPortions = Infinity;
        let variantOk = true;

        for (const ri of riList) {
          const amount = parseFloat(ri.amount) || 0;
          if (amount <= 0) continue; // no-op ingredient — doesn't constrain

          const ing = ri.ingredientSlug
            ? ingredientBySlug.get(ri.ingredientSlug)
            : ri.ingredientId ? ingredientById.get(ri.ingredientId) : null;

          if (!ing) { variantOk = false; break; }

          const stockQty = parseFloat(ing.quantity) || 0;
          const possible = Math.floor(stockQty / amount);
          if (possible < variantPortions) variantPortions = possible;
          if (variantPortions <= 0) break; // short-circuit: already 0
        }

        if (variantOk && variantPortions !== Infinity) {
          anyVariantValid = true;
          if (variantPortions > bestPortions) bestPortions = variantPortions;
        }
      }

      availability[p.documentId] = anyVariantValid ? bestPortions : 0;
      trackedCount++;
    }

    return {
      data: availability,
      meta: {
        total: products.length,
        tracked: trackedCount,
      },
    };
  },

  async create(ctx) {
    const response = await super.create(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('product_create', {
      documentId: entry.documentId,
      name: entry.name,
      price: entry.price,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async update(ctx) {
    const response = await super.update(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('product_update', {
      documentId: entry.documentId,
      name: entry.name,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async delete(ctx) {
    const existing: any = await strapi.db
      .query('api::product.product')
      .findOne({ where: { documentId: ctx.params.id } });
    const response = await super.delete(ctx);
    await strapi.service('api::shift.shift').logCurrentShiftActivity('product_delete', {
      documentId: ctx.params.id,
      name: existing?.name,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
}));
