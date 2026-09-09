/*
  # JUBLII GROUP - Venue management expansion

  Builds the schema for the full internal venue-management tool:
  venues, a richer bookings model, per-event charges and payments,
  company settings, and role/permission fields on staff.

  1. New tables
    - `venues`            - each hall / branch
    - `booking_venues`    - extra halls for a multi-hall event
    - `charges`           - line items on a booking (hall rent, catering, decor...)
    - `payments`          - advances / collections against a booking
    - `company_settings`  - single-row workspace config (tax rate, lists...)

  2. `bookings` reshaped
    - date -> event_date, + end_date, is_multi_day
    - shift -> time_slot, + start_time, end_time
    - customer_* -> client_*
    - + venue_id, guest_count, status, created_by, booking_no
    - money columns (total_amount / advance_paid / balance_due) are dropped;
      any existing values are migrated into `charges` / `payments`
    - the old UNIQUE(date, shift) constraint is dropped (conflicts are now
      surfaced in the calendar UI, and multi-hall / multi-day allow overlap)

  3. `staff` gets `role`, `permissions[]`, `is_active`. Existing profiles
     become `admin`; the new-user trigger makes the very first account admin
     and everyone after that a `booker`.

  4. `booking_totals` view - subtotal + paid per booking, for dashboards.

  5. RLS - every table stays authenticated-only, no anon access.
*/

-- ============================================================
-- 1. venues
-- ============================================================
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity integer,
  notes text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage venues" ON venues;
CREATE POLICY "Authenticated manage venues"
  ON venues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- A default venue so existing bookings have somewhere to live
INSERT INTO venues (name)
SELECT 'Main Hall'
WHERE NOT EXISTS (SELECT 1 FROM venues);

