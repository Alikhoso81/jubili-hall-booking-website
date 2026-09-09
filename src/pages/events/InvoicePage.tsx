import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useWorkspace } from '../../lib/workspace';
import { fetchBookingBundle, BookingBundle } from '../../lib/api';
import { money, formatDate, initials } from '../../lib/format';
import { Button, Loading } from '../../components/ui';

export default function InvoicePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { venues, settings } = useWorkspace();
  const [bundle, setBundle] = useState<BookingBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingBundle(id).then((b) => {
      setBundle(b);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loading />;
  if (!bundle) return <p className="text-center text-gray-500 py-10">Booking not found.</p>;

  const { booking, charges, payments } = bundle;
  const venue = venues.find((v) => v.id === booking.venue_id);
  const subtotal = charges.reduce((s, c) => s + c.amount, 0);
  const tax = Math.round((subtotal * settings.tax_rate) / 100);
  const grand = subtotal + tax;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = grand - paid;
  const invoiceNo = `INV-${String(booking.booking_no).padStart(4, '0')}`;

  return (
    <>
      <div className="flex items-center justify-between mb-4 no-print">
        <button onClick={() => navigate(`/bookings/${booking.id}`)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0d1b0f]">
          <ArrowLeft className="w-4 h-4" /> Back to booking
        </button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>

      <div id="invoice-print" className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-3xl mx-auto p-8 sm:p-12">
        <div className="flex items-center gap-3 pb-5 border-b-2 border-[#0d1b0f]">
          <span className="w-11 h-11 rounded-xl bg-[#0d1b0f] text-[#C9A84C] grid place-items-center font-bold">
            {initials(settings.name)}
          </span>
          <div>
            <div className="font-bold text-lg text-[#0d1b0f]">{settings.name}</div>
            {settings.phone && <div className="text-xs text-gray-400">{settings.phone}</div>}
          </div>
        </div>

        <div className="text-center my-6">
          <h1 className="text-xl font-bold text-[#0d1b0f]">Invoice</h1>
          <p className="text-sm text-gray-400">{invoiceNo}</p>
        </div>

        <div className="text-sm text-gray-600 space-y-0.5 mb-6">
          <p><span className="font-semibold text-[#0d1b0f]">Client:</span> {booking.client_name} {booking.client_phone && `(${booking.client_phone})`}</p>
          <p><span className="font-semibold text-[#0d1b0f]">Event:</span> {booking.event_type} at {venue?.name ?? '—'} — {formatDate(booking.event_date)}</p>
          <p><span className="font-semibold text-[#0d1b0f]">Guests:</span> {booking.guest_count || 0}</p>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 font-semibold text-[#0d1b0f]">Description</th>
              <th className="py-2 font-semibold text-[#0d1b0f] text-right w-16">Qty</th>
              <th className="py-2 font-semibold text-[#0d1b0f] text-right w-28">Rate</th>
              <th className="py-2 font-semibold text-[#0d1b0f] text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((c) => (
              <tr key={c.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-700">{c.description}</td>
                <td className="py-2 text-right tabular-nums text-gray-600">{c.quantity}</td>
                <td className="py-2 text-right tabular-nums text-gray-600">{money(c.rate)}</td>
                <td className="py-2 text-right tabular-nums text-gray-700">{money(c.amount)}</td>
              </tr>
            ))}
            {charges.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400">No charges added.</td></tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end">
          <dl className="w-64 text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Tax ({settings.tax_rate}%)</dt><dd className="tabular-nums">{money(tax)}</dd></div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-[#0d1b0f]"><dt>Grand total</dt><dd className="tabular-nums">{money(grand)}</dd></div>
            <div className="flex justify-between text-gray-400"><dt>Paid</dt><dd className="tabular-nums">{money(paid)}</dd></div>
            <div className="flex justify-between font-bold text-[#0d1b0f]"><dt>Balance due</dt><dd className="tabular-nums">{money(balance)}</dd></div>
          </dl>
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">Thank you for choosing {settings.name}.</p>
      </div>
    </>
  );
}
