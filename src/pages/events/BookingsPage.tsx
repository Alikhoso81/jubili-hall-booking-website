import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarClock, Download } from 'lucide-react';
import { fetchBookingRows, BookingRow } from '../../lib/api';
import { useWorkspace } from '../../lib/workspace';
import { BookingStatus, STATUS_META } from '../../lib/types';
import { money, formatDate } from '../../lib/format';
import { PageHeader, Card, Button, Input, Loading, EmptyState, Badge } from '../../components/ui';

const FILTERS: (BookingStatus | 'all')[] = ['all', 'tentative', 'confirmed', 'completed', 'cancelled'];

function toCsv(rows: BookingRow[], venueName: (id: string | null) => string): string {
  const head = ['Booking', 'Date', 'Venue', 'Slot', 'Client', 'Phone', 'Event', 'Guests', 'Status', 'Subtotal', 'Paid', 'Balance'];
  const body = rows.map((b) =>
    [
      b.booking_no, b.event_date, venueName(b.venue_id), b.time_slot, b.client_name, b.client_phone,
      b.event_type, b.guest_count, b.status, b.subtotal, b.paid, b.subtotal - b.paid,
    ]
      .map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [head.join(','), ...body].join('\r\n');
}

export default function BookingsPage() {
  const navigate = useNavigate();
  const { venues } = useWorkspace();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetchBookingRows()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const venueName = useMemo(
    () => (id: string | null) => venues.find((v) => v.id === id)?.name ?? '—',
    [venues]
  );

  const filtered = rows.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (q.trim()) {
      const s = `${b.client_name} ${b.client_phone} ${b.event_type} ${b.booking_no}`.toLowerCase();
      if (!s.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  const exportCsv = () => {
    const blob = new Blob([String.fromCharCode(0xfeff) + toCsv(filtered, venueName)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jublii-bookings.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Bookings"
        subtitle="Every reservation, its charges and how much is still owed."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}><Download className="w-4 h-4" /> Export</Button>
            <Button onClick={() => navigate('/bookings/new')}><Plus className="w-4 h-4" /> New booking</Button>
          </>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {FILTERS.map((f) => (
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
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search client / phone / #"
            className="!w-60"
          />
        </div>

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="w-10 h-10" />}
            title="No bookings"
            hint="Create your first booking to see it here."
            action={<Button onClick={() => navigate('/bookings/new')}><Plus className="w-4 h-4" /> New booking</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Date', 'Venue', 'Client', 'Event', 'Status', 'Subtotal', 'Paid', 'Balance'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => {
                  const balance = b.subtotal - b.paid;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/bookings/${b.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{b.booking_no}</td>
                      <td className="px-4 py-3 font-medium text-[#0d1b0f] whitespace-nowrap">
                        {formatDate(b.event_date)}
                        <span className="block text-xs text-gray-400 font-normal">{b.time_slot}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{venueName(b.venue_id)}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {b.client_name}
                        <span className="block text-xs text-gray-400">{b.client_phone}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{b.event_type}</td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_META[b.status].chip}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[b.status].dot}`} />
                          {STATUS_META[b.status].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">{money(b.subtotal)}</td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap text-emerald-700">{money(b.paid)}</td>
                      <td className={`px-4 py-3 tabular-nums whitespace-nowrap font-semibold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {money(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
