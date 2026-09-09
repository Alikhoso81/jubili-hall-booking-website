import { supabase } from './supabase';
import { Booking, BookingTotals, Charge, Payment, Staff } from './types';
import { toNumber } from './format';

export interface BookingRow extends Booking {
  subtotal: number;
  paid: number;
}

function normBooking(b: Booking): Booking {
  return { ...b, guest_count: toNumber(b.guest_count), booking_no: toNumber(b.booking_no) };
}

/** All bookings joined with their subtotal / paid totals. */
export async function fetchBookingRows(): Promise<BookingRow[]> {
  const [{ data: bookings, error: be }, { data: totals, error: te }] = await Promise.all([
    supabase.from('bookings').select('*').order('event_date', { ascending: false }),
    supabase.from('booking_totals').select('*'),
  ]);
  if (be) throw be;
  if (te) throw te;

  const totalsById = new Map<string, BookingTotals>();
  (totals ?? []).forEach((t) => {
    const row = t as BookingTotals;
    totalsById.set(row.booking_id, { ...row, subtotal: toNumber(row.subtotal), paid: toNumber(row.paid) });
  });

  return (bookings ?? []).map((raw) => {
    const b = normBooking(raw as Booking);
    const t = totalsById.get(b.id);
    return { ...b, subtotal: t?.subtotal ?? 0, paid: t?.paid ?? 0 };
  });
}

export interface BookingBundle {
  booking: Booking;
  charges: Charge[];
  payments: Payment[];
  extraVenueIds: string[];
}

export async function fetchBookingBundle(id: string): Promise<BookingBundle | null> {
  const [{ data: booking }, { data: charges }, { data: payments }, { data: bv }] = await Promise.all([
    supabase.from('bookings').select('*').eq('id', id).maybeSingle(),
    supabase.from('charges').select('*').eq('booking_id', id).order('sort_order', { ascending: true }),
    supabase.from('payments').select('*').eq('booking_id', id).order('paid_on', { ascending: true }),
    supabase.from('booking_venues').select('venue_id').eq('booking_id', id),
  ]);

  if (!booking) return null;

  return {
    booking: normBooking(booking as Booking),
    charges: (charges ?? []).map((c) => {
      const row = c as Charge;
      return { ...row, rate: toNumber(row.rate), quantity: toNumber(row.quantity), amount: toNumber(row.amount) };
    }),
    payments: (payments ?? []).map((p) => {
      const row = p as Payment;
      return { ...row, amount: toNumber(row.amount) };
    }),
    extraVenueIds: (bv ?? []).map((r) => (r as { venue_id: string }).venue_id),
  };
}

export async function fetchStaffList(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('id, display_name, email, role, permissions, is_active')
    .order('display_name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Staff[];
}

export interface ChargeInput {
  description: string;
  category: string;
  rate: number;
  quantity: number;
  is_per_head: boolean;
}

export interface BookingInput {
  venue_id: string;
  event_date: string;
  end_date: string | null;
  is_multi_day: boolean;
  time_slot: string;
  start_time: string | null;
  end_time: string | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  event_type: string;
  guest_count: number;
  status: string;
  notes: string;
}

/** Create a booking + its charges + optional extra venues in one go. */
export async function createBooking(
  input: BookingInput,
  charges: ChargeInput[],
  extraVenueIds: string[],
  meta: { booked_by: string; created_by: string | null }
): Promise<string> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({ ...input, booked_by: meta.booked_by, created_by: meta.created_by })
    .select('id')
    .single();
  if (error) throw error;
  const bookingId = (data as { id: string }).id;

  if (charges.length > 0) {
    const { error: ce } = await supabase.from('charges').insert(
      charges.map((c, i) => ({ ...c, booking_id: bookingId, sort_order: i }))
    );
    if (ce) throw ce;
  }

  if (extraVenueIds.length > 0) {
    const { error: ve } = await supabase.from('booking_venues').insert(
      extraVenueIds.map((venue_id) => ({ booking_id: bookingId, venue_id }))
    );
    if (ve) throw ve;
  }

  return bookingId;
}
