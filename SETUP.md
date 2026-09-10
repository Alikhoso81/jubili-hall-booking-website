# Setup — JUBLII Booking Manager

## 1. Install dependencies (needs Node.js 18+)

```bash
cd project
npm install
npm run typecheck   # should pass
npm run dev         # http://localhost:5173
```

## 2. Create the database

Supabase dashboard → **SQL Editor** → **New query** → paste the entire
contents of **`supabase/SETUP_FRESH_DATABASE.sql`** → **Run**.

(The files in `supabase/migrations/` are the historical step-by-step
versions — you only need the single `SETUP_FRESH_DATABASE.sql` on a new
project. Re-running it is safe.)

## 3. Lock down sign-ups

Supabase → **Authentication → Sign In / Providers → Email**:

- Turn **OFF** "Allow new users to sign up" — **there is no public
  sign-up in the app**; you create every account yourself.
- (Email confirmation setting doesn't matter — accounts you create in the
  dashboard are auto-confirmed.)

## 4. Create the owner account

Supabase → **Authentication → Users → Add user → Create new user**
→ your email + password, keep **"Auto Confirm User"** checked.

The **first** account created automatically becomes **Admin**.

## 5. Add staff — two steps

1. In the app: **Settings → Users → Add user** — enter their email + role.
   This just *reserves* the role.
2. In Supabase: **Authentication → Users → Add user** — create the account
   with the **same email**. The reserved role is applied automatically and
   the "Account not created yet" row becomes an active member.

Fine-tune anyone's permissions later with **Assign role**; switch someone
off with **Deactivate**.

Safety net: if an account is ever created for an email that has no
reserved role (and isn't the first account), it lands **deactivated** —
an admin has to turn it on from Settings → Users.

## 6. First run

1. **Events → Venues** — rename "Main Hall", add your other halls.
2. **Settings → Company Settings** — name, phone, tax rate, event types.
3. **Events → Booking Calendar** — tap a date to make a booking.

## Deploy

Static build — deploy `project/dist/` (Netlify / Vercel / Cloudflare
Pages). Env vars on the host:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Build command `npm run build` · publish dir `dist` · SPA redirect already
in `dist/_redirects`.

## Notes / follow-ups

- **Permissions are enforced in the UI**, not yet in the database.
- **Accounts, Inventory, Finance Vouchers, Financial Reports, Staff &
  Payroll** are scaffolded ("Module in progress").
- **Free-tier pause:** a Supabase free project pauses after ~7 days idle.
