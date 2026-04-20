# CoffeePOS — Architecture

> Last updated: 2026-04-20

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js 16 Frontend (React 19)                        │  │
│  │  Zustand 5 │ React Query 5 │ CSS Modules + Tailwind v4 │  │
│  │  14 pages │ ~52 components │ Atomic Design              │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│      Vercel             │ HTTPS + JWT Bearer                  │
│  coffee-pos-ten.vercel.app                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────┐
│  Strapi 5.34 (Railway)  │                                     │
│  coffeepos-production-c0e1.up.railway.app                     │
│  Auth → 18 Content Types + Custom Controllers                 │
│  Orders(FSM) │ Shifts │ Reports │ Inventory │ Tasks           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Railway addon)                            │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  DigitalOcean Spaces (S3-compatible media storage)     │   │
│  │  Bucket: mymediastorage / Root: coffeepos/             │   │
│  │  https://mymediastorage.fra1.digitaloceanspaces.com    │   │
│  └────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| State | Zustand | 5.0.10 |
| Server State | TanStack React Query | 5.x |
| Charts | Recharts | latest |
| Styling | CSS Modules + Tailwind v4 | — |
| Backend | Strapi | 5.34.0 |
| Database | PostgreSQL | 17 |
| Media Storage | DigitalOcean Spaces (@strapi/provider-upload-aws-s3) | — |
| Language | TypeScript | 5.x |
| Backend Deploy | Railway (Docker, multi-stage) | — |
| Frontend Deploy | Vercel | — |

## Production URLs

| Service | URL |
|---|---|
| Frontend | https://coffee-pos-ten.vercel.app |
| Backend API | https://coffeepos-production-c0e1.up.railway.app |
| Strapi Admin | https://coffeepos-production-c0e1.up.railway.app/admin |
| Health Check | https://coffeepos-production-c0e1.up.railway.app/_health |
| Media (DO Spaces) | https://mymediastorage.fra1.digitaloceanspaces.com/coffeepos/ |

## Database Schema (18 Content Types)

### Core Business

| Content Type | Description | Key Relations |
|---|---|---|
| **category** | Product categories (Гарячі напої, Холодні, Кондитерка, Гріль) | → products (1:N) |
| **product** | Menu items with `inventoryType` enum (`none`/`simple`/`recipe`) | → category (N:1), → modifier-groups (M:N) |
| **modifier-group** | Groups of modifiers (Size, Milk) | → modifiers (1:N), → products (M:N) |
| **modifier** | Individual modifiers (Oat milk +₴15) | → modifier-group (N:1) |
| **supplier** | Ingredient suppliers | ↔ ingredients (M:N) |
| **cafe** | Coffee shop location | Referenced by orders, shifts, tables |
| **cafe-table** | Physical tables (number, seats, zone) | → cafe (N:1) |

### Orders & Payments

| Content Type | Description | Key Relations |
|---|---|---|
| **order** | Customer orders with status FSM | → order-items (1:N), → payment (1:1), → shift (N:1) |
| **order-item** | Line items | → order (N:1), → product (N:1) |
| **payment** | Payment records (cash/card/qr) | → order (1:1) |

### Inventory & Recipes

| Content Type | Description | Key Relations |
|---|---|---|
| **ingredient-category** | Ingredient groupings (Кава, Молочні, Овочі, etc.) | → ingredients (1:N) |
| **ingredient** | Raw materials + stock tracking | → ingredient-category (N:1), ↔ suppliers (M:N) |
| **recipe** | Variant-based product recipes (variant + ingredients + cost) | → product (N:1) |
| **inventory-transaction** | Stock movement audit log | → ingredient, → shift |

### Operations

| Content Type | Description |
|---|---|
| **shift** | Work shifts with cash tracking and activity logging |
| **supply** | Ingredient deliveries |
| **write-off** | Ingredient losses |
| **task** | Staff tasks (Kanban) |

## Recipe & Variant System

Recipes define **variants** of a product — different sizes, preparation styles, etc. Each recipe variant has its own ingredients and price.

### Recipe Schema

| Field | Type | Description |
|---|---|---|
| `variantId` | string | Machine-readable ID (`s`, `m`, `l`, `standard`, `spicy`) |
| `variantName` | string | Display name (`S`, `M`, `L`, `Стандарт`) |
| `variantDescription` | string? | Additional info (`250 мл`, `30 см`) |
| `price` | decimal | Selling price for this variant |
| `costPrice` | decimal | Auto-calculated from ingredients |
| `isDefault` | boolean | Default variant for the product |
| `ingredients` | JSON | Array of `{ ingredientSlug, ingredientId, amount }` |
| `product` | relation | → Product (N:1) |

