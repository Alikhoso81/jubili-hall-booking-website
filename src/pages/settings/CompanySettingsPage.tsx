import { useEffect, useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../lib/workspace';
import { toNumber } from '../../lib/format';
import { useToast } from '../../lib/useToast';
import { PageHeader, Card, Button, Field, Input, Toast } from '../../components/ui';

export default function CompanySettingsPage() {
  const { settings, reloadSettings } = useWorkspace();
  const { toast, success, error } = useToast();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [currency, setCurrency] = useState('PKR');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(settings.name);
    setAddress(settings.address);
    setPhone(settings.phone);
    setTaxRate(String(settings.tax_rate));
    setCurrency(settings.currency);
    setEventTypes(settings.event_types);
    setTimeSlots(settings.time_slots);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    const { error: e } = await supabase
      .from('company_settings')
      .update({
        name: name.trim() || 'JUBLII GROUP',
        address: address.trim(),
        phone: phone.trim(),
        tax_rate: toNumber(taxRate),
        currency: currency.trim() || 'PKR',
        event_types: eventTypes.filter(Boolean),
        time_slots: timeSlots.filter(Boolean),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    setSaving(false);
    if (e) error('Could not save settings.');
    else {
      success('Settings saved.');
      reloadSettings();
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Company Settings"
        subtitle="Business details that appear on invoices, plus the lists used across bookings."
        actions={<Button onClick={save} disabled={saving}><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save changes'}</Button>}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-[#0d1b0f] mb-4">Business</h2>
          <div className="space-y-4">
            <Field label="Company name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 3xx xxxxxxx" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tax rate (%)">
                <Input type="number" min="0" step="0.5" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </Field>
              <Field label="Currency label">
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <ListEditor title="Event types" items={eventTypes} onChange={setEventTypes} placeholder="e.g. Aqiqah" />
          <ListEditor title="Time slots" items={timeSlots} onChange={setTimeSlots} placeholder="e.g. Afternoon" />
        </div>
      </div>

      <Toast toast={toast} />
    </>
  );
}

function ListEditor({
  title,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState('');
  const add = () => {
    const v = value.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setValue('');
  };
  return (
    <Card>
      <h2 className="font-semibold text-[#0d1b0f] mb-3">{title}</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((it) => (
          <span key={it} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-sm text-gray-600">
            {it}
            <button onClick={() => onChange(items.filter((x) => x !== it))} className="text-gray-400 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-sm text-gray-400">No items.</span>}
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button variant="secondary" onClick={add}><Plus className="w-4 h-4" /></Button>
      </div>
    </Card>
  );
}
