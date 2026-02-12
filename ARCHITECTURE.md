# ParadisePOS — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Next.js 16 Frontend (React 19)            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │  │
│  │  │ Zustand 5 │  │ React    │  │  CSS Modules +    │    │  │
│  │  │ Stores    │  │ Query 5  │  │  Design System    │    │  │
│  │  └────┬─────┘  └────┬─────┘  └───────────────────┘    │  │
│  │       │              │                                  │  │
│  │       │         ┌────┴─────┐                            │  │
│  │       └────────▶│ API Client│                           │  │
│  │                 └────┬─────┘                            │  │
│  └──────────────────────┼─────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP (REST)
┌─────────────────────────┼────────────────────────────────────┐
│                    Strapi 5.34                                │
│  ┌──────────────────────┼─────────────────────────────────┐  │
│  │  15 Content Types  + Custom Controllers/Services       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐   │  │
│  │  │ Orders  │ │ Shifts  │ │ Recipes │ │ Reports    │   │  │
│  │  │ (custom)│ │ (custom)│ │         │ │ (virtual)  │   │  │
│  │  └────┬────┘ └────┬────┘ └─────────┘ └────────────┘   │  │
│  └───────┼──────────┼────────────────────────────────────┘  │
│          │          │                                        │
│  ┌───────┴──────────┴────────────────────────────────────┐  │
│  │                   PostgreSQL                           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| State Management | Zustand | 5.0.10 |
| Server State | TanStack React Query | 5.90.20 |
| Styling | CSS Modules + Custom Design System | — |
| Backend CMS | Strapi | 5.34.0 |
| Database | PostgreSQL | 17 |
| Language | TypeScript | 5.x |

## Database Schema (15 Content Types)

### Core Business

| Content Type | Description | Key Relations |
|---|---|---|
| **category** | Product categories (Кава, Чай, etc.) | → products (1:N) |
| **product** | Menu items | → category (N:1), → modifier-groups (M:N), → order-items (1:N), → recipes (1:N) |
| **modifier-group** | Groups of modifiers (e.g., Milk type) | → modifiers (1:N), → products (M:N) |
| **modifier** | Individual modifiers (e.g., Oat milk +₴15) | → modifier-group (N:1) |

### Table Management

| Content Type | Description | Key Relations |
|---|---|---|
| **cafe-table** | Physical tables in the cafe (number, seats, zone) | — (status derived from active orders) |

### Orders & Payments

| Content Type | Description | Key Relations |
|---|---|---|
| **order** | Customer orders | → order-items (1:N), → payment (1:1), → shift (N:1) |
| **order-item** | Line items in an order | → order (N:1), → product (N:1) |
| **payment** | Payment records | → order (1:1) |

### Ingredients & Recipes

| Content Type | Description | Key Relations |
|---|---|---|
| **ingredient-category** | Ingredient groupings (Молочні, Кава та чай, etc.) | → ingredients (1:N) |
| **ingredient** | Raw materials with stock tracking | → ingredient-category (N:1) |
| **recipe** | Links products to ingredients by size | → product (N:1) |
| **inventory-transaction** | Stock movement audit log | → ingredient (N:1), → product (N:1), → shift (N:1) |

### Operations

| Content Type | Description | Key Relations |
|---|---|---|
| **shift** | Work shifts with cash tracking | → orders (1:N), → inventory-transactions (1:N) |
| **supply** | Ingredient supply deliveries | → shift (N:1) |
| **write-off** | Ingredient losses (expired/damaged) | → shift (N:1) |

### Virtual API (no content type)

| Endpoint | Description |
|---|---|
| **report** | Aggregated daily/monthly reports from orders, shifts, write-offs |

## API Endpoints

### Standard CRUD (all content types)

All content types expose standard Strapi REST endpoints:
- `GET /api/{plural}` — List (with filters, pagination, sort, populate)
- `GET /api/{plural}/:id` — Get by ID
- `POST /api/{plural}` — Create
- `PUT /api/{plural}/:id` — Update
- `DELETE /api/{plural}/:id` — Delete

