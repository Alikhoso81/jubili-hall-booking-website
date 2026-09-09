import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../lib/workspace';
import { Booking, BookingStatus, STATUS_META } from '../../lib/types';
import { localISO, formatTime } from '../../lib/format';
import { PageHeader, Card, Button, Select, Loading } from '../../components/ui';

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BookingCalendarPage() {
  const { venues } = useWorkspace();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const venueId = params.get('venue') ?? '';

  useEffect(() => {
    if (!venueId && venues.length > 0) {
      setParams({ venue: venues[0].id }, { replace: true });
    }
  }, [venueId, venues, setParams]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const end = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .lte('event_date', end)
        .or(`end_date.gte.${start},and(end_date.is.null,event_date.gte.${start})`);
      if (!active) return;
      let rows = (data ?? []) as Booking[];
      if (venueId) {
        const { data: bv } = await supabase.from('booking_venues').select('booking_id').eq('venue_id', venueId);
        const extra = new Set((bv ?? []).map((r) => (r as { booking_id: string }).booking_id));
        rows = rows.filter((b) => b.venue_id === venueId || extra.has(b.id));
      }
      setBookings(rows);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [year, month, venueId]);

  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const from = new Date(b.event_date + 'T00:00:00');
      const to = new Date((b.end_date || b.event_date) + 'T00:00:00');
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const key = localISO(d);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
      }
    }
    return map;
  }, [bookings]);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayStr = localISO(today);

  const step = (dir: number) => {
    const m = month + dir;
    if (m < 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else if (m > 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth(m);
  };

  const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Booking Calendar"
        subtitle="Tap an open date to start a new booking, or an event to view it."
        actions={
          <Button onClick={() => navigate(`/bookings/new${venueId ? `?venue=${venueId}` : ''}`)}>
            <Plus className="w-4 h-4" /> New booking
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Select
            value={venueId}
            onChange={(e) => setParams({ venue: e.target.value })}
            className="max-w-[200px]"
          >
            {venues.length === 0 && <option value="">No venues</option>}
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </Select>
          <div className="flex items-center gap-3">
            <button onClick={() => step(-1)} className="p-2 rounded-full hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#0d1b0f] w-36 text-center">{MONTHS[month]} {year}</span>
            <button onClick={() => step(1)} className="p-2 rounded-full hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(STATUS_META) as BookingStatus[]).map((s) => (
            <span key={s} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_META[s].chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-7 mb-1">
                {DOW.map((d) => (
                  <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1 tracking-wider">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (day === null) return <div key={`e${idx}`} className="min-h-[104px]" />;
                  const ds = dateStr(day);
                  const events = byDay.get(ds) ?? [];
                  const isToday = ds === todayStr;
                  return (
                    <button
                      key={day}
                      onClick={() =>
                        events.length === 0
                          ? navigate(`/bookings/new?date=${ds}${venueId ? `&venue=${venueId}` : ''}`)
                          : navigate(`/bookings/${events[0].id}`)
                      }
                      className={`min-h-[104px] text-left rounded-lg border p-1.5 transition-colors hover:border-[#C9A84C] ${
                        isToday ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <span className={`text-xs font-semibold ${isToday ? 'text-[#8a6d24]' : 'text-gray-500'}`}>{day}</span>
                      <div className="mt-1 space-y-1">
                        {events.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/bookings/${b.id}`);
                            }}
                            className={`block truncate px-1.5 py-0.5 rounded text-[11px] border ${STATUS_META[b.status].chip}`}
                          >
                            {b.start_time ? `${formatTime(b.start_time)} ` : ''}{b.client_name || 'Booking'}
                          </span>
                        ))}
                        {events.length > 3 && (
                          <span className="block text-[10px] text-gray-400 px-1">+{events.length - 3} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
