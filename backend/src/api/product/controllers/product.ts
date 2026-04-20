import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
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
