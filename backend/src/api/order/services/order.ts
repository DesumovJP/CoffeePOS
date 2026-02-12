import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::order.order', ({ strapi }) => ({
  /**
   * Deduct inventory based on recipes for order items
   */
  async deductInventory(orderId: number, items: any[], shiftId?: number) {
    for (const item of items) {
      if (!item.product) continue;

      // Find recipes for this product
      const recipes = await strapi.db.query('api::recipe.recipe').findMany({
        where: { product: item.product },
      });

      if (!recipes || recipes.length === 0) continue;

      // Find the matching recipe by sizeId or use default
      let recipe = recipes.find((r: any) => r.isDefault);
      if (item.sizeId) {
        const sizeRecipe = recipes.find((r: any) => r.sizeId === item.sizeId);
        if (sizeRecipe) recipe = sizeRecipe;
      }
      if (!recipe) recipe = recipes[0];

      const recipeIngredients = recipe.ingredients;
      if (!Array.isArray(recipeIngredients)) continue;

      // Deduct each ingredient
      for (const ri of recipeIngredients) {
        const ingredient = await strapi.db.query('api::ingredient.ingredient').findOne({
          where: { id: ri.ingredientId },
        });

        if (!ingredient) continue;

        const deductAmount = ri.amount * (item.quantity || 1);
        const previousQty = ingredient.quantity || 0;
        const newQty = Math.max(0, previousQty - deductAmount);

        // Update ingredient quantity
        await strapi.db.query('api::ingredient.ingredient').update({
          where: { id: ingredient.id },
          data: { quantity: newQty },
        });

        // Create inventory transaction
        await strapi.db.query('api::inventory-transaction.inventory-transaction').create({
          data: {
            type: 'sale',
            ingredient: ingredient.id,
            product: item.product,
            quantity: -deductAmount,
            previousQty,
            newQty,
            reference: `ORD-${orderId}`,
            shift: shiftId || undefined,
          },
        });
      }
    }
  },
}));
