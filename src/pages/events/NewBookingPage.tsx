import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useWorkspace } from '../../lib/workspace';
import { CHARGE_CATEGORIES, ChargeCategory } from '../../lib/types';
import { money, todayISO, toNumber } from '../../lib/format';
import { createBooking, ChargeInput } from '../../lib/api';
import { useToast } from '../../lib/useToast';
import { Card, Button, Field, Input, Select, Textarea, Toast } from '../../components/ui';

interface Details {
  venue_id: string;
  event_date: string;
  end_date: string;
  is_multi_day: boolean;
  extra_venue_ids: string[];
  time_slot: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  event_type: string;
  guest_count: string;
  notes: string;
}

interface ChargeRow {
  description: string;
  category: ChargeCategory;
  rate: string;
  quantity: string;
  is_per_head: boolean;
}

const STEPS = ['Event details', 'Charges', 'Review & confirm'];

export default function NewBookingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, staff } = useAuth();
  const { venues, settings } = useWorkspace();
  const { toast, error } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [d, setD] = useState<Details>({
    venue_id: params.get('venue') ?? venues[0]?.id ?? '',
    event_date: params.get('date') ?? todayISO(),
    end_date: '',
    is_multi_day: false,
    extra_venue_ids: [],
    time_slot: settings.time_slots[0] ?? 'Dinner',
    start_time: '19:30',
    end_time: '23:59',
    client_name: '',
    client_phone: '',
    client_email: '',
    event_type: settings.event_types[0] ?? 'Wedding',
    guest_count: '',
    notes: '',
  });
  const set = (patch: Partial<Details>) => setD((prev) => ({ ...prev, ...patch }));

  const [charges, setCharges] = useState<ChargeRow[]>([
    { description: 'Hall Rent', category: 'hall_rent', rate: '', quantity: '1', is_per_head: false },
  ]);

  const guests = toNumber(d.guest_count);

  const lineTotal = (c: ChargeRow) => toNumber(c.rate) * toNumber(c.quantity);
  const subtotal = charges.reduce((s, c) => s + lineTotal(c), 0);

  const updateCharge = (i: number, patch: Partial<ChargeRow>) =>
    setCharges((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const changeCategory = (i: number, category: ChargeCategory) => {
    const meta = CHARGE_CATEGORIES.find((c) => c.value === category);
    const perHead = !!meta?.perHead;
    updateCharge(i, {
      category,
      is_per_head: perHead,
      quantity: perHead ? String(guests || 0) : charges[i].quantity || '1',
      description: charges[i].description || meta?.label || '',
    });
  };

  const venueName = (id: string) => venues.find((v) => v.id === id)?.name ?? '—';

  const detailsValid =
    d.venue_id && d.event_date && d.client_name.trim() && d.client_phone.trim() &&
    (!d.is_multi_day || (d.end_date && d.end_date >= d.event_date));

  const submit = async () => {
    setSaving(true);
    try {
      const chargeInputs: ChargeInput[] = charges
        .filter((c) => c.description.trim() || toNumber(c.rate) > 0)
        .map((c) => ({
          description: c.description.trim() || 'Charge',
          category: c.category,
          rate: toNumber(c.rate),
          quantity: c.is_per_head ? guests || toNumber(c.quantity) : toNumber(c.quantity) || 1,
          is_per_head: c.is_per_head,
        }));

      const id = await createBooking(
        {
          venue_id: d.venue_id,
          event_date: d.event_date,
          end_date: d.is_multi_day && d.end_date ? d.end_date : null,
          is_multi_day: d.is_multi_day,
          time_slot: d.time_slot,
          start_time: d.start_time || null,
          end_time: d.end_time || null,
          client_name: d.client_name.trim(),
          client_phone: d.client_phone.trim(),
          client_email: d.client_email.trim(),
          event_type: d.event_type,
          guest_count: guests,
          status: 'tentative',
          notes: d.notes.trim(),
        },
        chargeInputs,
        d.extra_venue_ids,
        { booked_by: staff?.display_name ?? staff?.email ?? '', created_by: user?.id ?? null }
      );
      navigate(`/bookings/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create the booking.';
      error(/duplicate|unique/i.test(msg) ? 'That venue and time slot is already taken.' : msg);
      setSaving(false);
    }
  };

  const otherVenues = useMemo(() => venues.filter((v) => v.id !== d.venue_id), [venues, d.venue_id]);

  return (
    <>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b0f]">New Booking</h1>
          <p className="text-gray-500 text-sm">Step {step + 1} of 3 — {STEPS[step]}</p>
        </div>
      </div>

      <Stepper step={step} />

      {step === 0 && (
        <Card>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Venue">
              <Select value={d.venue_id} onChange={(e) => set({ venue_id: e.target.value, extra_venue_ids: [] })}>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </Field>
            <Field label="Event date">
              <Input type="date" value={d.event_date} onChange={(e) => set({ event_date: e.target.value })} />
            </Field>
          </div>

          {otherVenues.length > 0 && (
            <Field label="Additional halls (multi-hall event, optional)">
              <div className="flex flex-wrap gap-2">
                {otherVenues.map((v) => {
                  const on = d.extra_venue_ids.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        set({
                          extra_venue_ids: on
                            ? d.extra_venue_ids.filter((x) => x !== v.id)
                            : [...d.extra_venue_ids, v.id],
                        })
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        on ? 'bg-[#C9A84C] text-[#0d1b0f] border-[#C9A84C]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <label className="flex items-center gap-2 my-4 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={d.is_multi_day}
              onChange={(e) => set({ is_multi_day: e.target.checked })}
              className="rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
            />
            Multi-day event (spans more than one calendar day)
          </label>

          <div className="grid sm:grid-cols-2 gap-5">
            {d.is_multi_day && (
              <Field label="End date">
                <Input type="date" min={d.event_date} value={d.end_date} onChange={(e) => set({ end_date: e.target.value })} />
              </Field>
            )}
            <Field label="Time slot" hint="A hall can host more than one event a day — pick the slot so times don't overlap.">
              <Select value={d.time_slot} onChange={(e) => set({ time_slot: e.target.value })}>
                {settings.time_slots.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Start time">
              <Input type="time" value={d.start_time} onChange={(e) => set({ start_time: e.target.value })} />
            </Field>
            <Field label="End time">
              <Input type="time" value={d.end_time} onChange={(e) => set({ end_time: e.target.value })} />
            </Field>
            <Field label="Client name">
              <Input value={d.client_name} onChange={(e) => set({ client_name: e.target.value })} placeholder="e.g. Ali & Sara" />
            </Field>
            <Field label="Client phone">
              <Input value={d.client_phone} onChange={(e) => set({ client_phone: e.target.value })} placeholder="03xx-xxxxxxx" />
            </Field>
            <Field label="Event type">
              <Select value={d.event_type} onChange={(e) => set({ event_type: e.target.value })}>
                {settings.event_types.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Expected guest count">
              <Input type="number" min="0" value={d.guest_count} onChange={(e) => set({ guest_count: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Client email (optional)">
              <Input type="email" value={d.client_email} onChange={(e) => set({ client_email: e.target.value })} placeholder="client@email.com" />
            </Field>
          </div>

          <Field label="Additional details (optional)">
            <Textarea rows={3} value={d.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Menu, stage, entry time, special requests..." />
          </Field>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep(1)} disabled={!detailsValid}>Next</Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <p className="text-sm text-gray-500 mb-4">
            Add every charge for this event. Catering is priced per guest and uses the expected guest count ({guests || 0}).
          </p>
          <div className="space-y-2">
            {charges.map((c, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_110px_90px_90px_32px] gap-2 items-center">
                <Input
                  placeholder="Description"
                  value={c.description}
                  onChange={(e) => updateCharge(i, { description: e.target.value })}
                />
                <Select value={c.category} onChange={(e) => changeCategory(i, e.target.value as ChargeCategory)}>
                  {CHARGE_CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </Select>
                <Input
                  type="number" min="0" placeholder="Rate"
                  value={c.rate}
                  onChange={(e) => updateCharge(i, { rate: e.target.value })}
                />
                <Input
                  type="number" min="0" placeholder="Qty"
                  value={c.is_per_head ? String(guests || 0) : c.quantity}
                  disabled={c.is_per_head}
                  onChange={(e) => updateCharge(i, { quantity: e.target.value })}
                />
                <span className="text-sm text-right text-gray-600 tabular-nums">{money(lineTotal(c))}</span>
                <button
                  onClick={() => setCharges((rows) => rows.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600 justify-self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              setCharges((rows) => [...rows, { description: '', category: 'other', rate: '', quantity: '1', is_per_head: false }])
            }
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0d1b0f] border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <Plus className="w-4 h-4" /> Add charge
          </button>

          <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3 flex justify-end text-sm font-semibold text-[#0d1b0f]">
            Subtotal: {money(subtotal)}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="font-semibold text-[#0d1b0f] mb-4">Review &amp; confirm</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <Row label="Venue" value={venueName(d.venue_id) + (d.extra_venue_ids.length ? ` + ${d.extra_venue_ids.map(venueName).join(', ')}` : '')} />
            <Row label="Date" value={d.is_multi_day && d.end_date ? `${d.event_date} → ${d.end_date}` : d.event_date} />
            <Row label="Time slot" value={`${d.time_slot} · ${d.start_time}–${d.end_time}`} />
            <Row label="Event type" value={d.event_type} />
            <Row label="Client" value={`${d.client_name} · ${d.client_phone}`} />
            <Row label="Guests" value={String(guests || 0)} />
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Charges</div>
            {charges.filter((c) => c.description.trim() || toNumber(c.rate) > 0).map((c, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{c.description || 'Charge'}{c.is_per_head ? ` (${guests || 0} guests)` : ''}</span>
                <span className="tabular-nums">{money(lineTotal(c))}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold text-[#0d1b0f] border-t border-gray-100 mt-2 pt-2">
              <span>Subtotal</span><span className="tabular-nums">{money(subtotal)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">The booking will be created with status <b>Tentative</b>. You can confirm it and record payments on the next screen.</p>

          <div className="flex justify-between pt-4">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={submit} disabled={saving}>
              <Check className="w-4 h-4" /> {saving ? 'Creating...' : 'Create booking'}
            </Button>
          </div>
        </Card>
      )}

      <Toast toast={toast} />
    </>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 my-5">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
          <span
            className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[#0d1b0f] text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </span>
          <span className={`text-sm hidden sm:block ${i === step ? 'text-[#0d1b0f] font-semibold' : 'text-gray-400'}`}>{label}</span>
          {i < STEPS.length - 1 && <div className="h-px bg-gray-200 flex-1 hidden sm:block" />}
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-400 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-[#0d1b0f] font-medium">{value}</div>
    </div>
  );
}
