import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, List, PlusCircle, Trash2, Sun, Moon,
  AlertCircle, CheckCircle, LogOut, Crown, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Booking, AdminUser, Page } from '../lib/types';
import { clearAdminSession } from '../lib/adminAuth';
import Calendar from '../components/Calendar';

interface AdminDashboardProps {
  admin: AdminUser;
  onNavigate: (page: Page) => void;
}

type Tab = 'calendar' | 'bookings' | 'add';

export default function AdminDashboard({ admin, onNavigate }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('calendar');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_bookings');
    if (!error && data) setBookings(data as Booking[]);
    setLoading(false);
  }, []);

  const runCleanup = useCallback(async () => {
    const { data } = await supabase.rpc('cleanup_old_bookings');
    if (data && data > 0) {
      showToast('success', `Cleaned up ${data} old booking(s) (>15 days).`);
      fetchBookings();
      setRefreshKey(k => k + 1);
    }
  }, [fetchBookings]);

  useEffect(() => {
    fetchBookings();
    runCleanup();
  }, [fetchBookings, runCleanup]);

  const handleLogout = () => {
    clearAdminSession();
    onNavigate('home');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setTab('add');
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    const { data, error } = await supabase.rpc('delete_booking', {
      p_admin_id: admin.id,
      p_booking_id: bookingId,
    });
    if (error || !data?.[0]?.success) {
      showToast('error', data?.[0]?.message || 'Failed to delete booking.');
    } else {
      showToast('success', 'Booking deleted.');
      fetchBookings();
      setRefreshKey(k => k + 1);
    }
  };

  const upcoming = bookings.filter(b => b.date >= new Date().toISOString().split('T')[0]);
  const past = bookings.filter(b => b.date < new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <div className="bg-[#0d1b0f] text-white pt-20 pb-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-[#C9A84C]" />
            <div>
              <div className="font-bold text-lg">Admin Dashboard</div>
              <div className="text-white/50 text-sm">Welcome, {admin.display_name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchBookings(); setRefreshKey(k => k + 1); }}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Bookings" value={bookings.length} color="text-[#0d1b0f]" />
          <StatCard label="Upcoming" value={upcoming.length} color="text-green-700" />
          <StatCard label="Past" value={past.length} color="text-gray-500" />
        </div>

        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
          {([
            { key: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-4 h-4" /> },
            { key: 'bookings', label: 'Bookings', icon: <List className="w-4 h-4" /> },
            { key: 'add', label: 'Add Booking', icon: <PlusCircle className="w-4 h-4" /> },
          ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-[#0d1b0f] text-white shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {tab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Calendar
                onDateSelect={handleDateSelect}
                adminMode
                refreshKey={refreshKey}
              />
            </div>
            <div>
              <UpcomingBookings
                bookings={upcoming.slice(0, 8)}
                onDelete={handleDeleteBooking}
              />
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <BookingsList
            bookings={bookings}
            loading={loading}
            onDelete={handleDeleteBooking}
          />
        )}

        {tab === 'add' && (
          <AddBookingForm
            admin={admin}
            prefillDate={selectedDate}
            onSuccess={() => {
              fetchBookings();
              setRefreshKey(k => k + 1);
              showToast('success', 'Booking added successfully!');
              setTab('bookings');
            }}
            onError={(msg) => showToast('error', msg)}
          />
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-5 h-5" />
            : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1 font-medium">{label}</div>
    </div>
  );
}

function UpcomingBookings({ bookings, onDelete }: { bookings: Booking[]; onDelete: (id: string) => void }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">
        No upcoming bookings.
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-[#0d1b0f] px-4 py-3">
        <span className="text-white font-semibold text-sm">Upcoming Bookings</span>
      </div>
      <div className="divide-y divide-gray-50">
        {bookings.map(b => (
          <div key={b.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {b.shift === 'day'
                  ? <Sun className="w-3.5 h-3.5 text-amber-500" />
                  : <Moon className="w-3.5 h-3.5 text-blue-500" />}
                <span className="font-semibold text-[#0d1b0f] text-sm">
                  {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="capitalize text-xs text-gray-400">{b.shift}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{b.customer_name}</div>
            </div>
            <button
              onClick={() => onDelete(b.id)}
              className="text-red-400 hover:text-red-600 p-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsList({ bookings, loading, onDelete }: {
  bookings: Booking[];
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const today = new Date().toISOString().split('T')[0];

  const filtered = bookings.filter(b => {
    if (filter === 'upcoming') return b.date >= today;
    if (filter === 'past') return b.date < today;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-bold text-[#0d1b0f] text-lg">All Bookings</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['upcoming', 'all', 'past'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-white shadow text-[#0d1b0f]' : 'text-gray-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No bookings found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Shift', 'Customer', 'Phone', 'Email', 'Notes', 'Booked By', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0d1b0f] whitespace-nowrap">
                    {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.shift === 'day'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {b.shift === 'day' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                      {b.shift}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{b.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500">{b.customer_phone}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{b.customer_email || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">{b.notes || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{b.booked_by_admin}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onDelete(b.id)}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface AddBookingFormProps {
  admin: AdminUser;
  prefillDate: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

function AddBookingForm({ admin, prefillDate, onSuccess, onError }: AddBookingFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: prefillDate || today,
    shift: 'day' as 'day' | 'night',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.rpc('add_booking', {
      p_admin_id: admin.id,
      p_date: form.date,
      p_shift: form.shift,
      p_customer_name: form.customer_name.trim(),
      p_customer_phone: form.customer_phone.trim(),
      p_customer_email: form.customer_email.trim(),
      p_notes: form.notes.trim(),
    });

    if (error || !data?.[0]?.success) {
      onError(data?.[0]?.message || error?.message || 'Failed to create booking.');
    } else {
      setForm({ date: today, shift: 'day', customer_name: '', customer_phone: '', customer_email: '', notes: '' });
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#0d1b0f] px-6 py-4">
          <h2 className="text-white font-bold text-lg">New Booking</h2>
          <p className="text-white/50 text-sm">Fill in customer details to register a booking</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Date *</label>
              <input
                type="date"
                value={form.date}
                min={today}
                onChange={e => handleChange('date', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Shift *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['day', 'night'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleChange('shift', s)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.shift === s
                        ? s === 'day'
                          ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {s === 'day' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {s === 'day' ? 'Day' : 'Night'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Customer Name *</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={e => handleChange('customer_name', e.target.value)}
                placeholder="Full name"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Phone Number *</label>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={e => handleChange('customer_phone', e.target.value)}
                placeholder="+92 300 000 0000"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Email (optional)</label>
            <input
              type="email"
              value={form.customer_email}
              onChange={e => handleChange('customer_email', e.target.value)}
              placeholder="customer@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Event type, special requirements, etc."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500">
            Booking registered by: <span className="font-semibold text-gray-700">{admin.display_name} ({admin.username})</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d1b0f] hover:bg-[#1a3320] text-white py-3.5 rounded-xl font-semibold tracking-wider text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                Confirm Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
