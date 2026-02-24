# Plan: Products & Ingredients Tables Refactor

> Status: READY TO IMPLEMENT
> Date: 2026-02-24

---

## Root Cause Analysis

### Products table — why columns are useless

| Column | Problem | Root cause |
|---|---|---|
| **Тип** | Always "Товар" | `inventoryType` doesn't exist in backend schema (field is `undefined` → always falls to `'simple'`) |
| **Залишок** | Always "Немає" | `stockQuantity = 0` for all products; coffee shop uses ingredient deduction, not product stock |
| **Статус** | Always "Активний" | All seed products have `isActive: true`; no inactive products exist |
| **Ціна** | "₴55собі: ₴15" merged | Two `<Text>` inline inside table cell (no block wrapping) |

Backend schema for Product has **no `inventoryType` field** — it has `trackInventory: boolean` + `stockQuantity: integer`.
The product-level stock is irrelevant for a recipe-based coffee shop (stock is tracked via Ingredients).

### Ingredients table — problems

1. **No row-click detail modal** — ingredients table has no `onRowClick`, unlike products
2. **Column "Мін. запас"** is detail info → should move to modal
3. **Column "Постачальник"** is a single string → should move to modal + handle multiple
4. **`supplier` field** = single `string` in schema → need UI to show/enter multiple suppliers

---

## Solution Design

### Products table — new columns

| Column | Width | Content |
|---|---|---|
| (thumbnail) | 52px | Image or package icon |
| Назва | flex | Name bold + Category caption below |
| Ціна | 80px | `₴{price}` only (no cost) |
| Маржа | 80px | `{margin}%` colored green ≥50% / yellow ≥30% / red <30% |
| Дії | 80px | Edit + Delete |

**Removed:** Тип, Залишок, Статус
**Cost & margin detail** → stays in ProductDetailModal (already there)

### Ingredients table — new columns

| Column | Width | Content |
|---|---|---|
| Назва | flex | Name + "Мало" badge if `qty ≤ minQty` |
| Категорія | 130px | Category name (hidden mobile) |
| Залишок | 160px | `{qty} {unit}` + mini progress bar (qty/minQty, capped at 200%) |
| Ціна/од | 100px | `₴{cost}/{unit}` (hidden mobile) |
| Дії | 80px | Edit + Delete |

**Removed from table:** Мін. запас, Постачальник
**Row click** → opens new IngredientDetailModal

### IngredientDetailModal (new component)

Structure:
```
[Header] Name — Category chip

[Section: Запаси]
  Current stock: {qty} {unit}   Status badge (OK / Мало / Немає)
  Min. stock:   {minQty} {unit}
  Stock level bar:  ████████░░  {pct}%
  Total value:  ₴{qty × costPerUnit}

[Section: Фінанси]
  Ціна/одиниця: ₴{costPerUnit}/{unit}
  Вартість мін. запасу: ₴{minQty × costPerUnit}

[Section: Постачальники]
  Chips: [ Кава Україна ] [ Monin ]    (parsed from comma-separated `supplier` field)
  Empty: "—"

[Footer]
  [Edit] button → opens IngredientFormModal
```

### Multiple suppliers approach (no backend schema change)

- `ingredient.supplier` stores comma-separated string: `"Кава Україна, Monin"`
- Frontend parses: `supplier.split(',').map(s => s.trim()).filter(Boolean)`
- Display: Badge chips in modal
- Edit form: tag-style input — click [+] to add, [×] to remove each tag; saved as comma-separated string
- Max 200 chars (existing constraint) — sufficient for ~5–6 supplier names

---

## Files to change

### Step 1 — Products table (page.tsx only)
**File:** `frontend/app/admin/products/page.tsx`
- Remove `type`, `stock`, `status` columns from `productColumns`
- Fix `price` column: show only `₴{price}`
- Add `margin` column: `((price - costPrice) / price * 100)`, colored, hidden on mobile
- Update `productToUnified`: remove `inventoryType`, `quantity`, `minQuantity` (no-op, just stop using them in table)

### Step 2 — Products CSS (page.module.css)
**File:** `frontend/app/admin/products/page.module.css`
- Add `.margin` class (tabular-nums)
- Add `.marginGood` / `.marginWarn` / `.marginBad` color variants

### Step 3 — Ingredients table columns (page.tsx)
**File:** `frontend/app/admin/products/page.tsx`
- Remove `minQuantity` and `supplier` columns from `ingredientColumns`
- Replace `quantity` cell with qty + inline progress bar
- Add `onRowClick` to ingredients DataTable → opens `selectedIngredient` state

### Step 4 — Stock progress bar CSS (page.module.css)
**File:** `frontend/app/admin/products/page.module.css`
- Add `.stockCell`, `.stockBar`, `.stockBarFill`, `.stockBarFillLow`, `.stockBarFillCritical`

### Step 5 — IngredientDetailModal component (new)
**File:** `frontend/components/organisms/IngredientDetailModal/IngredientDetailModal.tsx`
**File:** `frontend/components/organisms/IngredientDetailModal/IngredientDetailModal.module.css`
**File:** `frontend/components/organisms/IngredientDetailModal/index.ts`
- Modal with 3 sections: Запаси, Фінанси, Постачальники
- Edit button in footer → closes modal, opens IngredientFormModal
- Uses existing `Modal` atom

### Step 6 — Export IngredientDetailModal
**File:** `frontend/components/organisms/index.ts`
- Add `export * from './IngredientDetailModal';`

### Step 7 — Wire IngredientDetailModal in products page
**File:** `frontend/app/admin/products/page.tsx`
- Add `selectedIngredient` state
- Pass `onRowClick={(ing) => setSelectedIngredient(ing)}` to ingredients DataTable
- Render `<IngredientDetailModal>` when `selectedIngredient !== null`
- Pass `onEdit={(ing) => { setSelectedIngredient(null); setIngredientModal(...) }}` prop

### Step 8 — IngredientFormModal tag input for suppliers
**File:** `frontend/components/organisms/IngredientFormModal/IngredientFormModal.tsx`
- Replace the single-text supplier input with a tag-chip input
- Tags array state; join with `, ` when submitting
- Parse existing value on edit: `split(',').map(trim)`
- CSS: supplier tag chips with × button

---

## Implementation order

1. Step 1+2: Fix products table (quickest win, purely additive/subtractive)
2. Step 3+4: Fix ingredients table columns + stock bar
3. Step 5+6: Build IngredientDetailModal component
4. Step 7: Wire modal into products page
5. Step 8: Upgrade IngredientFormModal supplier field

---

## Out of scope (this plan)

- Backend `suppliers` array field migration — not needed, comma-string is sufficient
- Product `inventoryType` backend field — not needed, column removed from table
- `trackInventory` / `stockQuantity` product fields — move to product form modal only if needed