-- ============================================================
-- 2. company_settings (single row, id = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_settings (
  id integer PRIMARY KEY DEFAULT 1,
  name text NOT NULL DEFAULT 'JUBLII GROUP',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PKR',
  event_types text[] NOT NULL DEFAULT ARRAY[
    'Wedding','Walima','Mehndi','Barat','Engagement','Birthday','Corporate','Other'
  ],
  time_slots text[] NOT NULL DEFAULT ARRAY['Breakfast','Lunch','Dinner','Full Day'],
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT company_settings_single_row CHECK (id = 1)
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read settings" ON company_settings;
CREATE POLICY "Authenticated read settings"
  ON company_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated update settings" ON company_settings;
CREATE POLICY "Authenticated update settings"
  ON company_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. staff: role / permissions / active flag
-- ============================================================
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role        text    NOT NULL DEFAULT 'booker';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions text[]  NOT NULL DEFAULT '{}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active   boolean NOT NULL DEFAULT true;

-- Everyone who already has a profile is an owner/admin
UPDATE staff SET role = 'admin' WHERE role = 'booker';

-- Invites: an admin adds an email + role here; the person then signs up
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'booker',
  permissions text[] NOT NULL DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage invites" ON invites;
CREATE POLICY "Authenticated manage invites"
  ON invites FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Recreate the signup trigger:
--   invited email  -> role/permissions from the invite (invite is consumed)
--   first account  -> admin
--   everyone else  -> booker
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites%ROWTYPE;
  v_role text;
  v_perms text[] := '{}';
  v_name text;
BEGIN
  SELECT * INTO v_invite FROM public.invites
    WHERE lower(email) = lower(COALESCE(NEW.email, ''))
    LIMIT 1;

  IF FOUND THEN
    v_role := v_invite.role;
    v_perms := v_invite.permissions;
    v_name := NULLIF(v_invite.display_name, '');
    DELETE FROM public.invites WHERE id = v_invite.id;
  ELSIF NOT EXISTS (SELECT 1 FROM public.staff) THEN
    v_role := 'admin';
  ELSE
    v_role := 'booker';
  END IF;

  INSERT INTO public.staff (id, display_name, email, role, permissions)
  VALUES (
    NEW.id,
    COALESCE(
      v_name,
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Staff'
    ),
    COALESCE(NEW.email, ''),
    v_role,
    v_perms
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. bookings reshape
-- ============================================================

-- 4a. new columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS venue_id     uuid REFERENCES venues(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_date     date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_multi_day boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_slot    text    NOT NULL DEFAULT 'Dinner';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time   time;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time     time;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_count  integer NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status       text    NOT NULL DEFAULT 'tentative';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4b. rename customer_* -> client_* (guarded so the migration is re-runnable)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bookings' AND column_name='customer_name') THEN
    ALTER TABLE bookings RENAME COLUMN customer_name TO client_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bookings' AND column_name='customer_phone') THEN
    ALTER TABLE bookings RENAME COLUMN customer_phone TO client_phone;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bookings' AND column_name='customer_email') THEN
    ALTER TABLE bookings RENAME COLUMN customer_email TO client_email;
  END IF;
END $$;

-- 4c. date -> event_date
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bookings' AND column_name='date') THEN
    ALTER TABLE bookings RENAME COLUMN date TO event_date;
  END IF;
END $$;

-- 4d. shift -> time_slot values, then drop shift + its unique constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_date_shift_key;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bookings' AND column_name='shift') THEN
    UPDATE bookings SET time_slot = CASE WHEN shift = 'day' THEN 'Lunch' ELSE 'Dinner' END;
    ALTER TABLE bookings DROP COLUMN shift;
  END IF;
END $$;

-- 4e. attach existing bookings to the default venue, mark them confirmed
UPDATE bookings
  SET venue_id = (SELECT id FROM venues ORDER BY created_at LIMIT 1)
  WHERE venue_id IS NULL;
UPDATE bookings SET status = 'confirmed' WHERE status = 'tentative';

-- 4f. sequential booking number for invoices
CREATE SEQUENCE IF NOT EXISTS bookings_no_seq;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_no bigint;
UPDATE bookings SET booking_no = nextval('bookings_no_seq') WHERE booking_no IS NULL;
ALTER TABLE bookings ALTER COLUMN booking_no SET DEFAULT nextval('bookings_no_seq');
ALTER TABLE bookings ALTER COLUMN booking_no SET NOT NULL;

-- 4g. status check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('tentative','confirmed','completed','cancelled'));

-- ============================================================
-- 5. booking_venues (multi-hall)
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_venues (
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  venue_id   uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, venue_id)
);

ALTER TABLE booking_venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage booking_venues" ON booking_venues;
CREATE POLICY "Authenticated manage booking_venues"
  ON booking_venues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 6. charges
-- ============================================================
CREATE TABLE IF NOT EXISTS charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  rate numeric(12,2) NOT NULL DEFAULT 0,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  is_per_head boolean NOT NULL DEFAULT false,
  amount numeric(14,2) GENERATED ALWAYS AS (rate * quantity) STORED,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage charges" ON charges;
CREATE POLICY "Authenticated manage charges"
  ON charges FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS charges_booking_id_idx ON charges(booking_id);

-- ============================================================
-- 7. payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  method text NOT NULL DEFAULT 'cash',
  reference text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage payments" ON payments;
CREATE POLICY "Authenticated manage payments"
  ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON payments(booking_id);

-- ============================================================
-- 8. migrate legacy money columns -> charges / payments, then drop
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bookings' AND column_name='total_amount') THEN

    INSERT INTO charges (booking_id, description, category, rate, quantity)
    SELECT id, 'Booking charge', 'hall_rent', total_amount, 1
    FROM bookings
    WHERE total_amount IS NOT NULL AND total_amount > 0;

    INSERT INTO payments (booking_id, amount, note)
    SELECT id, advance_paid, 'Advance (migrated)'
    FROM bookings
    WHERE advance_paid IS NOT NULL AND advance_paid > 0;

    ALTER TABLE bookings DROP COLUMN IF EXISTS balance_due;
    ALTER TABLE bookings DROP COLUMN total_amount;
    ALTER TABLE bookings DROP COLUMN IF EXISTS advance_paid;
  END IF;
END $$;

-- ============================================================
-- 9. booking_totals view
-- ============================================================
CREATE OR REPLACE VIEW booking_totals
WITH (security_invoker = on) AS
SELECT
  b.id AS booking_id,
  COALESCE((SELECT SUM(c.amount) FROM charges c  WHERE c.booking_id = b.id), 0)::numeric(14,2) AS subtotal,
  COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = b.id), 0)::numeric(14,2) AS paid
FROM bookings b;

GRANT SELECT ON booking_totals TO authenticated;

-- ============================================================
-- 10. table privileges (no anon anywhere)
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON venues, booking_venues, charges, payments, invites TO authenticated;
GRANT SELECT, UPDATE ON company_settings TO authenticated;
REVOKE ALL ON venues, booking_venues, charges, payments, company_settings, invites FROM anon;
