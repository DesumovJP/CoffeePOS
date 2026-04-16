/**
 * Recipe lifecycle hooks
 *
 * - Auto-calculate costPrice from ingredient compositions before save.
 * - Set product.inventoryType = "recipe" when a recipe is linked to a product.
 */

async function calculateCostPrice(data: any, strapi: any) {
  const ingredients = data.ingredients;
  if (!Array.isArray(ingredients) || ingredients.length === 0) return;

  let totalCost = 0;

  for (const ri of ingredients) {
    const where = ri.ingredientSlug
      ? { slug: ri.ingredientSlug }
      : ri.ingredientId
        ? { id: ri.ingredientId }
        : null;

    if (!where) continue;

    const ingredient = await strapi.db
      .query('api::ingredient.ingredient')
      .findOne({ where });

    if (!ingredient) continue;

    totalCost += (ri.amount || 0) * (ingredient.costPerUnit || 0);
  }

  data.costPrice = Math.round(totalCost * 100) / 100;
}

/**
 * When a recipe is saved with a product relation, ensure that product's
 * inventoryType is set to "recipe". This is the canonical way to mark
 * a product as recipe-based — no frontend heuristics needed.
 */
async function ensureProductInventoryType(event: any) {
  const productId =
    event.params.data?.product?.connect?.[0]?.id ??
    event.params.data?.product;

  if (!productId) return;

  try {
    const product = await strapi.db
      .query('api::product.product')
      .findOne({ where: { id: productId } });

    if (product && product.inventoryType !== 'recipe') {
      await strapi.db.query('api::product.product').update({
        where: { id: product.id },
        data: { inventoryType: 'recipe' },
      });
    }
  } catch (err) {
    strapi.log.error('Failed to update product inventoryType:', err);
  }
}

export default {
  async beforeCreate(event: any) {
    await calculateCostPrice(event.params.data, strapi);
  },
  async beforeUpdate(event: any) {
    if (event.params.data.ingredients !== undefined) {
      await calculateCostPrice(event.params.data, strapi);
    }
  },
  async afterCreate(event: any) {
    await ensureProductInventoryType(event);
  },
  async afterUpdate(event: any) {
    await ensureProductInventoryType(event);
  },
};
