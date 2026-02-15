import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::ingredient.ingredient', ({ strapi }) => ({
  async getLowStock(ctx) {
    const ingredients = await strapi.db.query('api::ingredient.ingredient').findMany({
      where: {
        isActive: true,
      },
    });

    const lowStock = ingredients.filter((ing: any) => {
      const qty = parseFloat(ing.quantity) || 0;
      const minQty = parseFloat(ing.minQuantity) || 0;
      return qty <= minQty;
    });

    return {
      data: lowStock,
      meta: {
        total: lowStock.length,
      },
    };
  },
}));
