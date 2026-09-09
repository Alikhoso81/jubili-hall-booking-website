import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Trash2, Plus, Pencil, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useWorkspace } from '../../lib/workspace';
import { fetchBookingBundle, BookingBundle } from '../../lib/api';
import {
  BookingStatus, Charge, PaymentMethod,
  CHARGE_CATEGORIES, ChargeCategory, STATUS_META,
} from '../../lib/types';
import { money, formatDate, formatTime, todayISO, toNumber } from '../../lib/format';
import { useToast } from '../../lib/useToast';
import { Card, Button, Field, Input, Select, Textarea, Modal, Loading, Badge, Toast } from '../../components/ui';

const STATUS_FLOW: BookingStatus[] = ['tentative', 'confirmed', 'completed', 'cancelled'];

export default function BookingDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { venues, settings } = useWorkspace();
  const { toast, success, error } = useToast();

  const [bundle, setBundle] = useState<BookingBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [chargeModal, setChargeModal] = useState<{ open: boolean; edit: Charge | null }>({ open: false, edit: null });
  const [payModal, setPayModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const b = await fetchBookingBundle(id);
    setBundle(b);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;
  if (!bundle) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-10">Booking not found. <Link to="/bookings" className="text-[#8a6d24] font-medium">Back to bookings</Link></p>
      </Card>
    );
  }

  const { booking, charges, payments } = bundle;
  const venue = venues.find((v) => v.id === booking.venue_id);
  const subtotal = charges.reduce((s, c) => s + c.amount, 0);
  const tax = Math.round((subtotal * settings.tax_rate) / 100);
  const grandTotal = subtotal + tax;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = grandTotal - paid;

  const setStatus = async (status: BookingStatus) => {
    const { error: e } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
    if (e) error('Could not update status.');
    else {
      success(`Marked ${STATUS_META[status].label.toLowerCase()}.`);
      load();
    }
  };

  const deleteCharge = async (chargeId: string) => {
    const { error: e } = await supabase.from('charges').delete().eq('id', chargeId);
    if (e) error('Could not remove charge.');
    else load();
  };

  const deleteBooking = async () => {
    if (!window.confirm(`Delete booking #${booking.booking_no}? Charges and payments are deleted too.`)) return;
    const { error: e } = await supabase.from('bookings').delete().eq('id', booking.id);
    if (e) error('Could not delete booking.');
    else navigate('/bookings');
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#0d1b0f]">{booking.client_name || 'Booking'}</h1>
              <Badge className={STATUS_META[booking.status].chip}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[booking.status].dot}`} />
                {STATUS_META[booking.status].label}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm">
              Booking #{booking.booking_no} · {booking.event_type} · {venue?.name ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="secondary" onClick={() => navigate(`/bookings/${booking.id}/invoice`)}>
            <Printer className="w-4 h-4" /> Invoice
          </Button>
          <Button variant="danger" onClick={deleteBooking}><Trash2 className="w-4 h-4" /> Delete</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FLOW.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            disabled={booking.status === s}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              booking.status === s
                ? `${STATUS_META[s].chip} cursor-default`
                : 'border-gray-200 text-gray-500 hover:border-[#C9A84C] hover:text-[#0d1b0f]'
            }`}
          >
            Mark {STATUS_META[s].label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold text-[#0d1b0f] mb-4">Event details</h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Detail label="Date" value={booking.is_multi_day && booking.end_date ? `${formatDate(booking.event_date)} → ${formatDate(booking.end_date)}` : formatDate(booking.event_date)} />
              <Detail label="Time" value={`${booking.time_slot}${booking.start_time ? ` · ${formatTime(booking.start_time)}–${formatTime(booking.end_time)}` : ''}`} />
              <Detail label="Venue" value={venue?.name ?? '—'} />
              <Detail label="Guests" value={String(booking.guest_count || 0)} />
              <Detail label="Client phone" value={booking.client_phone || '—'} />
              <Detail label="Client email" value={booking.client_email || '—'} />
              <Detail label="Booked by" value={booking.booked_by || '—'} />
              <Detail label="Created" value={formatDate(booking.created_at.split('T')[0])} />
            </div>
            {booking.notes && (
              <div className="mt-4 text-sm">
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</div>
                <p className="text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </Card>

          <Card padded={false}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-[#0d1b0f]">Charges</h2>
              <Button variant="secondary" className="!py-1.5 !px-3 text-xs" onClick={() => setChargeModal({ open: true, edit: null })}>
                <Plus className="w-3.5 h-3.5" /> Add charge
              </Button>
            </div>
            {charges.length === 0 ? (
              <p className="text-sm text-gray-400 p-5">No charges yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {charges.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-700">{c.description}</div>
                        <div className="text-xs text-gray-400">
                          {money(c.rate)} × {c.quantity}{c.is_per_head ? ' guests' : ''}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium">{money(c.amount)}</td>
                      <td className="px-3 py-3 w-20">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setChargeModal({ open: true, edit: c })} className="text-gray-400 hover:text-[#0d1b0f] p-1">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteCharge(c.id)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-[#0d1b0f] mb-3">Money</h2>
            <dl className="space-y-2 text-sm">
              <Line label="Subtotal" value={money(subtotal)} />
              <Line label={`Tax (${settings.tax_rate}%)`} value={money(tax)} />
              <Line label="Grand total" value={money(grandTotal)} bold />
              <Line label="Paid" value={money(paid)} tone="green" />
              <Line label="Balance due" value={money(balance)} bold tone={balance > 0 ? 'amber' : 'green'} />
            </dl>
          </Card>

          <Card padded={false}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-[#0d1b0f]">Payments</h2>
              <Button variant="secondary" className="!py-1.5 !px-3 text-xs" onClick={() => setPayModal(true)}>
                <Wallet className="w-3.5 h-3.5" /> Record
              </Button>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400 p-5">No payments recorded.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <li key={p.id} className="px-5 py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-gray-700">{money(p.amount)}</div>
                      <div className="text-xs text-gray-400 capitalize">{formatDate(p.paid_on)} · {p.method}{p.reference ? ` · ${p.reference}` : ''}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.from('payments').delete().eq('id', p.id);
                        load();
                      }}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ChargeModal
        state={chargeModal}
        bookingId={booking.id}
        guestCount={booking.guest_count}
        onClose={() => setChargeModal({ open: false, edit: null })}
        onSaved={() => {
          setChargeModal({ open: false, edit: null });
          success('Charge saved.');
          load();
        }}
        onError={error}
      />

      <PaymentModal
        open={payModal}
        bookingId={booking.id}
        createdBy={user?.id ?? null}
        suggested={Math.max(balance, 0)}
        onClose={() => setPayModal(false)}
        onSaved={() => {
          setPayModal(false);
          success('Payment recorded.');
          load();
        }}
        onError={error}
      />

      <Toast toast={toast} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-400 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-[#0d1b0f] font-medium">{value}</div>
    </div>
  );
}

function Line({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: 'green' | 'amber' }) {
  const toneCls = tone === 'green' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-[#0d1b0f]';
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`tabular-nums ${bold ? 'font-bold' : ''} ${toneCls}`}>{value}</dd>
    </div>
  );
}

function ChargeModal({
  state,
  bookingId,
  guestCount,
  onClose,
  onSaved,
  onError,
}: {
  state: { open: boolean; edit: Charge | null };
  bookingId: string;
  guestCount: number;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChargeCategory>('other');
  const [rate, setRate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [perHead, setPerHead] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state.open) return;
    const c = state.edit;
    setDescription(c?.description ?? '');
    setCategory(c?.category ?? 'other');
    setRate(c ? String(c.rate) : '');
    setQuantity(c ? String(c.quantity) : '1');
    setPerHead(c?.is_per_head ?? false);
  }, [state]);

  const onCategory = (cat: ChargeCategory) => {
    const meta = CHARGE_CATEGORIES.find((x) => x.value === cat);
    setCategory(cat);
    if (meta?.perHead) {
      setPerHead(true);
      setQuantity(String(guestCount || 0));
    } else {
      setPerHead(false);
    }
    if (!description) setDescription(meta?.label ?? '');
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      booking_id: bookingId,
      description: description.trim() || 'Charge',
      category,
      rate: toNumber(rate),
      quantity: perHead ? guestCount || toNumber(quantity) : toNumber(quantity) || 1,
      is_per_head: perHead,
    };
    const { error } = state.edit
      ? await supabase.from('charges').update(payload).eq('id', state.edit.id)
      : await supabase.from('charges').insert(payload);
    setSaving(false);
    if (error) onError('Could not save charge.');
    else onSaved();
  };

  return (
    <Modal open={state.open} onClose={onClose} title={state.edit ? 'Edit charge' : 'Add charge'}>
      <div className="space-y-4">
        <Field label="Category">
          <Select value={category} onChange={(e) => onCategory(e.target.value as ChargeCategory)}>
            {CHARGE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rate (Rs)">
            <Input type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
          <Field label={perHead ? 'Guests' : 'Quantity'}>
            <Input type="number" min="0" value={perHead ? String(guestCount || 0) : quantity} disabled={perHead} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentModal({
  open,
  bookingId,
  createdBy,
  suggested,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  bookingId: string;
  createdBy: string | null;
  suggested: number;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(suggested > 0 ? String(suggested) : '');
    setPaidOn(todayISO());
    setMethod('cash');
    setReference('');
    setNote('');
  }, [open, suggested]);

  const save = async () => {
    if (toNumber(amount) <= 0) {
      onError('Enter a payment amount.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('payments').insert({
      booking_id: bookingId,
      amount: toNumber(amount),
      paid_on: paidOn,
      method,
      reference: reference.trim(),
      note: note.trim(),
      created_by: createdBy,
    });
    setSaving(false);
    if (error) onError('Could not record payment.');
    else onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title="Record payment">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (Rs)">
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Date">
            <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="cash">Cash</option>
              <option value="bank">Bank transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Reference (optional)">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Cheque / txn #" />
          </Field>
        </div>
        <Field label="Note (optional)">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Record payment'}</Button>
        </div>
      </div>
    </Modal>
  );
}
