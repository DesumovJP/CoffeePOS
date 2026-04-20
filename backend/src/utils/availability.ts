/**
 * Pure availability computation — no Strapi / DB deps so it is testable in isolation.
 */

export interface AvailabilityProduct {
  id: number;
  documentId: string;
  trackInventory?: boolean;
  stockQuantity?: number | null;
}

export interface AvailabilityRecipeIngredient {
  ingredientSlug?: string;
  ingredientId?: number;
  amount?: number;
}

export interface AvailabilityRecipe {
  product?: { id: number } | null;
  ingredients?: AvailabilityRecipeIngredient[] | null;
}

export interface AvailabilityIngredient {
  id: number;
  slug?: string | null;
  quantity?: number | string | null;
}

/**
 * Compute per-product availability:
 *   - trackInventory: true  → product.stockQuantity
 *   - recipe-based          → max(portions) across variants, where
 *                             portions = floor( min_over_recipe_ingredients( stock / amount ) )
 *   - untracked             → null
 */
export function computeAvailability(
  products: AvailabilityProduct[],
  recipes: AvailabilityRecipe[],
  ingredients: AvailabilityIngredient[],
): Record<string, number | null> {
  // Ingredient lookups — prefer stable slug, fall back to numeric id
  const bySlug = new Map<string, AvailabilityIngredient>();
  const byId   = new Map<number, AvailabilityIngredient>();
  for (const ing of ingredients) {
    if (ing.slug) bySlug.set(ing.slug, ing);
    byId.set(ing.id, ing);
  }

  // Group recipes by product.id
  const recipesByProductId = new Map<number, AvailabilityRecipe[]>();
  for (const r of recipes) {
    const pid = r.product?.id;
    if (!pid) continue;
    if (!recipesByProductId.has(pid)) recipesByProductId.set(pid, []);
    recipesByProductId.get(pid)!.push(r);
  }

  const result: Record<string, number | null> = {};

  for (const p of products) {
    // Simple tracked product — use its own stockQuantity
    if (p.trackInventory) {
      result[p.documentId] = Math.max(0, Number(p.stockQuantity) || 0);
      continue;
    }

    const prodRecipes = recipesByProductId.get(p.id) || [];
    if (prodRecipes.length === 0) {
      result[p.documentId] = null;
      continue;
    }

    let bestPortions = 0;
    let anyVariantValid = false;

    for (const recipe of prodRecipes) {
      const riList = recipe.ingredients;
      if (!Array.isArray(riList) || riList.length === 0) continue;

      let variantPortions = Infinity;
      let variantOk = true;

      for (const ri of riList) {
        const amount = Number(ri.amount) || 0;
        if (amount <= 0) continue; // no-op — does not constrain

        const ing = ri.ingredientSlug
          ? bySlug.get(ri.ingredientSlug)
          : ri.ingredientId ? byId.get(ri.ingredientId) : undefined;

        if (!ing) { variantOk = false; break; }

        const stockQty = Number(ing.quantity) || 0;
        const possible = Math.floor(stockQty / amount);
        if (possible < variantPortions) variantPortions = possible;
        if (variantPortions <= 0) break;
      }

      if (variantOk && variantPortions !== Infinity) {
        anyVariantValid = true;
        if (variantPortions > bestPortions) bestPortions = variantPortions;
      }
    }

    result[p.documentId] = anyVariantValid ? bestPortions : 0;
  }

  return result;
}
