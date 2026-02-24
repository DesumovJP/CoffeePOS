import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::order.order', ({ strapi }) => ({
  /**
   * Deduct inventory based on recipes for order items.
   *
   * Lookup strategy (Strapi 5 — numeric `id` is dynamic, avoid):
   *   - Product  → by `productDocumentId` (stable), falls back to numeric `product` id
   *   - Ingredient → by `ingredientSlug` (stable), falls back to numeric `ingredientId`
   */
  async deductInventory(orderId: number, items: any[], shiftId?: number) {
    for (const item of items) {
      const hasDocumentId = !!item.productDocumentId;
      const hasNumericId  = !!item.product;
      if (!hasDocumentId && !hasNumericId) continue;

      // Prefer stable documentId over fragile numeric id
      const recipeWhere = hasDocumentId
        ? { product: { documentId: item.productDocumentId } }
        : { product: item.product };

      const recipes = await strapi.db.query('api::recipe.recipe').findMany({
        where: recipeWhere,
      });

      if (!recipes || recipes.length === 0) continue;

      // Match recipe by sizeId, fall back to isDefault, then first
      let recipe = recipes.find((r: any) => r.isDefault);
      if (item.sizeId) {
        const sized = recipes.find((r: any) => r.sizeId === item.sizeId);
        if (sized) recipe = sized;
      }
      if (!recipe) recipe = recipes[0];

      const recipeIngredients = recipe.ingredients;
      if (!Array.isArray(recipeIngredients)) continue;

      for (const ri of recipeIngredients) {
        // Prefer stable slug over fragile numeric id
        const ingredientWhere = ri.ingredientSlug
          ? { slug: ri.ingredientSlug }
          : { id: ri.ingredientId };

        const ingredient = await strapi.db.query('api::ingredient.ingredient').findOne({
          where: ingredientWhere,
        });

        if (!ingredient) continue;

        const deductAmount = ri.amount * (item.quantity || 1);
        const previousQty  = ingredient.quantity || 0;
        const newQty       = Math.max(0, previousQty - deductAmount);

        await strapi.db.query('api::ingredient.ingredient').update({
          where: { id: ingredient.id },
          data:  { quantity: newQty },
        });

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
