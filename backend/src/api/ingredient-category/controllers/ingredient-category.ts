import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::ingredient-category.ingredient-category', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('ingredient_category_create', {
      documentId: entry.documentId,
      name: entry.name,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async update(ctx) {
    const response = await super.update(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('ingredient_category_update', {
      documentId: entry.documentId,
      name: entry.name,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async delete(ctx) {
    const existing: any = await strapi.db
      .query('api::ingredient-category.ingredient-category')
      .findOne({ where: { documentId: ctx.params.id } });
    const response = await super.delete(ctx);
    await strapi.service('api::shift.shift').logCurrentShiftActivity('ingredient_category_delete', {
      documentId: ctx.params.id,
      name: existing?.name,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
}));
