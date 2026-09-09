import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Printer } from 'lucide-react';
import { fetchBookingRows, BookingRow } from '../../lib/api';
import { useWorkspace } from '../../lib/workspace';
import { money, formatDate } from '../../lib/format';
import { PageHeader, Card, Input, Loading, EmptyState } from '../../components/ui';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { venues, settings } = useWorkspace();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetchBookingRows()
      .then((r) => setRows(r.filter((b) => b.subtotal > 0)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const venueName = useMemo(() => (id: string | null) => venues.find((v) => v.id === id)?.name ?? '—', [venues]);

  const filtered = rows.filter((b) =>
    !q.trim() || `${b.client_name} ${b.booking_no}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <>
      <PageHeader eyebrow="Events" title="Invoices" subtitle="Every booking that has charges, with what's been paid and what's due." />

      <Card padded={false}>
        <div className="p-4 border-b border-gray-100 flex justify-end">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client / #" className="!w-60" />
        </div>

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FileText className="w-10 h-10" />} title="No invoices yet" hint="Add charges to a booking and it will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Invoice', 'Client', 'Event', 'Grand total', 'Paid', 'Balance', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => {
                  const tax = Math.round((b.subtotal * settings.tax_rate) / 100);
                  const grand = b.subtotal + tax;
                  const balance = grand - b.paid;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/bookings/${b.id}/invoice`)}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">INV-{String(b.booking_no).padStart(4, '0')}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{b.client_name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {b.event_type} · {venueName(b.venue_id)}
                        <span className="block text-xs text-gray-400">{formatDate(b.event_date)}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">{money(grand)}</td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap text-emerald-700">{money(b.paid)}</td>
                      <td className={`px-4 py-3 tabular-nums whitespace-nowrap font-semibold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{money(balance)}</td>
                      <td className="px-4 py-3 text-gray-400"><Printer className="w-4 h-4" /></td>
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
