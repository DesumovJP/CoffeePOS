# TODO — UI Improvements Plan

## Task 1 — Product table thumbnails
**Files:** `app/admin/products/page.tsx`, `app/admin/products/page.module.css`

- [ ] Add `image?: string` to `UnifiedProduct` interface
- [ ] Include `image` in `productToUnified()` (use `formats.thumbnail.url` → fallback `url`)
- [ ] Insert thumbnail column first in `productColumns` (52px wide, no header text)
  - Shows `<img>` if `product.image` exists
  - Shows icon placeholder (package icon) otherwise
- [ ] Add CSS: `.thumbnail`, `.thumbnailPlaceholder` styles

---

## Task 2 — Employee modal month switcher
**Files:** `backend/src/api/employee/controllers/employee.ts`,
`frontend/lib/api/employees.ts`, `frontend/lib/hooks/useEmployees.ts`,
`frontend/components/organisms/EmployeeDetailModal/EmployeeDetailModal.tsx`

- [ ] Backend `stats` endpoint: read `month` + `year` query params; filter
  shifts/orders to that month's range; daily breakdown = days of that month
- [ ] `employeesApi.getStats(id, { month, year })` — add optional params, pass as QS
- [ ] `useEmployeeStats(id, params?)` — include month/year in query key
- [ ] `EmployeeDetailModal`:
  - Add `selectedMonth / selectedYear` state (default: current)
  - Add month nav UI above StatsGrid (chevron-left | Month YYYY | chevron-right)
  - Cannot navigate beyond current month (future locked)
  - Update chart titles: "за місяць" instead of "за 7 днів"

---

## Task 3 — History page: today-only + expandable orders
**Files:** `app/orders/page.tsx`, `app/orders/page.module.css`

- [ ] Remove `filterCategories`, `selectedFilter` state, `CategoryTabs` component
- [ ] `getDateRange` → hardcode to today only; remove function, inline the date calc
- [ ] Add `expandedOrderId: string | null` state
- [ ] Make each order card a button/clickable row with chevron icon
- [ ] Show expanded items list when `order.id === expandedOrderId`
  - Each item: name, quantity × price = total
- [ ] Add CSS: `.accordionTrigger`, `.accordionChevron`, `.accordionChevronOpen`,
  `.itemsList`, `.itemRow`, `.itemName`, `.itemPrice`

---

## Order of implementation
1. Task 1 (standalone, easiest)
2. Task 3 (no backend changes)
3. Task 2 (requires both backend + frontend)
