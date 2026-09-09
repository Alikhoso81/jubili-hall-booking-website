# JUBLII GROUP — Booking Manager

Internal, login-only tool for the hall owner and staff to manage bookings.
There is no public/customer-facing website — every screen requires a Supabase
Auth login.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS, lucide-react icons
- Supabase (PostgreSQL + Auth)

## Features

- Email + password sign in (Supabase Auth)
- Month calendar of day/night shift availability
- Add / edit / delete bookings
- Per-booking: customer details, event type, total amount, advance paid,
  auto-calculated balance due
- Search and filter (upcoming / all / past)
- Export all bookings to CSV

## Local development

Requires **Node.js 18+**.

```bash
npm install
npm run dev        # start the dev server
npm run typecheck  # type-check
npm run build      # production build to dist/
```

Environment variables (`.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## First-time setup

See [SETUP.md](SETUP.md) for applying the database migration and creating
staff accounts.
