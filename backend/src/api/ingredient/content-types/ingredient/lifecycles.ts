export default {
  async afterUpdate(event) {
    const { result, params } = event;

    // Low stock alert
    if (result.quantity !== undefined && result.minQuantity !== undefined) {
      if (result.quantity <= result.minQuantity && result.isActive !== false) {
        (global as any).strapi?.log?.warn(
          `Low stock alert: ${result.name} — ${result.quantity} ${result.unit} (min: ${result.minQuantity})`
        );
      }
    }

    // Cascade recipe cost recalculation when costPerUnit changes
    if (params.data?.costPerUnit !== undefined) {
      try {
        const allRecipes = await strapi.db
          .query('api::recipe.recipe')
          .findMany({ limit: -1 });

        for (const recipe of allRecipes) {
          if (!Array.isArray(recipe.ingredients)) continue;

          const usesThis = recipe.ingredients.some(
            (ri: any) =>
              ri.ingredientSlug === result.slug ||
              ri.ingredientId === result.id
          );
          if (!usesThis) continue;

          let totalCost = 0;
          for (const ri of recipe.ingredients) {
            const where = ri.ingredientSlug
              ? { slug: ri.ingredientSlug }
              : ri.ingredientId
                ? { id: ri.ingredientId }
                : null;
            if (!where) continue;

            const ing = await strapi.db
              .query('api::ingredient.ingredient')
              .findOne({ where });
            if (!ing) continue;
            totalCost += (ri.amount || 0) * (ing.costPerUnit || 0);
          }

          await strapi.db.query('api::recipe.recipe').update({
            where: { id: recipe.id },
            data: { costPrice: Math.round(totalCost * 100) / 100 },
          });
        }
      } catch (err) {
        strapi.log.error('Failed to recalculate recipe costs:', err);
      }
    }
  },
};
