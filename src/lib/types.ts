export type BookingStatus = 'tentative' | 'confirmed' | 'completed' | 'cancelled';

export type ChargeCategory = 'hall_rent' | 'catering' | 'decor' | 'other';

export type PaymentMethod = 'cash' | 'bank' | 'card' | 'other';

export interface Venue {
  id: string;
  name: string;
  capacity: number | null;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_no: number;
  venue_id: string | null;
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
  status: BookingStatus;
  notes: string;
  booked_by: string;
  created_by: string | null;
  created_at: string;
}

export interface BookingTotals {
  booking_id: string;
  subtotal: number;
  paid: number;
}

export interface Charge {
  id: string;
  booking_id: string;
  description: string;
  category: ChargeCategory;
  rate: number;
  quantity: number;
  is_per_head: boolean;
  amount: number;
  sort_order: number;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  paid_on: string;
  method: PaymentMethod;
  reference: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface CompanySettings {
  id: number;
  name: string;
  address: string;
  phone: string;
  tax_rate: number;
  currency: string;
  event_types: string[];
  time_slots: string[];
}

export interface Staff {
  id: string;
  display_name: string;
  email: string;
  role: string;
  permissions: string[];
  is_active: boolean;
}

export const CHARGE_CATEGORIES: { value: ChargeCategory; label: string; perHead?: boolean }[] = [
  { value: 'hall_rent', label: 'Hall Rent' },
  { value: 'catering', label: 'Catering (per head)', perHead: true },
  { value: 'decor', label: 'Decor' },
  { value: 'other', label: 'Add-on / Other' },
];

export const STATUS_META: Record<BookingStatus, { label: string; dot: string; chip: string }> = {
  tentative: { label: 'Tentative', dot: 'bg-amber-400', chip: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmed', dot: 'bg-[#C9A84C]', chip: 'bg-[#C9A84C]/15 text-[#8a6d24] border-[#C9A84C]/30' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelled', dot: 'bg-gray-400', chip: 'bg-gray-100 text-gray-500 border-gray-200 line-through' },
};
