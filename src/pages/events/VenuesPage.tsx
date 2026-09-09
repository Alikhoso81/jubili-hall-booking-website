import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, Pencil, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../lib/workspace';
import { Venue } from '../../lib/types';
import { useToast } from '../../lib/useToast';
import { PageHeader, Card, Button, Field, Input, Textarea, Modal, Loading, EmptyState, Toast } from '../../components/ui';

export default function VenuesPage() {
  const { venues, loading, reloadVenues } = useWorkspace();
  const { toast, success, error } = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Venue | null>(null);
  const [creating, setCreating] = useState(false);

  const handleDelete = async (v: Venue) => {
    if (!window.confirm(`Delete "${v.name}"? Bookings linked to it will keep their history but lose the venue link.`)) return;
    const { error: e } = await supabase.from('venues').delete().eq('id', v.id);
    if (e) error('Could not delete venue.');
    else {
      success('Venue deleted.');
      reloadVenues();
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Venues"
        subtitle="Add each hall or branch you operate. Every booking calendar is tied to one venue."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Add venue
          </Button>
        }
      />

      <Card padded={false} className="p-5 sm:p-6">
        <h2 className="font-semibold text-[#0d1b0f] mb-4">Venues list</h2>

        {loading ? (
          <Loading />
        ) : venues.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-10 h-10" />}
            title="No venues yet"
            hint="Add your first hall to start taking bookings."
            action={<Button onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> Add venue</Button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {venues.map((v) => (
              <div key={v.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/15 text-[#8a6d24] grid place-items-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#0d1b0f] truncate">{v.name}</div>
                    <div className="text-sm text-gray-400">
                      {v.capacity ? `Capacity ${v.capacity.toLocaleString('en-PK')}` : 'No capacity set'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="secondary" className="!py-1.5 !px-3 text-xs" onClick={() => navigate(`/calendar?venue=${v.id}`)}>
                    <CalendarDays className="w-3.5 h-3.5" /> View calendar
                  </Button>
                  <Button variant="secondary" className="!py-1.5 !px-3 text-xs" onClick={() => setEditing(v)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="danger" className="!py-1.5 !px-3 text-xs" onClick={() => handleDelete(v)}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <VenueModal
        open={creating || editing !== null}
        venue={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={(msg) => {
          success(msg);
          reloadVenues();
          setCreating(false);
          setEditing(null);
        }}
        onError={error}
      />

      <Toast toast={toast} />
    </>
  );
}

function VenueModal({
  open,
  venue,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  venue: Venue | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(venue?.name ?? '');
    setCapacity(venue?.capacity != null ? String(venue.capacity) : '');
    setNotes(venue?.notes ?? '');
  }, [open, venue]);

  const save = async () => {
    if (!name.trim()) {
      onError('Venue name is required.');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      capacity: capacity.trim() ? Number(capacity) : null,
      notes: notes.trim(),
    };
    const { error } = venue
      ? await supabase.from('venues').update(payload).eq('id', venue.id)
      : await supabase.from('venues').insert(payload);
    setSaving(false);
    if (error) onError('Could not save venue.');
    else onSaved(venue ? 'Venue updated.' : 'Venue added.');
  };

  return (
    <Modal open={open} onClose={onClose} title={venue ? 'Edit venue' : 'Add venue'}>
      <div className="space-y-4">
        <Field label="Venue name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hall A" />
        </Field>
        <Field label="Capacity (optional)" hint="Maximum guests this hall seats.">
          <Input type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="500" />
        </Field>
        <Field label="Notes (optional)">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Parking, entrance, floor..." />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save venue'}</Button>
        </div>
      </div>
    </Modal>
  );
}
