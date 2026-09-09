import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  CalendarPlus, CalendarDays, ClipboardList, ReceiptText, AlertTriangle,
  Users2, Wallet, TrendingUp, ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useWorkspace } from '../../lib/workspace';
import { fetchBookingRows, BookingRow } from '../../lib/api';
import { money, formatDate, localISO, toNumber } from '../../lib/format';
import { STATUS_META } from '../../lib/types';
import { Card, StatCard, Loading, Badge } from '../../components/ui';

type RangeKey = 'this_month' | 'last_month' | 'this_year' | 'all';

function rangeFor(key: RangeKey): { from: string; to: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (key === 'last_month') {
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0);
    return { from: localISO(from), to: localISO(to), label: `${from.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` };
  }
  if (key === 'this_year') return { from: `${y}-01-01`, to: `${y}-12-31`, label: `${y}` };
  if (key === 'all') return { from: '1900-01-01', to: '2999-12-31', label: 'All time' };
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return { from: localISO(from), to: localISO(to), label: from.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { staff } = useAuth();
  const { venues } = useWorkspace();
  const [rangeKey, setRangeKey] = useState<RangeKey>('this_month');
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [paymentsInRange, setPaymentsInRange] = useState(0);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => rangeFor(rangeKey), [rangeKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchBookingRows(),
      supabase.from('payments').select('amount, paid_on').gte('paid_on', range.from).lte('paid_on', range.to),
    ])
      .then(([all, pay]) => {
        if (!active) return;
        setRows(all);
        setPaymentsInRange((pay.data ?? []).reduce((s, p) => s + toNumber((p as { amount: number }).amount), 0));
      })
      .catch(() => {
        if (active) setRows([]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  const inRange = rows.filter((b) => b.event_date >= range.from && b.event_date <= range.to && b.status !== 'cancelled');
  const bookedValue = inRange.reduce((s, b) => s + b.subtotal, 0);
  const remaining = inRange.reduce((s, b) => s + Math.max(b.subtotal - b.paid, 0), 0);

  const trend = useMemo(() => buildTrend(inRange, range.from, range.to), [inRange, range.from, range.to]);

  const venuePerf = venues
    .map((v) => {
      const bs = inRange.filter((b) => b.venue_id === v.id);
      return {
        id: v.id,
        name: v.name,
        bookings: bs.length,
        value: bs.reduce((s, b) => s + b.subtotal, 0),
        remaining: bs.reduce((s, b) => s + Math.max(b.subtotal - b.paid, 0), 0),
      };
    })
    .filter((v) => v.bookings > 0);

  const upcoming = [...inRange].sort((a, b) => a.event_date.localeCompare(b.event_date)).slice(0, 6);

  const quickActions = [
    { icon: CalendarPlus, title: 'New booking', hint: 'Create a new venue reservation', to: '/bookings/new' },
    { icon: CalendarDays, title: 'Booking calendar', hint: 'Review the event schedule', to: '/calendar' },
    { icon: ClipboardList, title: 'All bookings', hint: 'See reservation totals and status', to: '/bookings' },
    { icon: ReceiptText, title: 'Invoices', hint: 'Print invoices and track balances', to: '/invoices' },
    { icon: AlertTriangle, title: 'Outstanding balances', hint: 'Bookings with money still due', to: '/bookings' },
  ];

  if (loading) return <Loading />;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase mb-1">Venue business overview</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d1b0f]">
            Welcome back, {staff?.display_name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Bookings, collections and venue performance in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={rangeKey}
            onChange={(e) => setRangeKey(e.target.value as RangeKey)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="all">All time</option>
          </select>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-500">
            <CalendarDays className="w-4 h-4" /> {range.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bookings" value={String(inRange.length)} hint="active events in range" icon={<Users2 className="w-5 h-5" />} />
        <StatCard label="Booked value" value={money(bookedValue)} hint="active booking value in range" icon={<TrendingUp className="w-5 h-5" />} tone="gold" />
        <StatCard label="Payments received" value={money(paymentsInRange)} hint="collected in range" icon={<Wallet className="w-5 h-5" />} tone="green" />
        <StatCard label="Remaining balance" value={money(remaining)} hint="still due from these bookings" icon={<AlertTriangle className="w-5 h-5" />} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[#0d1b0f]">Booking trend</h2>
              <p className="text-gray-400 text-xs">Active bookings and booked value for the selected range</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="value" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={54}
                  tickFormatter={(v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v))} />
                <Tooltip
                  formatter={(value, name) => (name === 'Booked value' ? money(Number(value)) : String(value))}
                  contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 12 }}
                />
                <Area yAxisId="right" type="monotone" dataKey="value" name="Booked value" stroke="#C9A84C" strokeWidth={2} fill="url(#value)" />
                <Bar yAxisId="left" dataKey="count" name="Bookings" fill="#0d1b0f" radius={[3, 3, 0, 0]} barSize={14} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padded={false} className="p-5">
          <h2 className="font-semibold text-[#0d1b0f]">Quick actions</h2>
          <p className="text-gray-400 text-xs mb-3">Booking and collection shortcuts</p>
          <div className="space-y-1">
            {quickActions.map((a) => (
              <button
                key={a.title}
                onClick={() => navigate(a.to)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-[#C9A84C]/15 text-[#8a6d24] grid place-items-center shrink-0">
                  <a.icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-[#0d1b0f]">{a.title}</span>
                  <span className="block text-xs text-gray-400 truncate">{a.hint}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padded={false} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-[#0d1b0f]">Bookings in selected range</h2>
              <p className="text-gray-400 text-xs">Earliest events first</p>
            </div>
            <button onClick={() => navigate('/calendar')} className="text-xs font-medium text-[#8a6d24]">Calendar</button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No bookings in this range.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <button onClick={() => navigate(`/bookings/${b.id}`)} className="w-full flex items-center justify-between py-2.5 text-left">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="text-center shrink-0">
                        <span className="block text-[10px] text-gray-400 uppercase">{formatDate(b.event_date, { month: 'short' })}</span>
                        <span className="block text-sm font-bold text-[#0d1b0f]">{formatDate(b.event_date, { day: 'numeric' })}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[#0d1b0f] truncate">{b.client_name || 'Booking'}</span>
                        <span className="block text-xs text-gray-400">{b.event_type} · {b.time_slot}</span>
                      </span>
                    </span>
                    <Badge className={STATUS_META[b.status].chip}>{STATUS_META[b.status].label}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false} className="p-5">
          <h2 className="font-semibold text-[#0d1b0f] mb-1">Venue performance</h2>
          <p className="text-gray-400 text-xs mb-3">Totals per venue for the selected range</p>
          {venuePerf.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No activity in this range.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="py-2 font-semibold">Venue</th>
                  <th className="py-2 font-semibold text-right">Bookings</th>
                  <th className="py-2 font-semibold text-right">Booked</th>
                  <th className="py-2 font-semibold text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {venuePerf.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 font-medium text-[#0d1b0f]">{v.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{v.bookings}</td>
                    <td className="py-2.5 text-right tabular-nums">{money(v.value)}</td>
                    <td className="py-2.5 text-right tabular-nums text-amber-700">{money(v.remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}

function buildTrend(rows: BookingRow[], from: string, to: string) {
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const dayMs = 86400000;
  const span = Math.round((end.getTime() - start.getTime()) / dayMs);
  // cap the number of points so "all time" / "this year" stay readable
  const bucketByMonth = span > 90;

  const buckets = new Map<string, { label: string; count: number; value: number }>();
  const keyFor = (d: Date) =>
    bucketByMonth ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : localISO(d);
  const labelFor = (d: Date) =>
    bucketByMonth
      ? d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  if (span >= 0 && span < 400) {
    for (let t = start.getTime(); t <= end.getTime(); t += dayMs) {
      const d = new Date(t);
      const k = keyFor(d);
      if (!buckets.has(k)) buckets.set(k, { label: labelFor(d), count: 0, value: 0 });
    }
  }

  for (const b of rows) {
    const d = new Date(b.event_date + 'T00:00:00');
    const k = keyFor(d);
    const bucket = buckets.get(k) ?? { label: labelFor(d), count: 0, value: 0 };
    bucket.count += 1;
    bucket.value += b.subtotal;
    buckets.set(k, bucket);
  }

  return [...buckets.entries()].sort(([a], [c]) => a.localeCompare(c)).map(([, v]) => v);
}
