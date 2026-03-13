# Suppliers Page — Production Improvement Plan

## Status: IN PROGRESS

---

## Phase 1 — Backend (Priority 1)

### 1.1 Add `expectedAt` to Supply schema
- File: `backend/src/api/supply/content-types/supply/schema.json`
- Add: `expectedAt: datetime` — when the delivery is expected to arrive
- Workers need this field most urgently

### 1.2 Create Supplier content type
New collection: `api::supplier.supplier`

Fields:
- `name` — string, required, unique
- `slug` — uid(name)
- `contactPerson` — string (who to call)
- `phone` — string (tap-to-call)
- `telegram` — string (@handle for Telegram deep link)
- `email` — string
- `website` — string
- `address` — text
- `category` — string (Dairy / Coffee / Packaging / etc.)
- `paymentTerms` — text (Prepaid / Net-14 / etc.)
- `notes` — text (operational notes)
- `isActive` — boolean, default: true
- `reorderEveryDays` — integer (how often to reorder: 7/14/30)
- `minimumOrderAmount` — decimal
- `supplies` — oneToMany → supply
- `cafe` — manyToOne → cafe

### 1.3 Update Supply schema
- Replace `supplierName: string` with `supplier: manyToOne → Supplier`
- Keep `supplierName` as deprecated fallback for existing records

### 1.4 Add Supplier to ensurePermissions
- File: `backend/src/index.ts`
- Add `api::supplier.supplier` to content types array

---

## Phase 2 — Frontend API + Hooks (Priority 2)

### 2.1 Create `frontend/lib/api/suppliers.ts`
- Types: `Supplier`, `SupplierCreateData`, `SupplierUpdateData`
- Methods: `getAll()`, `getOne(documentId)`, `create(data)`, `update(documentId, data)`, `delete(documentId)`

### 2.2 Create `frontend/lib/hooks/useSuppliers.ts`
- `useSuppliers()` — list
- `useSupplier(documentId)` — single
- `useCreateSupplier()` — mutation
- `useUpdateSupplier()` — mutation
- `useDeleteSupplier()` — mutation

### 2.3 Update Supply type
- Add `expectedAt?: string` to `Supply` type
- Add `supplier?: Supplier` populated object to `Supply` type

---

## Phase 3 — UI (Priority 3)

### 3.1 SupplierFormModal (new component)
Fields: name, contactPerson, phone, telegram, email, category, paymentTerms, notes, reorderEveryDays, isActive

### 3.2 SupplierDetailModal — overhaul
New structure:
1. **Contact strip** (top, most important)
   - Phone → `tel:` link (tap to call)
   - Telegram → `https://t.me/...` deep link
   - Contact person name
   - Email → `mailto:` link
2. **Next delivery status** (highlighted card)
   - If shipped/ordered: "В дорозі / Очікується: {expectedAt}"
   - If draft: "Час замовляти" warning
   - If all received: "Наступне замовлення: {lastDeliveryDate + reorderEveryDays}"
3. **Active deliveries** (pending only, default)
   - Show expectedAt column
   - Inline "Отримано" button for shipped items
4. **History** (collapsed by default)
   - All past deliveries
   - Stats (total spent, received count) — here, not at top
5. **Footer actions**
   - "Нова поставка від {name}"
   - "Редагувати постачальника" → opens SupplierFormModal

### 3.3 SuppliersPage — column overhaul
Remove: total deliveries count, received count, total spent, last delivery date
Add:
- **Контакт** (phone or telegram, tap target)
- **Статус** (badge: В дорозі / Замовлено / Очікується / —)
- **Очікується** (expectedAt of nearest active supply)

Sort order:
1. shipped (most urgent — in transit)
2. ordered
3. draft pending
4. all-received (by last delivery date desc)

Summary stats: replace 4-stat grid with single status banner:
"N постачальників очікують поставку" (only when > 0)

### 3.4 SuppliersPage — add CRUD
- "Додати постачальника" button → opens SupplierFormModal (create)
- Edit/Delete buttons per row (visible on hover, like other pages)

---

## Implementation Order

- [x] Phase 1.1: Add expectedAt to Supply schema
- [x] Phase 1.2: Create Supplier content type
- [x] Phase 1.3: Update Supply schema (add supplier relation)
- [x] Phase 1.4: Add to ensurePermissions
- [x] Phase 2.1: suppliers.ts API
- [x] Phase 2.2: useSuppliers hooks
- [x] Phase 2.3: Update Supply type
- [x] Phase 3.1: SupplierFormModal
- [x] Phase 3.2: SupplierDetailModal overhaul
- [x] Phase 3.3: SuppliersPage columns
- [x] Phase 3.4: SuppliersPage CRUD

---

## Key Files

| File | Change |
|---|---|
| `backend/src/api/supply/content-types/supply/schema.json` | Add expectedAt |
| `backend/src/api/supplier/...` | New content type (scaffold) |
| `backend/src/index.ts` | Add supplier to ensurePermissions |
| `frontend/lib/api/suppliers.ts` | New API module |
| `frontend/lib/hooks/useSuppliers.ts` | New hooks |
| `frontend/components/organisms/SupplierFormModal/` | New component |
| `frontend/components/organisms/SupplierDetailModal/SupplierDetailModal.tsx` | Overhaul |
| `frontend/app/admin/suppliers/page.tsx` | Column + CRUD overhaul |
