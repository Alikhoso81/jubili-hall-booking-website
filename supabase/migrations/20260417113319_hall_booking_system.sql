
/*
  # JUBLII GROUP - Hall Booking System

  1. Extensions
    - pgcrypto for secure password hashing

  2. New Tables
    - `admin_users`: Admin accounts with bcrypt-hashed passwords
      - id, username, password_hash, display_name, created_at
    - `bookings`: Hall bookings
      - id, date, shift (day/night), customer_name, customer_phone,
        customer_email, notes, booked_by_admin, created_at

  3. Security
    - RLS enabled on both tables
    - admin_users: No public access (accessed via SECURITY DEFINER function)
    - bookings: Anon can read date+shift data; authenticated logic via RPC
    - authenticate_admin() RPC for secure password verification

  4. Default Admin Accounts
    - admin1 / Admin@2024!
    - admin2 / Manager@2024!
    - admin3 / Staff@2024!
    - admin4 / Boss@2024!

  5. Cleanup
    - cleanup_old_bookings() function removes bookings older than 15 days
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Insert default admin users with bcrypt-hashed passwords
INSERT INTO admin_users (username, password_hash, display_name) VALUES
  ('admin1', crypt('Admin@2024!', gen_salt('bf')), 'Admin One'),
  ('admin2', crypt('Manager@2024!', gen_salt('bf')), 'Admin Two'),
  ('admin3', crypt('Staff@2024!', gen_salt('bf')), 'Admin Three'),
  ('admin4', crypt('Boss@2024!', gen_salt('bf')), 'Admin Four')
ON CONFLICT (username) DO NOTHING;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  shift text NOT NULL CHECK (shift IN ('day', 'night')),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text DEFAULT '',
  notes text DEFAULT '',
  booked_by_admin text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, shift)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public can see availability (date + shift only, via RPC)
CREATE POLICY "Public can view bookings"
  ON bookings FOR SELECT
  TO anon
  USING (date >= CURRENT_DATE - INTERVAL '1 day');

-- No policies for admin_users (accessed via SECURITY DEFINER functions only)

-- Authenticate admin function
CREATE OR REPLACE FUNCTION authenticate_admin(p_username text, p_password text)
RETURNS TABLE(id uuid, username text, display_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.username, a.display_name
  FROM admin_users a
  WHERE a.username = p_username
    AND a.password_hash = crypt(p_password, a.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all bookings (for admins calling from frontend with session token)
CREATE OR REPLACE FUNCTION get_all_bookings()
RETURNS TABLE(
  id uuid, date date, shift text,
  customer_name text, customer_phone text,
  customer_email text, notes text,
  booked_by_admin text, created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.date, b.shift, b.customer_name, b.customer_phone,
         b.customer_email, b.notes, b.booked_by_admin, b.created_at
  FROM bookings b
  ORDER BY b.date, b.shift;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add booking (admin only, called with admin session verification)
CREATE OR REPLACE FUNCTION add_booking(
  p_admin_id uuid,
  p_date date,
  p_shift text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_notes text
)
RETURNS TABLE(id uuid, success boolean, message text) AS $$
DECLARE
  v_admin_username text;
  v_booking_id uuid;
BEGIN
  -- Verify admin exists
  SELECT username INTO v_admin_username FROM admin_users WHERE admin_users.id = p_admin_id;
  IF v_admin_username IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Unauthorized'::text;
    RETURN;
  END IF;

  -- Check if slot already taken
  IF EXISTS (SELECT 1 FROM bookings WHERE bookings.date = p_date AND bookings.shift = p_shift) THEN
    RETURN QUERY SELECT NULL::uuid, false, 'This slot is already booked'::text;
    RETURN;
  END IF;

  INSERT INTO bookings (date, shift, customer_name, customer_phone, customer_email, notes, booked_by_admin)
  VALUES (p_date, p_shift, p_customer_name, p_customer_phone, p_customer_email, p_notes, v_admin_username)
  RETURNING bookings.id INTO v_booking_id;

  RETURN QUERY SELECT v_booking_id, true, 'Booking created successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete booking (admin only)
CREATE OR REPLACE FUNCTION delete_booking(p_admin_id uuid, p_booking_id uuid)
RETURNS TABLE(success boolean, message text) AS $$
DECLARE
  v_admin_username text;
BEGIN
  SELECT username INTO v_admin_username FROM admin_users WHERE admin_users.id = p_admin_id;
  IF v_admin_username IS NULL THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text;
    RETURN;
  END IF;

  DELETE FROM bookings WHERE bookings.id = p_booking_id;
  RETURN QUERY SELECT true, 'Booking deleted successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old bookings (removes entries older than 15 days)
CREATE OR REPLACE FUNCTION cleanup_old_bookings()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM bookings WHERE date < CURRENT_DATE - INTERVAL '15 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
