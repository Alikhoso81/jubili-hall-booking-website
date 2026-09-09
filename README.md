# JUBLII GROUP — Booking Manager

Internal, login-only venue-management tool for a banquet / marriage hall
business. No public/customer-facing site — every screen requires a
Supabase Auth login.

## Stack

- React 18 + TypeScript + Vite
- React Router, Tailwind CSS, lucide-react, Recharts
- Supabase (PostgreSQL + Auth)

## Modules

**Working now**

- Dashboard — KPIs, booking-trend chart, quick actions, venue performance
- Events → Venues — add / edit halls
- Events → Booking Calendar — month view, status colours, click to book
- Events → New Booking — 3-step wizard (details → charges → review)
- Events → Bookings — list, filters, search, CSV export
- Booking detail — status workflow, charges, payments, balance
- Invoices — list + printable invoice
- Settings → Company Settings — business info, tax, event types, time slots
- Settings → Users & Roles — invite staff, assign roles, granular
  permissions, activate / deactivate

**Scaffolded (navigation + permissions wired, screens next)**

- Accounts (Chart of Accounts, Journal, Trial Balance, Ledgers)
- Inventory · Finance Vouchers · Financial Reports · Staff & Payroll

## Develop

Requires **Node.js 18+**.

```bash
cd project
npm install
npm run dev         # http://localhost:5173
npm run typecheck
npm run build
```

`.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## First-time setup

See [SETUP.md](SETUP.md) — migrations, auth settings, and creating staff
accounts.