### Custom Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/shifts/open` | Open a new shift (validates no existing open shift) |
| `POST` | `/api/shifts/:id/close` | Close shift with cash reconciliation |
| `GET` | `/api/shifts/current` | Get the currently open shift |
| `POST` | `/api/orders` | Create order with items + payment, deduct inventory via recipes, update shift |
| `POST` | `/api/supplies/:id/receive` | Receive supply, add stock to ingredients, create transactions |
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Aggregated daily report |
| `GET` | `/api/reports/monthly?year=YYYY&month=MM` | Monthly calendar data with daily totals |

## Frontend Architecture

### Component Hierarchy (Atomic Design)

```
atoms/          ← Base elements (no dependencies)
  Badge, Button, GlassCard, Icon, Text

molecules/      ← Compound components (atoms only)
  CategoryTabs, FilterTabs, Modal, OrderAccordion,
  OrderItem, PageHeader, PriceTag, ProductCard,
  QuantityControl, SearchInput, SizePicker, StatsGrid

organisms/      ← Complex compositions (atoms + molecules)
  AppShell, DataTable, Drawer, ModifierModal, NotificationCenter,
  OrderSummary, PaymentModal, ProductGrid, ShiftCalendar,
  ShiftGuard, ShiftCloseModal, Sidebar
```

### App Layout

The `AppShell` uses a vertical layout with a top navbar and a slide-out drawer for navigation:

```
┌─────────────────────────────────────────────┐
│ Navbar: [☰] Logo          Action  🔔  👤    │
├─────────────────────────────────────────────┤
│ Page Title Bar (hidden on /pos)             │
├─────────────────────────────────────────────┤
│                                             │
│              Content (flex: 1)              │
│                                             │
└─────────────────────────────────────────────┘
```

- **Navbar**: Hamburger menu, brand logo, page actions, notifications, user avatar
- **Drawer** (organisms/Drawer): Slide-out overlay panel from the left with navigation groups, user info in footer. Uses portal rendering, escape/backdrop close, body scroll lock (same patterns as Modal)
- **Page Title Bar**: Shown on all pages except `/pos` for maximum product grid space
- **Sidebar** (organisms/Sidebar): Legacy component, types (`NavGroup`, `UserInfo`) still re-exported for use in Drawer

### Zustand Stores

| Store | Purpose |
|---|---|
| `orderStore` | Current order, items, payment flow, completed orders history |
| `shiftStore` | Current shift state, open/close operations (persisted to localStorage) |
| `inventoryStore` | Local ingredient stock tracking |
| `supplyStore` | Local supply management |
| `notificationStore` | In-app notification queue |

### React Query Hooks

| Hook File | Hooks |
|---|---|
| `useProducts` | useProducts, useProduct |
| `useCategories` | useCategories, useActiveCategories |
| `useIngredients` | useIngredients, useIngredientCategories |
| `useOrders` | useOrders, useOrder, useActiveOrders, useUpdateOrderStatus, useCancelOrder |
| `useTables` | useTables, useTable, useUpdateTable |
| `useShifts` | useCurrentShift, useShifts, useShift, useOpenShift, useCloseShift |
| `useSupplies` | useSupplies, useCreateSupply, useReceiveSupply, useCancelSupply |
| `useWriteoffs` | useWriteoffs, useCreateWriteoff |
| `useReports` | useDailyReport, useMonthlyReport |
| `useRecipes` | useRecipes, useRecipesByProduct |

### API Client

Singleton `ApiClient` at `frontend/lib/api/client.ts`:
- Base URL from `NEXT_PUBLIC_API_URL` (default: `http://localhost:1337/api`)
- Automatic JSON serialization
- Query parameter building for Strapi filters
- Error normalization

API modules: `products.ts`, `categories.ts`, `orders.ts`, `ingredients.ts`, `shifts.ts`, `supplies.ts`, `writeoffs.ts`, `reports.ts`, `recipes.ts`, `inventory-transactions.ts`, `tables.ts`

### Pages

