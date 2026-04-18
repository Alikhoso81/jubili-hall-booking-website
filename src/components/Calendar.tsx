import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DayAvailability } from '../lib/types';

interface CalendarProps {
  onDateSelect: (date: string) => void;
  adminMode?: boolean;
  refreshKey?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Calendar({ onDateSelect, adminMode = false, refreshKey = 0 }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<Map<string, DayAvailability>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('bookings')
      .select('date, shift')
      .gte('date', startDate)
      .lte('date', endDate);

    if (!error && data) {
      const map = new Map<string, DayAvailability>();
      data.forEach((b) => {
        const key = b.date;
        if (!map.has(key)) {
          map.set(key, { date: key, dayBooked: false, nightBooked: false });
        }
        const entry = map.get(key)!;
        if (b.shift === 'day') entry.dayBooked = true;
        if (b.shift === 'night') entry.nightBooked = true;
      });
      setAvailability(map);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability, refreshKey]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = today.toISOString().split('T')[0];

  const getDateStr = (day: number) => {
    const d = new Date(year, month, day);
    return d.toISOString().split('T')[0];
  };

  const isPast = (day: number) => {
    const dateStr = getDateStr(day);
    return dateStr < todayStr;
  };

  const getCellStyle = (day: number) => {
    const dateStr = getDateStr(day);
    if (isPast(day)) return { bg: 'bg-gray-100 cursor-not-allowed', label: '' };
    const avail = availability.get(dateStr);
    if (!avail) return { bg: 'bg-green-50 hover:bg-green-100 cursor-pointer border border-green-200', label: 'available' };
    if (avail.dayBooked && avail.nightBooked) return { bg: 'bg-red-50 hover:bg-red-100 cursor-pointer border border-red-200', label: 'full' };
    return { bg: 'bg-amber-50 hover:bg-amber-100 cursor-pointer border border-amber-200', label: 'partial' };
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-[#0d1b0f] px-6 py-4 flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <div className="text-[#C9A84C] font-bold text-lg tracking-wide">
            {MONTHS[month]} {year}
          </div>
          {loading && <div className="text-white/40 text-xs mt-0.5">Loading...</div>}
        </div>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1 tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const { bg } = getCellStyle(day);
            const avail = availability.get(getDateStr(day));
            const isToday = getDateStr(day) === todayStr;

            return (
              <button
                key={day}
                onClick={() => onDateSelect(getDateStr(day))}   // ✅ fixed: pass correct date string
                disabled={isPast(day) && !adminMode}
                className={`relative rounded-lg p-1.5 min-h-[52px] flex flex-col items-center transition-all duration-150 ${bg} ${isToday ? 'ring-2 ring-[#C9A84C]' : ''}`}
              >
                <span className={`text-sm font-medium ${isPast(day) ? 'text-gray-300' : 'text-gray-700'}`}>
                  {day}
                </span>
                {!isPast(day) && (
                  <div className="flex gap-0.5 mt-1">
                    <Sun className={`w-3 h-3 ${avail?.dayBooked ? 'text-red-400' : 'text-green-500'}`} />
                    <Moon className={`w-3 h-3 ${avail?.nightBooked ? 'text-red-400' : 'text-green-500'}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-200 border border-green-400" />
          <span className="text-gray-500">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-400" />
          <span className="text-gray-500">Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-200 border border-red-400" />
          <span className="text-gray-500">Fully Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sun className="w-3 h-3 text-green-500" />
          <span className="text-gray-500">Day</span>
          <Moon className="w-3 h-3 text-green-500" />
          <span className="text-gray-500">Night</span>
        </div>
      </div>
    </div>
  );
}
