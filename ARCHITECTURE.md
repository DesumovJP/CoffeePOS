# CoffeePOS — Architecture

> Last updated: 2026-02-16

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js 16 Frontend (React 19)                        │  │
│  │  Zustand 5 │ React Query 5 │ CSS Modules + Tailwind v4 │  │
│  │  13 pages │ ~50 components │ Atomic Design              │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│      Vercel             │ HTTPS + JWT Bearer                  │
│  coffee-pos-ten.vercel.app                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────┐
│  Strapi 5.34 (Railway)  │                                     │
│  coffeepos-production-c0e1.up.railway.app                     │
│  Auth → 17 Content Types + Custom Controllers                 │
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

## Database Schema (17 Content Types)

### Core Business

| Content Type | Description | Key Relations |
|---|---|---|
| **category** | Product categories (Кава, Чай, etc.) | → products (1:N) |
| **product** | Menu items | → category (N:1), → modifier-groups (M:N) |
| **modifier-group** | Groups of modifiers (Size, Milk) | → modifiers (1:N), → products (M:N) |
| **modifier** | Individual modifiers (Oat milk +₴15) | → modifier-group (N:1) |
| **cafe** | Coffee shop location | Referenced by orders, shifts, tables |
| **cafe-table** | Physical tables (number, seats, zone) | → cafe (N:1) |

### Orders & Payments

| Content Type | Description | Key Relations |
|---|---|---|
| **order** | Customer orders with status FSM | → order-items (1:N), → payment (1:1), → shift (N:1) |
| **order-item** | Line items | → order (N:1), → product (N:1) |
| **payment** | Payment records (cash/card/qr) | → order (1:1) |

### Inventory

| Content Type | Description | Key Relations |
|---|---|---|
| **ingredient-category** | Ingredient groupings | → ingredients (1:N) |
| **ingredient** | Raw materials + stock tracking | → ingredient-category (N:1) |
| **recipe** | Links products to ingredients by size | → product (N:1) |
| **inventory-transaction** | Stock movement audit log | → ingredient, → shift |

### Operations

| Content Type | Description |
|---|---|
| **shift** | Work shifts with cash tracking and activity logging |
| **supply** | Ingredient deliveries |
| **write-off** | Ingredient losses |
| **task** | Staff tasks (Kanban) |

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

## Frontend Pages (13)

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Auth (email + password) |
| `/pos` | POS terminal (requires open shift) |
| `/orders` | Order history |
| `/tables` | Table management |
| `/tasks` | Kanban board |
| `/kds` | Kitchen display |
| `/admin/dashboard` | Analytics |
| `/admin/products` | CRUD: products, categories, ingredients, recipes, modifiers |
| `/admin/reports` | Monthly calendar, X/Z reports |
| `/admin/inventory` | Inventory overview |
| `/profile` | User profile + shift schedule |

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
2. Select the Recipe matching `item.sizeId`, else the default Recipe, else the first Recipe
3. For each `{ingredientSlug, amount}` in `recipe.ingredients`:
   - Find Ingredient by `slug = ingredientSlug`
   - Deduct `amount × quantity` from `ingredient.quantity` (floor at 0)
   - Create `InventoryTransaction { type: 'sale', ingredient, product, quantity: -deducted, previousQty, newQty, reference: 'ORD-{id}' }`

**Frontend → Backend data flow:**
- `OrderItem.productDocumentId` — set in Zustand store when adding items to cart
- Passed in `ordersApi.create()` payload under `items[].productDocumentId`
- `sizeId` passed alongside to select the correct size Recipe

**Seed data:** Recipe ingredients stored as `{ ingredientSlug, ingredientId, amount }` — slug is authoritative for lookups, `ingredientId` kept for audit/display.

**Low-stock alerts:** `GET /api/ingredients/low-stock` returns ingredients where `quantity ≤ minQuantity`.

### Activity Logging

Shift-scoped activity log stored as JSON array in `shift.activities` field. Each activity has `id`, `type`, `timestamp`, and `details`.

| Activity Type | Trigger |
|---|---|
| `order_create` | New order created |
| `order_status` | Order status change |
| `supply_receive` | Supply received |
| `writeoff_create` | Write-off created |
| `shift_open` | Shift opened |
| `shift_close` | Shift closed |

**Utility**: `backend/src/utils/activity.ts` — `ActivityType`, `Activity` interface, `generateActivityId()` helper.

**Service**: `backend/src/api/shift/services/shift.ts` — `logActivity(shiftId, type, details)` prepends activity to JSON array.

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
- **Env vars**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_MODE=live`

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

## Dual API Mode

- `NEXT_PUBLIC_API_MODE=live` — real Strapi API (production)
- `NEXT_PUBLIC_API_MODE=mock` — in-memory mock data (development only)

## Seed Data

| Entity | Count |
|---|---|
| Categories | 5 (Кава, Чай, Десерти, Їжа, Напої) |
| Products | 20 |
| Ingredients | 24 |
| Recipes | 25 |
| Tables | 12 |
| Modifier groups | 3 (Розмір, Молоко, Додатки) |
| Modifiers | 11 |
| Cafes | 1 (Paradise Coffee — Центр) |
| Users | 3 (owner / manager / barista) |

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
| Per-item dismiss | ✕ button removes without navigating |
| "Прочитати всі" | Marks all read in one tap |
| "Очистити" | Removes all notifications |
| Overflow footer | "Показано X з Y" if list is truncated |

Type → icon and color mapping defined in `TYPE_ICONS` / `TYPE_COLORS` constants.

### Integration points

| Where | What |
|---|---|
| `orderStore.ts` | Calls `notifyOrderCompleted` after successful payment |
| `ShiftGuard` / shift hooks | Calls `notifyShiftAction` on open/close |
| `suppliesApi` mock | Calls `notifySupplyReceived` |
| `ingredientsApi` mock | Calls `notifyLowStock` / `notifyOutOfStock` |

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