| Route | Page | Data Source | Description |
|---|---|---|---|
| `/` | Landing | Static | Marketing landing page |
| `/pos` | POS | API (products, categories, orders, shifts) | Main point-of-sale interface (requires open shift) |
| `/orders` | Orders | API (`useOrders`) | Order history with date filtering |
| `/tables` | Tables | API (`useTables` + `useActiveOrders`) | Table grid, status derived from active orders |
| `/admin/products` | Products | API (`useProducts`, `useIngredients`, `useRecipes`, `useCategories`) | Products, recipes, ingredients management |
| `/admin/supplies` | Supplies | API (`useSupplies`, `useIngredients`) | Supply order management |
| `/admin/writeoffs` | Write-offs | API (`useWriteoffs`, `useIngredients`) | Write-off tracking |
| `/admin/reports` | Reports | API (`useReports`) | Calendar view with monthly/daily reports |

## Design System

### CSS Variable Categories

Defined in `frontend/app/globals.css` with light/dark mode support:

| Category | Examples | Purpose |
|---|---|---|
| **Colors** | `--color-accent`, `--color-success`, `--color-error` | Semantic colors |
| **Status Backgrounds** | `--color-success-bg`, `--color-warning-bg`, `--color-error-bg` | Subtle status indicators |
| **Text** | `--text-primary`, `--text-secondary`, `--text-tertiary` | Text hierarchy |
| **Backgrounds** | `--bg-primary`, `--bg-secondary`, `--bg-tertiary` | Surface hierarchy |
| **Glass** | `--glass-bg`, `--glass-border`, `--glass-bg-hover` | Glassmorphism effects |
| **Spacing** | `--space-1` through `--space-10` | Consistent spacing scale |
| **Typography** | `--text-xs` through `--text-3xl` | Font size scale |
| **Radius** | `--radius-sm` through `--radius-full` | Border radius scale |
| **Shadows** | `--shadow-sm` through `--shadow-xl`, `--shadow-glass` | Elevation system |
| **Animation** | `--duration-fast`, `--ease-default`, `--ease-out` | Motion tokens |
| **Overlay** | `--overlay-bg` | Modal/overlay backgrounds |

### iOS 26 Liquid Glass Theme

The design system uses a glassmorphism aesthetic with:
- Semi-transparent backgrounds with `backdrop-filter: blur()`
- Subtle borders using glass variables
- Depth through layered glass cards
- Dark mode with inverted glass properties

## Business Logic

### Order Flow

```
1. Barista selects products in ProductGrid
2. Products added to order (orderStore.addItem)
   - If product has modifiers → ModifierModal opens first
   - If product has sizes → size selected in ProductGrid
3. OrderSummary shows running total
4. Barista clicks "Оплата" → PaymentModal opens
5. Payment method selected (cash/card/QR)
6. handlePaymentComplete:
   a. Build order payload (order + items + payment)
   b. POST /api/orders (backend creates order, deducts inventory, updates shift)
   c. On API failure → falls back to local-only completion
   d. completePayment() clears the current order
```

### Inventory Deduction (Backend)

```
On order creation:
  For each order item:
    1. Find recipe for (productId, sizeId)
    2. For each recipe ingredient:
       a. Get current ingredient stock
       b. Deduct: newQty = currentQty - (amount × orderQuantity)
       c. Update ingredient quantity
       d. Create inventory-transaction record (type: 'sale')
```

### Shift Lifecycle

```
1. OPEN: POST /shifts/open { openedBy, openingCash }
   - Validates no existing open shift
   - Creates shift with status='open', zeroed counters

2. ACTIVE: Shift tracks all operations
   - Each order → addSale(shiftId, total, paymentMethod)
   - Each write-off → addWriteOff(shiftId, amount)
   - Each supply received → addSupply(shiftId, amount)

3. CLOSE: POST /shifts/:id/close { closedBy, closingCash, notes }
   - Sets status='closed', closedAt
   - Cash difference = closingCash - (openingCash + cashSales)
   - Frontend ShiftCloseModal shows full summary
```

### Supply Receiving

```
1. Create supply (status: 'draft') with items
2. Update status → 'ordered' → 'shipped' as it progresses
3. POST /supplies/:id/receive { receivedBy }
   - For each supply item:
     a. Find ingredient by ID
     b. Add quantity to ingredient stock
     c. Create inventory-transaction (type: 'supply')
   - Update supply status to 'received'
   - Update shift suppliesTotal
```

