export interface Booking {
  id: string;
  date: string;
  shift: 'day' | 'night';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
  booked_by_admin: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
}

export interface DayAvailability {
  date: string;
  dayBooked: boolean;
  nightBooked: boolean;
}

export type Page = 'home' | 'about' | 'gallery' | 'contact' | 'admin-login' | 'admin-dashboard';