### Lifecycle Hooks (`recipe/lifecycles.ts`)

| Hook | Action |
|---|---|
| `beforeCreate` / `beforeUpdate` | Auto-calculate `costPrice` = Σ(ingredient.costPerUnit × amount) |
| `afterCreate` / `afterUpdate` | Set linked product's `inventoryType = 'recipe'` |

### Ingredient Lifecycle Hooks (`ingredient/lifecycles.ts`)

| Hook | Action |
|---|---|
| `afterUpdate` | If `costPerUnit` changed, recalculate `costPrice` on all recipes using this ingredient |

### Product `inventoryType` Enum

| Value | Meaning | Set By |
|---|---|---|
| `none` | Default, not categorized | — |
| `simple` | Physical/purchased goods (pastry, sandwiches) | Bootstrap migration |
| `recipe` | Made in-house from recipe (drinks) | Recipe lifecycle hook or bootstrap |

Used for server-side filtering: `inventoryType: 'not_recipe'` on Products/Suppliers pages excludes recipe-based products (drinks) from inventory management views.

### Ingredient ↔ Supplier Relation

ManyToMany relation: each ingredient can have multiple suppliers, each supplier serves multiple ingredients. Replaced the old freetext `supplier` string field.

## Custom API Endpoints

| Method | Path | Description |
|---|---|---|
| `PUT` | `/api/orders/:id/status` | Update order status (FSM) |
| `POST` | `/api/shifts/open` | Open shift |
| `POST` | `/api/shifts/:id/close` | Close shift + cash reconciliation |
| `GET` | `/api/shifts/current` | Get open shift |
| `POST` | `/api/supplies/:id/receive` | Receive supply, add stock |
| `POST` | `/api/tasks/:id/complete` | Complete task |
| `GET` | `/api/ingredients/low-stock` | Low stock items |
| `GET` | `/api/reports/daily` | Daily report (orders, shifts, writeOffs, supplies, activities, summary) |
| `GET` | `/api/reports/monthly` | Monthly calendar report |
| `GET` | `/api/reports/products` | Product analytics |
| `GET` | `/api/reports/x-report` | Mid-shift report |
| `GET` | `/api/reports/z-report` | End-of-shift report |
| `GET` | `/_health` | Health check (public) |

## Bootstrap Migrations

Idempotent migrations that run on every server start:

| Migration | Description |
|---|---|
| `ensurePermissions` | Auto-configure public/authenticated permissions for all content types + custom endpoints |
| `migrateCategoriesV2` | Consolidate 8 old product categories → 4 new ones |
| `migrateProductInventoryTypes` | Tag products with `inventoryType` based on recipe presence |
| `migrateRecipeVariantFields` | Copy data from old `size_id/size_name/size_volume` columns to new `variant_id/variant_name/variant_description` |
| `migrateIngredientSupplierRelations` | Convert old freetext `supplier` strings to manyToMany join-table entries |
| `ensureEmployees` | Seed 5 employees if missing |
| `ensureDailyShifts` | Auto-create closed shifts for past days with orders but no shift |

## Frontend Pages (14)

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Auth (email + password) |
| `/pos` | POS terminal — product grid with VariantPicker, order cart, payment |
| `/orders` | Order history — compact OrderCard list + detail modal + stats strip |
| `/tasks` | Kanban board |
| `/admin/dashboard` | Analytics (Огляд + Календар tabs, day-detail modal) |
| `/admin/products` | Products tab (category filter) + Ingredients tab (category + supplier filters) |
| `/admin/recipes` | Recipe management — category filter chips, variant/ingredients/cost per recipe |
| `/admin/suppliers` | Suppliers tab + Orders tab (supplier-first ingredient ordering + CSV export) |
| `/admin/employees` | Employee CRUD + KPI performance table |
| `/admin/reports` | Monthly calendar, X/Z reports |
| `/admin/inventory` | Inventory overview |
| `/profile` | User profile + shift schedule |

## Frontend API Compatibility Layer

The frontend API layer normalizes responses to work with both old and new backend schemas during rolling deployments:

### Recipes (`lib/api/recipes.ts`)
`normalizeRecipe()` maps old field names to new:
- `sizeId` → `variantId`, `sizeName` → `variantName`, `sizeVolume` → `variantDescription`
- Uses `??` fallback: `raw.variantId ?? raw.sizeId`

