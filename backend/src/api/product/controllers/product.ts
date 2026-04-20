import { factories } from '@strapi/strapi';
import { computeAvailability } from '../../../utils/availability';

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
    const [products, recipes, ingredients] = await Promise.all([
      strapi.db.query('api::product.product').findMany({
        where:  { isActive: true },
        select: ['id', 'documentId', 'trackInventory', 'stockQuantity'],
      }),
      strapi.db.query('api::recipe.recipe').findMany({
        populate: { product: { select: ['id'] } },
      }),
      strapi.db.query('api::ingredient.ingredient').findMany({
        where:  { isActive: true },
        select: ['id', 'slug', 'quantity'],
      }),
    ]);

    const availability = computeAvailability(
      products as any,
      recipes  as any,
      ingredients as any,
    );

    const tracked = Object.values(availability).filter((v) => v !== null).length;

    return {
      data: availability,
      meta: {
        total: products.length,
        tracked,
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
