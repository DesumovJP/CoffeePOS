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

  async create(ctx) {
    const response = await super.create(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('ingredient_create', {
      documentId: entry.documentId,
      name: entry.name,
      quantity: entry.quantity,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async update(ctx) {
    const prev: any = await strapi.db
      .query('api::ingredient.ingredient')
      .findOne({ where: { documentId: ctx.params.id } });
    const response = await super.update(ctx);
    const entry: any = response?.data || {};
    const prevQty = Number(prev?.quantity ?? 0);
    const newQty = Number(entry?.quantity ?? prevQty);
    const isAdjust = prev && prevQty !== newQty;
    const type = isAdjust ? 'ingredient_adjust' : 'ingredient_update';
    await strapi.service('api::shift.shift').logCurrentShiftActivity(type, {
      documentId: entry.documentId,
      name: entry.name,
      previousQty: prevQty,
      newQty,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async delete(ctx) {
    const existing: any = await strapi.db
      .query('api::ingredient.ingredient')
      .findOne({ where: { documentId: ctx.params.id } });
    const response = await super.delete(ctx);
    await strapi.service('api::shift.shift').logCurrentShiftActivity('ingredient_delete', {
      documentId: ctx.params.id,
      name: existing?.name,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
}));