### Ingredients (`lib/api/ingredients.ts`)
`normalizeIngredient()` converts old freetext supplier to relation format:
- If `suppliers` array exists and has entries → use as-is
- If old `supplier` string exists → split by comma, create synthetic `{ id, name }` objects

### Products (`lib/api/products.ts`)
`inventoryType: 'not_recipe'` filter with graceful fallback:
- Sends `$or` filter: `inventoryType ≠ 'recipe' OR inventoryType IS NULL`
- If backend returns 400 (field unknown) → retries without filter

## Business Logic

### Order State Machine

```
pending → confirmed → preparing → ready → completed
    ↓         ↓           ↓
 cancelled  cancelled  cancelled
```

### Order Creation Flow

1. Validate input
2. Calculate discounts (percentage/fixed)
3. Create Order → Items → Payment
4. Deduct ingredients via Recipe lookup
5. Create InventoryTransaction per ingredient
6. Update Shift totals

### Inventory Deduction on Sale

When an order is paid, the backend deducts ingredient quantities automatically via `orderService.deductInventory(orderId, items, shiftId)` called from `order/controllers/order.ts`.

**Lookup strategy (stable IDs only — numeric `id` changes on reseed):**

| Entity | Stable identifier | Fallback |
|---|---|---|
| Product → Recipe | `productDocumentId` (Strapi UUID) | numeric `product.id` |
| Recipe → Ingredient | `ingredientSlug` (human-readable slug) | numeric `ingredientId` |

**Flow per order item:**
1. Find Recipes where `product.documentId = item.productDocumentId`
2. Select the Recipe matching `item.variantId`, else the default Recipe, else the first Recipe
3. For each `{ingredientSlug, amount}` in `recipe.ingredients`:
   - Find Ingredient by `slug = ingredientSlug`
   - Deduct `amount × quantity` from `ingredient.quantity` (floor at 0)
   - Create `InventoryTransaction { type: 'sale', ingredient, product, quantity: -deducted, previousQty, newQty, reference: 'ORD-{id}' }`

**Frontend → Backend data flow:**
- `OrderItem.productDocumentId` — set in Zustand store when adding items to cart
- Passed in `ordersApi.create()` payload under `items[].productDocumentId`
- `variantId` passed alongside to select the correct variant Recipe

**Seed data:** Recipe ingredients stored as `{ ingredientSlug, ingredientId, amount }` — slug is authoritative for lookups, `ingredientId` kept for audit/display.

**Low-stock alerts:** `GET /api/ingredients/low-stock` returns ingredients where `quantity ≤ minQuantity`.

### Activity Logging

Shift-scoped activity log stored as JSON array in `shift.activities` field. Each activity has `id`, `type`, `timestamp`, and `details`. Every CRUD action performed while a shift is open is recorded into that shift's activity list so the Dashboard day-detail modal renders a complete audit trail.

**Operational events (order/supply/writeoff/shift):**

| Activity Type | Trigger |
|---|---|
| `order_create` | New order created |
| `order_status` | Order status change |
| `order_cancel` | Order cancelled |
| `supply_receive` | Supply received (stock added) |
| `writeoff_create` | Write-off created (stock deducted) |
| `shift_open` | Shift opened |
| `shift_close` | Shift closed |

**Admin CRUD events** (logged from core controllers via `logCurrentShiftActivity`):

| Entity | Types |
|---|---|
| Product | `product_create`, `product_update`, `product_delete` |
| Category | `category_create`, `category_update`, `category_delete` |
| Modifier | `modifier_create`, `modifier_update`, `modifier_delete` |
| ModifierGroup | `modifier_group_create`, `modifier_group_update`, `modifier_group_delete` |
| Ingredient | `ingredient_create`, `ingredient_update`, `ingredient_delete`, `ingredient_adjust` (stock changed) |
| IngredientCategory | `ingredient_category_create`, `ingredient_category_update`, `ingredient_category_delete` |
| Recipe | `recipe_create`, `recipe_update`, `recipe_delete` |
| Employee | `employee_create`, `employee_update`, `employee_delete` |
| Supplier | `supplier_create`, `supplier_update`, `supplier_delete` |
| Task | `task_create`, `task_update`, `task_complete`, `task_delete` |
| CafeTable | `table_create`, `table_update`, `table_delete` |

Total: **41 activity types**.

**Utility**: `backend/src/utils/activity.ts` — `ActivityType`, `Activity` interface, `generateActivityId()` helper.

