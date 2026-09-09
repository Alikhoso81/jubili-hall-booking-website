import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, List, PlusCircle, Pencil, Trash2, Sun, Moon,
  AlertCircle, CheckCircle, LogOut, Crown, RefreshCw, Download, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Booking, Tab, EVENT_TYPES } from '../lib/types';
import { useAuth } from '../lib/auth';
import { bookingsToCsv, downloadCsv } from '../lib/csv';
import Calendar from '../components/Calendar';

const todayStr = () => new Date().toISOString().split('T')[0];

const money = (n: number) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

function normalize(rows: Booking[]): Booking[] {
  return rows.map((b) => ({
    ...b,
    total_amount: Number(b.total_amount) || 0,
    advance_paid: Number(b.advance_paid) || 0,
    balance_due: Number(b.balance_due) || 0,
  }));
}

export default function Dashboard() {
  const { staff, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('calendar');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editing, setEditing] = useState<Booking | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: true })
      .order('shift', { ascending: true });
    if (!error && data) setBookings(normalize(data as Booking[]));
    if (error) showToast('error', 'Could not load bookings. Check your connection.');
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const refreshAll = () => {
    fetchBookings();
    setRefreshKey((k) => k + 1);
  };

  const handleAddNew = (date?: string) => {
    setEditing(null);
    setSelectedDate(date ?? '');
    setTab('add');
  };

  const handleEdit = (booking: Booking) => {
    setEditing(booking);
    setSelectedDate('');
    setTab('add');
  };

  const handleDelete = async (bookingId: string) => {
    if (!window.confirm('Delete this booking? This cannot be undone.')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) {
      showToast('error', 'Failed to delete booking.');
    } else {
      showToast('success', 'Booking deleted.');
      refreshAll();
    }
  };

  const handleExport = () => {
    if (bookings.length === 0) {
      showToast('error', 'No bookings to export.');
      return;
    }
    downloadCsv(`jublii-bookings-${todayStr()}.csv`, bookingsToCsv(bookings));
  };

  const today = todayStr();
  const upcoming = bookings.filter((b) => b.date >= today);
  const past = bookings.filter((b) => b.date < today);
  const outstanding = upcoming.reduce((sum, b) => sum + (b.balance_due || 0), 0);

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <div className="bg-[#0d1b0f] text-white pt-6 pb-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-[#C9A84C]" />
            <div>
              <div className="font-bold text-lg">JUBLII GROUP · Booking Manager</div>
              <div className="text-white/50 text-sm">
                Signed in as {staff?.display_name ?? '...'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshAll}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Bookings" value={String(bookings.length)} color="text-[#0d1b0f]" />
          <StatCard label="Upcoming" value={String(upcoming.length)} color="text-green-700" />
          <StatCard label="Past" value={String(past.length)} color="text-gray-500" />
          <StatCard label="Outstanding (upcoming)" value={money(outstanding)} color="text-amber-700" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm w-fit">
            {([
              { key: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-4 h-4" /> },
              { key: 'bookings', label: 'Bookings', icon: <List className="w-4 h-4" /> },
              { key: 'add', label: editing ? 'Edit Booking' : 'Add Booking', icon: <PlusCircle className="w-4 h-4" /> },
            ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => {
                  if (key !== 'add') setEditing(null);
                  setTab(key);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === key ? 'bg-[#0d1b0f] text-white shadow' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Calendar onDateSelect={handleAddNew} adminMode refreshKey={refreshKey} />
            </div>
            <div>
              <UpcomingBookings
                bookings={upcoming.slice(0, 8)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <BookingsList
            bookings={bookings}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        )}

        {tab === 'add' && (
          <BookingForm
            editing={editing}
            prefillDate={selectedDate}
            staffName={staff?.display_name ?? staff?.email ?? ''}
            onCancel={() => {
              setEditing(null);
              setTab('bookings');
            }}
            onSuccess={(message) => {
              refreshAll();
              showToast('success', message);
              setEditing(null);
              setTab('bookings');
            }}
            onError={(msg) => showToast('error', msg)}
          />
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1 font-medium">{label}</div>
    </div>
  );
}

function ShiftBadge({ shift }: { shift: 'day' | 'night' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        shift === 'day' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
      }`}
    >
      {shift === 'day' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
      {shift}
    </span>
  );
}

function fmtDate(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', opts);
}

function UpcomingBookings({
  bookings,
  onEdit,
  onDelete,
}: {
  bookings: Booking[];
  onEdit: (b: Booking) => void;
  onDelete: (id: string) => void;
}) {
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
        {bookings.map((b) => (
          <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {b.shift === 'day' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
                <span className="font-semibold text-[#0d1b0f] text-sm">
                  {fmtDate(b.date, { month: 'short', day: 'numeric' })}
                </span>
                <span className="capitalize text-xs text-gray-400">{b.shift}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                {b.customer_name}
                {b.event_type ? ` · ${b.event_type}` : ''}
              </div>
              {b.balance_due > 0 && (
                <div className="text-xs text-amber-600 mt-0.5">Balance {money(b.balance_due)}</div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(b)}
                className="text-gray-400 hover:text-[#0d1b0f] p-1 transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(b.id)}
                className="text-red-400 hover:text-red-600 p-1 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsList({
  bookings,
  loading,
  onEdit,
  onDelete,
  onExport,
}: {
  bookings: Booking[];
  loading: boolean;
  onEdit: (b: Booking) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [search, setSearch] = useState('');
  const today = todayStr();

  const filtered = bookings.filter((b) => {
    if (filter === 'upcoming' && b.date < today) return false;
    if (filter === 'past' && b.date >= today) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${b.customer_name} ${b.customer_phone} ${b.customer_email} ${b.event_type}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
        <h2 className="font-bold text-[#0d1b0f] text-lg">All Bookings</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / phone / event"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-52 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
          />
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['upcoming', 'all', 'past'] as const).map((f) => (
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
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 bg-[#0d1b0f] hover:bg-[#1a3320] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
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
                {['Date', 'Shift', 'Customer', 'Phone', 'Event', 'Total', 'Advance', 'Balance', 'Notes', 'By', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0d1b0f] whitespace-nowrap">
                    {fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3"><ShiftBadge shift={b.shift} /></td>
                  <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{b.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{b.customer_phone}</td>
                  <td className="px-4 py-3 text-gray-500">{b.event_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{money(b.total_amount)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{money(b.advance_paid)}</td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap font-medium ${
                      b.balance_due > 0 ? 'text-amber-700' : 'text-green-700'
                    }`}
                  >
                    {money(b.balance_due)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{b.notes || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{b.booked_by || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(b)}
                        className="text-gray-400 hover:text-[#0d1b0f] p-1 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(b.id)}
                        className="text-red-400 hover:text-red-600 p-1 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

interface BookingFormProps {
  editing: Booking | null;
  prefillDate: string;
  staffName: string;
  onCancel: () => void;
  onSuccess: (message: string) => void;
  onError: (msg: string) => void;
}

interface FormState {
  date: string;
  shift: 'day' | 'night';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_type: string;
  total_amount: string;
  advance_paid: string;
  notes: string;
}

function BookingForm({ editing, prefillDate, staffName, onCancel, onSuccess, onError }: BookingFormProps) {
  const today = todayStr();
  const [form, setForm] = useState<FormState>({
    date: editing?.date || prefillDate || today,
    shift: editing?.shift || 'day',
    customer_name: editing?.customer_name || '',
    customer_phone: editing?.customer_phone || '',
    customer_email: editing?.customer_email || '',
    event_type: editing?.event_type || '',
    total_amount: editing ? String(editing.total_amount) : '',
    advance_paid: editing ? String(editing.advance_paid) : '',
    notes: editing?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const total = parseFloat(form.total_amount) || 0;
  const advance = parseFloat(form.advance_paid) || 0;
  const balance = total - advance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (advance > total) {
      onError('Advance paid cannot be more than the total amount.');
      return;
    }

    setLoading(true);

    const payload = {
      date: form.date,
      shift: form.shift,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim(),
      event_type: form.event_type,
      total_amount: total,
      advance_paid: advance,
      notes: form.notes.trim(),
    };

    let errorMessage: string | null = null;

    if (editing) {
      const { error } = await supabase.from('bookings').update(payload).eq('id', editing.id);
      errorMessage = error?.code === '23505'
        ? 'That date and shift is already booked by someone else.'
        : error?.message ?? null;
    } else {
      const { error } = await supabase
        .from('bookings')
        .insert({ ...payload, booked_by: staffName });
      errorMessage = error?.code === '23505'
        ? 'This slot is already booked. Pick another date or shift.'
        : error?.message ?? null;
    }

    setLoading(false);

    if (errorMessage) {
      onError(errorMessage);
    } else {
      onSuccess(editing ? 'Booking updated.' : 'Booking added.');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#0d1b0f] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">{editing ? 'Edit Booking' : 'New Booking'}</h2>
            <p className="text-white/50 text-sm">
              {editing ? 'Update the booking details' : 'Fill in customer details to register a booking'}
            </p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Cancel">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Shift *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['day', 'night'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set({ shift: s })}
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
                onChange={(e) => set({ customer_name: e.target.value })}
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
                onChange={(e) => set({ customer_phone: e.target.value })}
                placeholder="+92 300 0000000"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Email (optional)</label>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => set({ customer_email: e.target.value })}
                placeholder="customer@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Event Type</label>
              <select
                value={form.event_type}
                onChange={(e) => set({ event_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              >
                <option value="">—</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Total Amount (Rs)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.total_amount}
                onChange={(e) => set({ total_amount: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Advance Paid (Rs)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.advance_paid}
                onChange={(e) => set({ advance_paid: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Balance Due</label>
              <div
                className={`w-full px-4 py-3 border rounded-xl text-sm font-semibold ${
                  balance > 0
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-green-200 bg-green-50 text-green-700'
                }`}
              >
                {money(balance)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Special requirements, catering, guest count, etc."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent resize-none"
            />
          </div>

          {!editing && staffName && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500">
              Booking registered by: <span className="font-semibold text-gray-700">{staffName}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-gray-700 border border-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#0d1b0f] hover:bg-[#1a3320] text-white py-3.5 rounded-xl font-semibold tracking-wider text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  {editing ? 'Save Changes' : 'Confirm Booking'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
