# CoffeePOS — Architecture

> Last updated: 2026-02-15

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
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────┐
│  Strapi 5.34 (Railway)  │                                     │
│  Rate Limit → Auth → 17 Content Types + Custom Controllers    │
│  Orders(FSM) │ Shifts │ Reports │ Inventory │ Tasks           │
│  ┌────────────┼──────────────────────────────────────────┐   │
│  │  PostgreSQL (Railway addon)                            │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  DigitalOcean Spaces (media/images)                    │   │
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
| Media Storage | DigitalOcean Spaces | — |
| Language | TypeScript | 5.x |
| Backend Deploy | Railway (Docker) | — |
| Frontend Deploy | Vercel | — |

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
| **shift** | Work shifts with cash tracking |
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
| `GET` | `/api/reports/daily` | Daily report |
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

### Shift Lifecycle

```
OPEN  → validates no existing open shift
ACTIVE → tracks: sales, write-offs, supplies
CLOSE  → records closingCash, calculates difference
```

## Security

- JWT auth via Strapi Users & Permissions
- Rate limiting: 100 req/min per IP
- Input validation + sanitization on all custom endpoints
- CORS restricted to `FRONTEND_URL`
- Security headers via Strapi middleware

## Dual API Mode

- `NEXT_PUBLIC_API_MODE=live` — real Strapi API (production)
- `NEXT_PUBLIC_API_MODE=mock` — in-memory mock data (development only)

## Seed Data

5 categories, 20 products, 24 ingredients, 25 recipes, 12 tables, 11 modifiers, 3 modifier groups, 1 cafe, 3 users (owner/manager/barista)