**Service**: `backend/src/api/shift/services/shift.ts`
- `logActivity(shiftId, type, details)` — prepends activity to a specific shift's JSON array
- `logCurrentShiftActivity(type, details)` — finds the currently open shift and logs to it; no-op if no open shift (admin CRUD outside a shift is silently ignored)

**Frontend rendering**: `components/molecules/ActivityInline` maps each type to an icon + Ukrainian label; `getSummary()` produces a one-line description. Generic fallback uses `details.name || details.title || details.number` + optional `user`.

### Shift Lifecycle

```
OPEN  → validates no existing open shift, logs shift_open activity
ACTIVE → tracks: sales, write-offs, supplies; logs activities per action
CLOSE  → records closingCash, calculates difference, logs shift_close activity
```

## Deployment

### Backend (Railway)

- **Builder**: Docker (multi-stage, `backend/Dockerfile`)
- **Base**: `node:20-alpine`
- **Build**: `npm ci` → `strapi build` → production stage with `npm ci --omit=dev`
- **Config**: compiled `.ts` → `.js` via TypeScript, copied to `./config/`, `./src/`, `./build/`
- **Custom routes**: separate `custom.ts` files (Strapi 5.34 doesn't support array exports)
- **Seed**: `SEED_DATABASE=true` on first deploy only, then set to `false`
- **Media**: `@strapi/provider-upload-aws-s3` → DigitalOcean Spaces (S3-compatible)

### Frontend (Vercel)

- **Root directory**: `frontend`
- **Framework**: Next.js (auto-detected)
- **Env vars**: `NEXT_PUBLIC_STRAPI_URL` (Railway URL)
- **API Proxy**: Next.js rewrites `/api/*` → Strapi backend (avoids CORS). Only active when `NEXT_PUBLIC_STRAPI_URL` ≠ `http://localhost:1337`.

### Environment Variables (Railway)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Railway PostgreSQL (auto via `${{Postgres.DATABASE_URL}}`) |
| `DATABASE_SSL` | `true` |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `false` (Railway self-signed certs) |
| `HOST` | `0.0.0.0` |
| `PORT` | `1337` |
| `NODE_ENV` | `production` |
| `PUBLIC_URL` | Railway public domain |
| `FRONTEND_URL` | Vercel domain (for CORS) |
| `APP_KEYS` | 2 base64 keys, comma-separated |
| `API_TOKEN_SALT` | base64 secret |
| `ADMIN_JWT_SECRET` | base64 secret |
| `TRANSFER_TOKEN_SALT` | base64 secret |
| `JWT_SECRET` | base64 secret |
| `ENCRYPTION_KEY` | base64 secret |
| `SEED_DATABASE` | `false` (only `true` on first deploy) |
| `DO_SPACE_BUCKET` | `mymediastorage` |
| `DO_SPACE_ENDPOINT` | `https://fra1.digitaloceanspaces.com` |
| `DO_SPACE_KEY` | DO Spaces access key |
| `DO_SPACE_SECRET` | DO Spaces secret key |
| `DO_SPACE_REGION` | `fra1` |
| `DO_SPACE_ROOT_PATH` | `coffeepos` |
| `DO_SPACE_CDN` | `https://mymediastorage.fra1.digitaloceanspaces.com` |

## Security

- JWT auth via Strapi Users & Permissions
- Input validation + sanitization on all custom endpoints
- CORS restricted to `FRONTEND_URL`
- Security headers via Strapi middleware (CSP allows DO Spaces domain)
- Robots: `noindex, nofollow`

## Seed Data

| Entity | Count |
|---|---|
| Categories | 4 (Гарячі напої, Холодні, Кондитерка, Гріль) |
| Products | 24 |
| Ingredients | 26 |
| Ingredient Categories | 7 |
| Recipes | 30 (variant-based) |
| Suppliers | 5 |
| Tables | 12 |
| Modifier groups | 3 (Розмір, Молоко, Додатки) |
| Modifiers | 11 |
| Cafes | 1 (Paradise Coffee — Центр) |
| Users | 3 (owner / manager / barista) |
| Employees | 5 |

### Default Users

| Email | Password | Role |
|---|---|---|
| owner@coffeepos.com | Password123! | Owner |
| manager@coffeepos.com | Password123! | Manager |
| barista@coffeepos.com | Password123! | Barista |

## Notification System

### Overview

Client-side notification layer — all state lives in the browser (Zustand + localStorage). No backend persistence.

### NotificationStore (`frontend/lib/store/notificationStore.ts`)

Zustand store persisted to `paradise-pos-notifications` localStorage key (last 50 items).

**Notification shape:**

| Field | Type | Notes |
|---|---|---|
| `id` | string | `notif-{timestamp}-{random}` |
| `type` | NotificationType | 14 types (see below) |
| `priority` | NotificationPriority | `critical` / `high` / `normal` / `low` / `info` |
| `title` | string | Short heading |
| `message` | string | Detail text |
| `read` | boolean | false on creation |
| `actionUrl` | string? | Navigates on click |
| `expiresAt` | string? | ISO date; auto-cleared by `clearExpired()` |
| `source` | string? | e.g. `'shift'` |
| `data` | Record? | Arbitrary payload |

**14 Notification types** and their default priority:

| Type | Priority | Meaning |
|---|---|---|
| `out_of_stock` | critical | Ingredient completely out |
| `error` | critical | App/API error |
| `low_stock` | high | Ingredient below minimum |
| `warning` | high | Generic warning |
| `supply_received` | normal | Incoming supply recorded |
| `supply_expected` | normal | Delivery expected |
| `supply_ordered` | normal | Order sent to supplier |
| `order_completed` | normal | Order paid (expires 30 min) |
| `success` | normal | Generic success (expires 10 min) |
| `high_sales` | normal | Sales milestone |
| `system` | normal | System message |
| `shift_action` | low | Shift open/close |
| `info` | low | Informational |
| `order_cancelled` | — | Order cancelled |

**8 Quick creator methods:**

```ts
notifyLowStock(itemName, current, min, unit)   // → /admin/inventory
notifyOutOfStock(itemName)                      // → /admin/inventory
notifySupplyReceived(supplierName, totalItems)
notifySupplyOrdered(supplierName)
notifyShiftAction(action, performer, details?)
notifyOrderCompleted(orderNumber, total)        // expires 30 min
notifyError(title, message)
notifySuccess(title, message)                   // expires 10 min
```

**Capacity:** stores up to 100 in memory, persists last 50 to localStorage. `clearExpired()` removes entries past their `expiresAt`.

**Sound:** `soundEnabled` flag (default `true`); plays for `critical` / `high` priority — currently a stub (no audio file).

### NotificationCenter (`frontend/components/organisms/NotificationCenter/`)

Bell-icon button in AppShell header. Renders a floating dropdown panel.

| Feature | Detail |
|---|---|
| Badge | Red count badge; hidden when 0 |
| Panel opens | Click bell; closes on click-outside |
| List | Shows up to `maxItems` (default 20), newest first |
| Click notification | Marks read; navigates to `actionUrl` if present |
| Per-item dismiss | X button removes without navigating |
| "Прочитати всi" | Marks all read in one tap |
| "Очистити" | Removes all notifications |
| Overflow footer | "Показано X з Y" if list is truncated |

Type → icon and color mapping defined in `TYPE_ICONS` / `TYPE_COLORS` constants.

### Integration points

| Where | What |
|---|---|
| `orderStore.ts` | Calls `notifyOrderCompleted` after successful payment |
| `ShiftGuard` / shift hooks | Calls `notifyShiftAction` on open/close |
| `useLowStockIngredients` hook | Calls `notifyLowStock` / `notifyOutOfStock` when live-poll returns thresholds |
| Supplies flow (after `supply.receive` succeeds) | Calls `notifySupplyReceived` |

### Selectors

```ts
selectNotifications         // all notifications array
selectUnreadCount           // number
selectUnreadNotifications   // unread items only
selectCriticalNotifications // critical + unread
selectNotificationsByType(type)
```

## Strapi 5 Production Notes

- **Route files**: must use separate `custom.ts` files, NOT `export default [customRoutes, coreRouter]` array pattern
- **Middleware**: must use `module.exports`, NOT `export default` (CommonJS interop issue)
- **Dockerfile**: must copy `dist/config` → `./config/`, `dist/src` → `./src/`, `dist/build` → `./build/` (Strapi expects these at root)
- **Users seeding**: use `strapi.service('plugin::users-permissions.user').add()`, NOT `create()` or `hashPassword()`
- **Populate syntax**: Strapi 5 rejects comma-separated populate (`populate=image,category` → 400). Use indexed: `populate[0]=image&populate[1]=category`
- **documentId**: Strapi 5 uses `documentId` (string UUID) for all REST API route params. Numeric `id` is only for internal/relational filtering
