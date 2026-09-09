/*
  # JUBLII GROUP - Convert to admin-only internal tool (Supabase Auth)

  This migration turns the public website + custom admin login into a
  login-only internal booking manager for the hall owner and staff.

  1. Auth model
    - Remove the custom `admin_users` table and its RPC functions
      (`authenticate_admin`, `get_all_bookings`, `add_booking`, `delete_booking`).
    - Authentication is now handled by Supabase Auth (email + password).
    - New `staff` profile table, keyed to `auth.users(id)`, holding a
      display name. A trigger creates the profile row automatically when
      an account is added in the Supabase dashboard.

  2. `bookings` table changes
    - New columns: `event_type`, `total_amount`, `advance_paid`,
      `balance_due` (generated), `booked_by`.
    - Legacy `booked_by_admin` is migrated into `booked_by` then dropped.

  3. Security
    - The public/anon read policy is removed entirely.
    - New policies: only authenticated users may read / insert / update /
      delete bookings. The existing UNIQUE(date, shift) constraint still
      prevents double-booking a slot.

  4. Retention
    - `cleanup_old_bookings()` is dropped. Bookings (and their payment
      records) are now kept permanently.
*/

-- ============================================================
-- 1. Drop legacy custom-auth objects
-- ============================================================
DROP FUNCTION IF EXISTS public.authenticate_admin(text, text);
DROP FUNCTION IF EXISTS public.get_all_bookings();
DROP FUNCTION IF EXISTS public.add_booking(uuid, date, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.delete_booking(uuid, uuid);
DROP FUNCTION IF EXISTS public.cleanup_old_bookings();
DROP TABLE IF EXISTS public.admin_users;

-- ============================================================
-- 2. Staff profile table (linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view staff" ON staff;
CREATE POLICY "Authenticated can view staff"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON staff;
CREATE POLICY "Users can update own profile"
  ON staff FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Auto-create a staff row whenever an auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill profiles for any users that already exist
INSERT INTO public.staff (id, display_name, email)
SELECT
  u.id,
  COALESCE(NULLIF(u.raw_user_meta_data->>'display_name', ''), split_part(u.email, '@', 1)),
  u.email
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. bookings: new columns
-- ============================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_type   text          NOT NULL DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount  numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS advance_paid  numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booked_by     text          NOT NULL DEFAULT '';

-- Migrate legacy booked_by_admin -> booked_by, then drop the old column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'booked_by_admin'
  ) THEN
    UPDATE bookings
      SET booked_by = booked_by_admin
      WHERE (booked_by IS NULL OR booked_by = '')
        AND booked_by_admin IS NOT NULL
        AND booked_by_admin <> '';
    ALTER TABLE bookings DROP COLUMN booked_by_admin;
  END IF;
END $$;

-- balance_due is always total_amount - advance_paid
ALTER TABLE bookings DROP COLUMN IF EXISTS balance_due;
ALTER TABLE bookings ADD COLUMN balance_due numeric(12,2)
  GENERATED ALWAYS AS (total_amount - advance_paid) STORED;

-- ============================================================
-- 4. RLS: authenticated-only, no public access
-- ============================================================
DROP POLICY IF EXISTS "Public can view bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;

DROP POLICY IF EXISTS "Authenticated can view bookings" ON bookings;
CREATE POLICY "Authenticated can view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert bookings" ON bookings;
CREATE POLICY "Authenticated can insert bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update bookings" ON bookings;
CREATE POLICY "Authenticated can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete bookings" ON bookings;
CREATE POLICY "Authenticated can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);
