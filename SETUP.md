# Setup — JUBLII Booking Manager

Do these steps once, in order.

## 1. Install dependencies (needs Node.js 18+)

```bash
cd project
npm install
npm run typecheck   # should pass
npm run dev         # http://localhost:5173
```

New packages in this build: `react-router-dom` (page navigation) and
`recharts` (dashboard charts).

## 2. Apply the database migrations

Supabase dashboard → **SQL Editor** → run these two files **in order**:

1. `supabase/migrations/20260909120000_admin_only_supabase_auth.sql`
   (Supabase Auth + the `staff` table — skip if you already ran it)
2. `supabase/migrations/20260909140000_venue_management.sql`
   (venues, the richer bookings model, charges, payments, company
   settings, roles/permissions, invites)

The second migration reshapes `bookings` (`date`→`event_date`,
`shift`→`time_slot`, `customer_*`→`client_*`, adds `venue_id`, `status`,
etc.), moves any existing money values into `charges` / `payments`, and
creates a default **"Main Hall"** venue for existing bookings.

## 3. Auth settings

Supabase dashboard → **Authentication**:

- **Providers → Email:** turn **off** "Confirm email" (so new accounts work
  right away), or leave it on if you want email verification.
- **Sign-ups:** leave **enabled** — access is controlled by invites
  (step 5). The very first account to sign up automatically becomes
  **Admin**.

## 4. Create the owner account

- If you already created an account in the earlier setup, it was upgraded
  to **Admin** by migration 2 — nothing to do.
- Otherwise: Authentication → Users → **Add user** (email + password), or
  just sign up on the app's login screen. First account = Admin.

## 5. Add your team (from inside the app)

Sign in, then go to **Settings → Users → Add user**:

1. Enter the person's **email**, name, and **role** (Admin / Manager /
   Booker / Accountant).
2. Send them the login-page link (the modal shows it with a Copy button).
3. They sign up with that exact email → they get the role and permissions
   automatically, and the "Pending verification" row turns into an active
   member.

Fine-tune any member's exact permissions later with **Assign role**, or
switch them off with **Deactivate**.

## 6. First run inside the app

1. **Events → Venues** — rename "Main Hall" / add your other halls.
2. **Settings → Company Settings** — business name, phone, tax rate, and
   the Event type / Time slot lists.
3. **Events → Booking Calendar** — tap a date to make your first booking.

## Deploy

Static build — deploy the `project/dist/` folder (Netlify / Vercel /
Cloudflare Pages). The repo already has a SPA redirect in
`dist/_redirects`. Set these env vars on the host:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Build command: `npm run build` · Publish directory: `dist`

## Notes / follow-ups

- **Permissions are enforced in the UI**, not yet in the database. Every
  signed-in user can technically read/write the tables via the API. Next
  step is per-permission RLS policies.
- **Accounts, Inventory, Finance Vouchers, Financial Reports, Staff &
  Payroll** are scaffolded ("Module in progress") — navigation,
  permissions and layout are wired, the screens come next.
- **Free-tier pause:** a Supabase free project pauses after ~7 days idle.
  Upgrade to Pro or add a keep-alive ping when it goes live.
