/*
  JUBLII Booking Manager — full database setup for a NEW Supabase project.

  Use this instead of the files in migrations/ when starting from a blank
  project. Paste the whole thing into Supabase → SQL Editor → Run. Once.

  Safe to re-run (uses IF NOT EXISTS / drop-then-create).
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity integer,
  notes text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS bookings_no_seq;

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_no bigint NOT NULL DEFAULT nextval('bookings_no_seq'),
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  event_date date NOT NULL,
  end_date date,
  is_multi_day boolean NOT NULL DEFAULT false,
  time_slot text NOT NULL DEFAULT 'Dinner',
  start_time time,
  end_time time,
  client_name text NOT NULL DEFAULT '',
  client_phone text NOT NULL DEFAULT '',
  client_email text NOT NULL DEFAULT '',
  event_type text NOT NULL DEFAULT '',
  guest_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'tentative'
    CHECK (status IN ('tentative','confirmed','completed','cancelled')),
  notes text NOT NULL DEFAULT '',
  booked_by text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_venues (
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  venue_id   uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, venue_id)
);

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
CREATE INDEX IF NOT EXISTS charges_booking_id_idx ON charges(booking_id);

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
CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON payments(booking_id);

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

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'booker',
  permissions text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'booker',
  permissions text[] NOT NULL DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed rows
INSERT INTO venues (name) SELECT 'Main Hall' WHERE NOT EXISTS (SELECT 1 FROM venues);
INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- New-user trigger
--   invited email  -> role/permissions from the invite, active
--   first account  -> admin, active
--   anyone else    -> booker, but INACTIVE until an admin turns them on
--                     (protects you if account sign-ups are ever left open)
-- ============================================================
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
  v_active boolean := true;
BEGIN
  SELECT * INTO v_invite FROM public.invites
    WHERE lower(email) = lower(COALESCE(NEW.email, '')) LIMIT 1;

  IF FOUND THEN
    v_role := v_invite.role;
    v_perms := v_invite.permissions;
    v_name := NULLIF(v_invite.display_name, '');
    DELETE FROM public.invites WHERE id = v_invite.id;
  ELSIF NOT EXISTS (SELECT 1 FROM public.staff) THEN
    v_role := 'admin';
  ELSE
    v_role := 'booker';
    v_active := false;
  END IF;

  INSERT INTO public.staff (id, display_name, email, role, permissions, is_active)
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
    v_perms,
    v_active
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill any users that already exist (e.g. you added one before running this)
INSERT INTO public.staff (id, display_name, email, role)
SELECT
  u.id,
  COALESCE(NULLIF(u.raw_user_meta_data->>'display_name', ''),
           NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''), 'Staff'),
  COALESCE(u.email, ''),
  CASE WHEN row_number() OVER (ORDER BY u.created_at) = 1 THEN 'admin' ELSE 'booker' END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- booking_totals view
-- ============================================================
CREATE OR REPLACE VIEW booking_totals
WITH (security_invoker = on) AS
SELECT
  b.id AS booking_id,
  COALESCE((SELECT SUM(c.amount) FROM charges c  WHERE c.booking_id = b.id), 0)::numeric(14,2) AS subtotal,
  COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = b.id), 0)::numeric(14,2) AS paid
FROM bookings b;

-- ============================================================
-- Row Level Security — signed-in users only, no anon
-- ============================================================
ALTER TABLE venues            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_venues    ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites           ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['venues','bookings','booking_venues','charges','payments','invites']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t || '_all', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS staff_select ON staff;
CREATE POLICY staff_select ON staff FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS staff_update ON staff;
CREATE POLICY staff_update ON staff FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS settings_select ON company_settings;
CREATE POLICY settings_select ON company_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS settings_update ON company_settings;
CREATE POLICY settings_update ON company_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Grants
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON
  venues, bookings, booking_venues, charges, payments, staff, invites TO authenticated;
GRANT SELECT, UPDATE ON company_settings TO authenticated;
GRANT SELECT ON booking_totals TO authenticated;

REVOKE ALL ON
  venues, bookings, booking_venues, charges, payments, company_settings, staff, invites
  FROM anon;
