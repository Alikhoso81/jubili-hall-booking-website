export interface Booking {
  id: string;
  date: string;
  shift: 'day' | 'night';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_type: string;
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  notes: string;
  booked_by: string;
  created_at: string;
}

export interface Staff {
  id: string;
  display_name: string;
  email: string;
}

export interface DayAvailability {
  date: string;
  dayBooked: boolean;
  nightBooked: boolean;
}

export type Tab = 'calendar' | 'bookings' | 'add';

export const EVENT_TYPES = [
  'Wedding',
  'Engagement',
  'Reception',
  'Birthday',
  'Corporate',
  'Other',
] as const;
