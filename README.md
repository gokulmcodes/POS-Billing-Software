# POS & Billing Software — Textile / Retail

A full-stack Point-of-Sale and store management system for a textile/retail business. It ships three
experiences from a single web app:

- **Admin Portal** — products, categories, staff, suppliers, purchases, returns, transactions, ledger and reports.
- **Billing (POS) Portal** — fast counter billing for staff: barcode/product search, cart, discounts, payment, printable receipt.
- **Mobile Admin Portal** — the same admin modules in a phone-sized, app-like layout.

## Tech stack

| Layer      | Technology |
|------------|------------|
| Backend    | Python 3.12, FastAPI, Beanie ODM (async MongoDB), Motor |
| Auth       | JWT (PyJWT) + bcrypt password hashing, role-based access control (`admin`, `staff`) |
| Database   | MongoDB 9.x |
| Frontend   | React 18 + TypeScript + Vite, React Router, Tailwind CSS, Recharts |
| HTTP       | Axios (Vite dev proxy `/api` → backend) |

## Features

**Admin**
- Dashboard KPIs (revenue, profit, stock value, low-stock, today's sales) with charts.
- Product CRUD with category, SKU/barcode, cost/selling price, tax, reorder level and per-variant stock (size/color).
- Categories, Staff (user CRUD + roles), Suppliers, Customers.
- Purchases (stock intake that updates inventory and ledger).
- Returns & exchanges (refund or exchange, restocks inventory, writes ledger + refund totals).
- Transactions browser and a running **Ledger** (sale/purchase/return/expense/payment/adjustment) with balances.
- Reports: date-range sales report with CSV export, daily sales, top products, payment breakdown, low stock.

**Billing (POS)**
- Product grid + barcode scan (Enter to add) and search, category filter.
- Cart with quantity, per-line discount and order-level discount, automatic tax.
- Variant picker when a product has size/color variants.
- Payment modal: cash (with change + quick amounts), card, UPI, or split cash/card.
- Printable 80mm-styled receipt; billing history with reprint.
- Access control: staff can bill; admin-only sections are hidden/blocked for staff.

**Mobile Admin**
- Bottom-navigation shell exposing Dashboard, Products, Reports, Staff and a "More" menu for every other admin module.

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

## Setup

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python scripts\seed.py      # seed demo data + users
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## URLs

| Experience           | URL |
|----------------------|-----|
| Login                | http://localhost:5173/login |
| Admin Portal         | http://localhost:5173/admin |
| Billing (POS) Portal | http://localhost:5173/billing |
| Mobile Admin Portal  | http://localhost:5173/mobile |
| API docs (Swagger)   | http://127.0.0.1:8000/docs |

The root URL `/` redirects to the Admin Portal for admins and to the Billing Portal for staff.

## Test credentials

| Role  | Username             | Password   |
|-------|----------------------|------------|
| Admin | `admin@posshop.com`  | `Admin@123` |
| Staff | `staff@posshop.com`  | `Staff@123` |
| Staff | `deepa@posshop.com`  | `Deepa@123` |

> Tip: the login screen has one-tap buttons for these accounts.

## Project structure

```
backend/
  app/
    api/routers/     # auth, users, categories, products, suppliers, customers,
                     # purchases, sales, returns, ledger, reports
    core/            # config, security (JWT/bcrypt), deps (RBAC)
    db/              # Mongo client + Beanie init
    models/          # Beanie documents
    schemas/         # Pydantic request/response models
    services/        # ledger, reports, inventory, sequential numbering
  scripts/seed.py    # demo data seeder
frontend/
  src/
    pages/admin/     # admin modules (also reused by the mobile shell)
    pages/billing/   # POS + billing history
    pages/mobile/    # mobile "More" menu
    layouts/         # Admin / Billing / Mobile shells
    components/ui.tsx
    api.ts, auth.tsx, types.ts
```

## Business rules / assumptions

- Inventory is tracked at product level, and per variant when variants exist; a variant is required at billing time for variant products.
- Sales store a price/inventory snapshot; tax is applied per line after line discounts.
- Sequential document numbers: invoices `INV-YYYYMMDD-####`, purchases `PO-…`, returns `RET-…`.
- The ledger keeps a running balance that is recomputed on every entry.
- Stock is decremented on sale and restored on return; refunds are reflected in reports.
- Amounts are in INR and formatted for the `en-IN` locale.
