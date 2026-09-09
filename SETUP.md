# Setup — admin-only Booking Manager

Do these steps once, in order.

## 1. Apply the database migration

1. Open your project at [supabase.com](https://supabase.com) → **SQL Editor**.
2. Open a new query, paste the entire contents of
   `supabase/migrations/20260909120000_admin_only_supabase_auth.sql`,
   and click **Run**.

What it does:

- Removes the old `admin_users` table and its login RPC functions.
- Adds a `staff` profile table linked to Supabase Auth. A trigger fills it
  in automatically when you add a user (step 3).
- Adds `event_type`, `total_amount`, `advance_paid`, and a generated
  `balance_due` column to `bookings`; migrates the old `booked_by_admin`
  values into a new `booked_by` column.
- Removes public read access. Only signed-in users can read or change
  bookings now.
- Drops the 15-day auto-cleanup. Bookings are kept permanently.

> The old default logins (`admin1` / `Admin@2024!` etc.) stop working after
> this migration. You create real accounts in step 3.

## 2. Turn off public sign-ups

Supabase dashboard → **Authentication → Sign In / Providers → Email**:

- **Disable** "Allow new users to sign up" (only you should create accounts).
- Optional: turn **off** "Confirm email" so new staff accounts work
  immediately without an email link.

## 3. Create staff accounts

Supabase dashboard → **Authentication → Users → Add user → Create new user**:

- Enter an **email** and a **password** for the owner, then repeat for each
  worker.
- (Optional) To set a nice display name, expand **User Metadata** and add:
  `{ "display_name": "Ali" }`. Otherwise the name is taken from the part of
  the email before the `@`.

Everyone you add has the same full access (add / edit / delete / export).

To remove someone's access later: delete their user here.

## 4. Deploy

The app builds to static files — deploy the `dist/` folder (Netlify, Vercel,
Cloudflare Pages, etc.). Set the two environment variables on the host:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Build command: `npm run build` · Publish directory: `dist`

## Notes / follow-ups

- **Free-tier pause:** a Supabase free project pauses after ~7 days of no
  activity and needs a manual resume. For a low-traffic internal tool,
  either upgrade to Pro when it goes live, or set up a daily keep-alive
  ping.
- **Rotate the exposed passwords:** the old `admin1..admin4` passwords are
  in git history (`supabase/migrations/20260417113319_hall_booking_system.sql`).
  They no longer work after migration, but don't reuse them.
