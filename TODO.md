# CoffeePOS — Developer Context & TODO

> Актуальний стан системи для відновлення контексту між сесіями.
> Оновлено: 2026-03-15

---

## Стек

- **Frontend**: Next.js 15, `'use client'` компоненти, CSS Modules
- **Backend**: Strapi v5 (documentId = UUID в роутах, числовий `id` в DB queries)
- **Стан**: Zustand (`shiftStore`, `orderStore`, `notificationStore`)
- **Запити**: React Query (TanStack Query v5)
- **CSS**: тільки `*.module.css` + CSS-змінні дизайн-системи (`--space-*`, `--color-*`, `--radius-*`). ЗАБОРОНЕНО: `!important`, inline style для дизайнерських рішень.
- **Специфічність CSS**: compound-selectors замість `!important` (`.chip.chipActive` б'є `.chip`)

---

## Ключові патерни

### Навігація (AppShell)
- **main**: Каса → Історія → Продукція → **Поставки** (admin)
- **management**: Аналітика → Працівники → **Рецепти** (admin)

### Shift lifecycle
- Відкриття: `ShiftGuard` на сторінці Каса → `useShiftStore().openShift()`
- Закриття: `ShiftCloseModal` на сторінці **Профіль** → "Закрити зміну" button у hero card → `useShiftStore().closeShift()`
- Backend route: `POST /shifts/:documentId/close` — контролер шукає shift через `where: { documentId: id }` ✅ (виправлено)

### PickerItem (Поставки)
Уніфікований тип для picker — інгредієнти + готові продукти:
```ts
interface PickerItem {
  documentId: string;      // 'prod:' prefix for products
  rawDocumentId: string;
  name, unit, category, supplier, imageUrl, costPerUnit
  kind: 'ingredient' | 'product'
}
```
Готові продукти (`inventoryType !== 'recipe'`) фільтруються на рівні API:
```ts
useProducts({ pageSize: 200, isActive: true, inventoryType: 'not_recipe' })
```
API параметр `inventoryType: 'not_recipe'` → `filters[inventoryType][$ne]=recipe`

---

## Зміни за останні сесії

### Session 2026-03-15 (поточна)

#### ✅ Навігація (AppShell.tsx)
- "Поставки" → main nav під "Продукцією"
- "Рецепти" → "Управління" секція

#### ✅ KPI працівників (employees/page.tsx + page.module.css)
- Rank badges: `.rankBadge` + `.rank1/.rank2/.rank3` (gold/silver/bronze)
- Row tints: `.perfRow1/.perfRow2/.perfRow3` через `getRowClassName` DataTable prop
- Initials avatar: `.perfAvatar` (36px circle)
- Sales bar: 5px висота, gradient fill
- **Нова колонка "Ефект."**: composite score = `salesNorm*0.5 + ordersNorm*0.3 + avgNorm*0.2`
  - Зелений ≥80%, жовтий ≥50%, сірий <50%
  - CSS: `.efficiencyCell`, `.effBar`, `.effBarFill`, `.effHigh/.effMid/.effLow`

#### ✅ TaskWidget (TaskWidget.tsx + module.css)
- Порожній стан модалки: Icon + текст
- Порожній стан sidebar card: `<div className={styles.cardEmptyState}>`
- Preview rows: ініціали виконавця chip `.previewAssignee`

#### ✅ Календар (dashboard/page.tsx + module.css)
- `min-height` 96px для dayCell
- Today: `box-shadow: inset 0 0 0 1.5px color-mix(...)`
- `.dayRevenue` клас (tabular-nums, nowrap)
- Прибрано `!important` (compound selector specificity)

#### ✅ Поставки picker (suppliers/page.tsx + page.module.css)
- `PickerItem` уніфікований тип (ingredients + products)
- `readyProducts` — API-level filter `inventoryType: 'not_recipe'`
- Ціни в picker: підказка під назвою
- Invoice: `invoiceLineName` flex-column, `invoiceLineTotal` колонка
- Прибрана колонка "Витрачено" з таблиці постачальників

#### ✅ SupplierDetailModal
- Замінено accordion (`expandedId`) на modal (`selectedSupply`)
- `selectedSupply: Supply | null` state + `<Modal>` з деталями поставки
- CSS: `.supplyDetailBody`, `.supplyDetailMeta`

#### ✅ Shift close — Backend bug fix
- `backend/src/api/shift/controllers/shift.ts`
- `findOne({ where: { id } })` → `findOne({ where: { documentId: id } })`
- `update({ where: { id } })` → `update({ where: { id: shift.id } })` (числовий id)

#### ✅ ShiftCloseModal — з'явився у UI
- `app/profile/page.tsx`: додано кнопку "Закрити зміну" у hero card (тільки якщо зміна відкрита)
- `ShiftCloseModal` монтується в ProfilePage
- CSS: `.heroShiftBar`, `.heroShiftInfo` в `profile/page.module.css`

#### ✅ Recipe modal X buttons
- `RecipeFormModal.tsx`: `variant="danger"` → `variant="ghost"` + `className={styles.removeButton}`
- CSS: кнопка сіра за замовчуванням, червоніє при hover (no red circles)
- Footer: прибрано inline styles → `.footer`, `.footerDelete`, `.footerSave`

---

## Відомі обмеження / TODO

### History page
- Сторінка вже використовує реальні дані (`useOrders` hook → Strapi API) ✅
- "Мокові" дані — це реальні записи в БД із seed/тестових замовлень
- Стара відкрита зміна (545г) — виникає через стару DB-запис; тепер закриття через Профіль

### Activities endpoint
- `activitiesApi` в `lib/api/activities.ts` викликає `/api/activities` якого не існує як окремого Strapi endpoint
- Реальні activities зберігаються в `shift.activities` (JSON array)
- Dashboard використовує `useDailyReport` → `/api/reports/daily` (повертає activities з shifts) ✅
- `useActivities` hook — dead code, не використовується

### POS mock fallback
- `app/pos/page.tsx` має `mockProducts`/`mockCategories` як fallback якщо API недоступний
- Це допустима graceful degradation, не баг

### EmployeePerformance type
- `EmployeePerformance` з `lib/api` має поля: `totalSales`, `totalOrders`, `avgOrderValue`, `shiftsCount`, `totalHours`, `role`, `employeeName`
- Efficiency column обчислюється на фронтенді (не зберігається в БД)

---

## Важливі файли

| Файл | Призначення |
|------|-------------|
| `frontend/app/orders/page.tsx` | Сторінка Історія (real data via useOrders) |
| `frontend/app/profile/page.tsx` | Профіль + ShiftCloseModal |
| `frontend/app/admin/employees/page.tsx` | KPI + efficiency % колонка |
| `frontend/app/admin/suppliers/page.tsx` | Поставки + PickerItem |
| `frontend/app/admin/dashboard/page.tsx` | Аналітика + Календар |
| `frontend/lib/store/shiftStore.ts` | Zustand shift state |
| `frontend/lib/api/products.ts` | `inventoryType: 'not_recipe'` filter |
| `frontend/components/organisms/SupplierDetailModal/` | Modal замість accordion |
| `frontend/components/organisms/RecipeFormModal/` | Ghost X кнопки |
| `frontend/components/organisms/ShiftCloseModal/` | Закрити зміну modal |
| `backend/src/api/shift/controllers/shift.ts` | closeShift documentId fix |
| `backend/src/api/shift/services/shift.ts` | logActivity, addSale, addWriteOff, addSupply |
| `backend/src/api/order/controllers/order.ts` | create (inventory deduction + shift tracking) |
| `backend/src/api/report/controllers/report.ts` | /reports/daily, /reports/monthly |
