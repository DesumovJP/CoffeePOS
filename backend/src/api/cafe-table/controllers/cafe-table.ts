import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::cafe-table.cafe-table', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('table_create', {
      documentId: entry.documentId,
      number: entry.number,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async update(ctx) {
    const response = await super.update(ctx);
    const entry: any = response?.data || {};
    await strapi.service('api::shift.shift').logCurrentShiftActivity('table_update', {
      documentId: entry.documentId,
      number: entry.number,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
  async delete(ctx) {
    const existing: any = await strapi.db
      .query('api::cafe-table.cafe-table')
      .findOne({ where: { documentId: ctx.params.id } });
    const response = await super.delete(ctx);
    await strapi.service('api::shift.shift').logCurrentShiftActivity('table_delete', {
      documentId: ctx.params.id,
      number: existing?.number,
      user: ctx.state?.user?.username || ctx.state?.user?.email,
    });
    return response;
  },
}));