## Deployment

### Environment Variables

**Backend** (`backend/.env`):
```
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=paradisepos
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=<password>
APP_KEYS=<comma-separated-keys>
API_TOKEN_SALT=<salt>
ADMIN_JWT_SECRET=<secret>
JWT_SECRET=<secret>
SEED_DATABASE=true  # Set on first run to seed data
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:1337/api
```

### Build & Run

```bash
# Backend
cd backend
npm install
npm run build
npm run develop  # Development with auto-reload

# Frontend
cd frontend
npm install
npm run build
npm run start    # Production
npm run dev      # Development
```

### Database Setup

1. Install PostgreSQL 17
2. Create database: `CREATE DATABASE paradisepos;`
3. Configure credentials in `backend/.env`
4. Start Strapi with `SEED_DATABASE=true` for initial data
5. Seed creates: 5 categories, 20 products, modifier groups, 7 ingredient categories, 24 ingredients, 30+ recipes, 12 cafe tables

### Strapi Admin

Access at `http://localhost:1337/admin` after first start. Create admin user on first visit. All content types are manageable through the admin panel.

---

## Mock API Mode

The frontend can run without Strapi/PostgreSQL using an in-memory mock layer.

### Enable/Disable

In `frontend/.env.local`:
```
NEXT_PUBLIC_API_MODE=mock    # Use mock data
NEXT_PUBLIC_API_MODE=live    # Use real Strapi (or remove the line)
```

### How It Works

- All API service objects (`productsApi`, `categoriesApi`, etc.) are conditionally swapped in `frontend/lib/api/index.ts`
- When `NEXT_PUBLIC_API_MODE=mock`, a `require()` replaces each service with its mock counterpart
- Hooks and page components require **zero changes** — they import from `@/lib/api` as usual
- A visible "Тестовий режим" banner appears in the AppShell header

### File Structure

```
frontend/lib/mock/
├── helpers.ts                          # IS_MOCK, wrapResponse, generateId, etc.
├── store.ts                            # MockStore singleton (in-memory database)
├── data/
│   └── init.ts                         # Seed → Strapi entity transformers
└── services/
    ├── index.ts                        # Barrel (re-exports with real API names)
    ├── products.mock.ts                # productsApi mock
    ├── categories.mock.ts              # categoriesApi mock
    ├── orders.mock.ts                  # ordersApi, orderItemsApi, paymentsApi
    ├── ingredients.mock.ts             # ingredientsApi, ingredientCategoriesApi, inventoryTransactionsApi
    ├── shifts.mock.ts                  # shiftsApi
    ├── supplies.mock.ts                # suppliesApi
    ├── writeoffs.mock.ts               # writeoffsApi
    ├── reports.mock.ts                 # reportsApi
    ├── recipes.mock.ts                 # recipesApi
    ├── tables.mock.ts                  # tablesApi
    └── inventory-transactions.mock.ts  # apiInventoryTransactionsApi
```

### Mock Data Initialization

`MockStore` is initialized once from seed data in `frontend/lib/data/seed.ts`:
- 5 categories, 28 products (13 recipe-based + 15 ready-made)
- 7 ingredient categories, 24 ingredients
- 12 cafe tables (Зал, Тераса, VIP)
- 30+ recipes, 16 sample orders, 4 supplies, 3 writeoffs
- 1 open shift + 5 closed historical shifts

### Mock Product Images

Two products include real images from Unsplash (defined in `frontend/lib/mock/data/init.ts`):
- **Капучіно** (cappuccino) — latte art photo
- **Круасан** (croissant) — fresh croissant photo

Images are stored as `StrapiMedia` objects with `url`, `width`, `height`, and `provider: 'unsplash'`.

### Adding Mock Data for New Endpoints

1. Add a new init function in `frontend/lib/mock/data/init.ts`
2. Add the data array to `MockStore` in `frontend/lib/mock/store.ts`
3. Create `frontend/lib/mock/services/{name}.mock.ts` implementing the API interface
4. Export from `frontend/lib/mock/services/index.ts` with the real service name
5. Add the conditional swap in `frontend/lib/api/index.ts`
