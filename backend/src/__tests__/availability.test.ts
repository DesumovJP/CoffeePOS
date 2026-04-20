import { computeAvailability } from '../utils/availability';

describe('computeAvailability', () => {
  // ────────────────────────────────────────────────────────
  // Tracked (simple) products
  // ────────────────────────────────────────────────────────
  describe('trackInventory products', () => {
    it('returns stockQuantity directly', () => {
      const result = computeAvailability(
        [{ id: 1, documentId: 'water', trackInventory: true, stockQuantity: 42 }],
        [],
        [],
      );
      expect(result).toEqual({ water: 42 });
    });

    it('clamps negative stockQuantity to 0', () => {
      const result = computeAvailability(
        [{ id: 1, documentId: 'water', trackInventory: true, stockQuantity: -5 }],
        [],
        [],
      );
      expect(result.water).toBe(0);
    });

    it('treats missing stockQuantity as 0', () => {
      const result = computeAvailability(
        [{ id: 1, documentId: 'water', trackInventory: true }],
        [],
        [],
      );
      expect(result.water).toBe(0);
    });

    it('ignores recipes on tracked products', () => {
      // Tracked wins even if recipes exist — the business rule is: you
      // chose to count units, not ingredients.
      const result = computeAvailability(
        [{ id: 1, documentId: 'pkg', trackInventory: true, stockQuantity: 3 }],
        [{ product: { id: 1 }, ingredients: [{ ingredientSlug: 'foo', amount: 1 }] }],
        [{ id: 10, slug: 'foo', quantity: 999 }],
      );
      expect(result.pkg).toBe(3);
    });
  });

  // ────────────────────────────────────────────────────────
  // Recipe-based products
  // ────────────────────────────────────────────────────────
  describe('recipe-based products', () => {
    it('computes floor(stock / amount) for single-ingredient recipe', () => {
      // 500 g beans / 18 g per shot = 27 shots
      const result = computeAvailability(
        [{ id: 1, documentId: 'esp' }],
        [{ product: { id: 1 }, ingredients: [{ ingredientSlug: 'beans', amount: 18 }] }],
        [{ id: 10, slug: 'beans', quantity: 500 }],
      );
      expect(result.esp).toBe(27);
    });

    it('bottlenecks on the scarcest ingredient', () => {
      // beans: 500/18 = 27;  milk: 100/150 = 0  →  min = 0
      const result = computeAvailability(
        [{ id: 1, documentId: 'latte' }],
        [{
          product: { id: 1 },
          ingredients: [
            { ingredientSlug: 'beans', amount: 18 },
            { ingredientSlug: 'milk',  amount: 150 },
          ],
        }],
        [
          { id: 10, slug: 'beans', quantity: 500 },
          { id: 11, slug: 'milk',  quantity: 100 },
        ],
      );
      expect(result.latte).toBe(0);
    });

    it('takes MAX across variants (best-case buildable portions)', () => {
      // Variant S: 18 g beans + 150 ml milk  → min(27, 6) = 6
      // Variant L: 18 g beans + 250 ml milk  → min(27, 3) = 3
      // Best case: 6 portions if user picks S.
      const recipes = [
        {
          product: { id: 1 },
          ingredients: [
            { ingredientSlug: 'beans', amount: 18 },
            { ingredientSlug: 'milk',  amount: 150 },
          ],
        },
        {
          product: { id: 1 },
          ingredients: [
            { ingredientSlug: 'beans', amount: 18 },
            { ingredientSlug: 'milk',  amount: 250 },
          ],
        },
      ];
      const result = computeAvailability(
        [{ id: 1, documentId: 'latte' }],
        recipes,
        [
          { id: 10, slug: 'beans', quantity: 500 },
          { id: 11, slug: 'milk',  quantity: 900 },
        ],
      );
      expect(result.latte).toBe(6);
    });

    it('falls back from slug to numeric id lookup', () => {
      const result = computeAvailability(
        [{ id: 1, documentId: 'esp' }],
        [{ product: { id: 1 }, ingredients: [{ ingredientId: 10, amount: 18 }] }],
        [{ id: 10, slug: null, quantity: 180 }],
      );
      expect(result.esp).toBe(10);
    });

    it('returns 0 when any required ingredient is missing', () => {
      const result = computeAvailability(
        [{ id: 1, documentId: 'esp' }],
        [{ product: { id: 1 }, ingredients: [{ ingredientSlug: 'beans', amount: 18 }] }],
        [], // no ingredients in DB
      );
      expect(result.esp).toBe(0);
    });

    it('returns 0 when ingredient stock is 0', () => {
      const result = computeAvailability(
        [{ id: 1, documentId: 'esp' }],
        [{ product: { id: 1 }, ingredients: [{ ingredientSlug: 'beans', amount: 18 }] }],
        [{ id: 10, slug: 'beans', quantity: 0 }],
      );
      expect(result.esp).toBe(0);
    });

    it('ignores recipe ingredients with amount ≤ 0 (non-constraining)', () => {
      // Optional "amount: 0" lines must not starve the variant.
      const result = computeAvailability(
        [{ id: 1, documentId: 'esp' }],
        [{
          product: { id: 1 },
          ingredients: [
            { ingredientSlug: 'beans', amount: 18 },
            { ingredientSlug: 'ghost', amount: 0 }, // does not constrain
          ],
        }],
        [{ id: 10, slug: 'beans', quantity: 180 }],
      );
      expect(result.esp).toBe(10);
    });

    it('parses string quantities (Strapi decimal serialization)', () => {
      const result = computeAvailability(
        [{ id: 1, documentId: 'esp' }],
        [{ product: { id: 1 }, ingredients: [{ ingredientSlug: 'beans', amount: 18 }] }],
        [{ id: 10, slug: 'beans', quantity: '180.0' as any }],
      );
      expect(result.esp).toBe(10);
    });
  });

  // ────────────────────────────────────────────────────────
  // Untracked products
  // ────────────────────────────────────────────────────────
  describe('untracked products', () => {
    it('returns null when product has no recipes and no trackInventory', () => {
      const result = computeAvailability(
        [{ id: 1, documentId: 'misc' }],
        [],
        [],
      );
      expect(result.misc).toBeNull();
    });

    it('returns 0 (not null) when product has recipes but no valid variant', () => {
      // Recipe exists but its ingredients list is empty → cannot be built.
      const result = computeAvailability(
        [{ id: 1, documentId: 'broken' }],
        [{ product: { id: 1 }, ingredients: [] }],
        [],
      );
      expect(result.broken).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────
  // Multi-product scenarios
  // ────────────────────────────────────────────────────────
  describe('multi-product scenarios', () => {
    it('computes correctly for mixed product types in one pass', () => {
      const result = computeAvailability(
        [
          { id: 1, documentId: 'water',  trackInventory: true, stockQuantity: 10 },
          { id: 2, documentId: 'esp' },      // recipe
          { id: 3, documentId: 'sticker' },  // no tracking, no recipe
        ],
        [{ product: { id: 2 }, ingredients: [{ ingredientSlug: 'beans', amount: 18 }] }],
        [{ id: 10, slug: 'beans', quantity: 360 }],
      );
      expect(result).toEqual({
        water:   10,
        esp:     20,
        sticker: null,
      });
    });
  });
});
