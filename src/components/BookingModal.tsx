import { useEffect, useState } from 'react';
import { X, Sun, Moon, CheckCircle, XCircle, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DayAvailability } from '../lib/types';

interface BookingModalProps {
  date: string;
  onClose: () => void;
}

const WHATSAPP_NUMBER = '03023415810';

export default function BookingModal({ date, onClose }: BookingModalProps) {
  const [availability, setAvailability] = useState<DayAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('shift')
        .eq('date', date);

      if (!error) {
        const avail: DayAvailability = { date, dayBooked: false, nightBooked: false };
        (data || []).forEach(b => {
          if (b.shift === 'day') avail.dayBooked = true;
          if (b.shift === 'night') avail.nightBooked = true;
        });
        setAvailability(avail);
      }
      setLoading(false);
    };
    fetchData();
  }, [date]);

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const buildWhatsAppMessage = (shift: 'day' | 'night') => {
    const msg = `Hello Jublii Group! I would like to book the ${shift} shift on ${formattedDate}. Please confirm availability.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#0d1b0f] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Booking Availability</h3>
            <p className="text-[#C9A84C] text-sm mt-0.5">{formattedDate}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <ShiftCard
                icon={<Sun className="w-6 h-6" />}
                label="Day Shift"
                time="9:00 AM – 6:00 PM"
                booked={availability?.dayBooked ?? false}
                waLink={!availability?.dayBooked ? buildWhatsAppMessage('day') : undefined}
              />
              <ShiftCard
                icon={<Moon className="w-6 h-6" />}
                label="Night Shift"
                time="7:00 PM – 2:00 AM"
                booked={availability?.nightBooked ?? false}
                waLink={!availability?.nightBooked ? buildWhatsAppMessage('night') : undefined}
              />

              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-800 text-sm font-medium mb-2">How to Book</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:+92323415810`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0d1b0f] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#C9A84C]" />
                    Call: +92 302 3415810
                  </a>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    WhatsApp: +92 302 341 5810
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ShiftCardProps {
  icon: React.ReactNode;
  label: string;
  time: string;
  booked: boolean;
  waLink?: string;
}

function ShiftCard({ icon, label, time, booked, waLink }: ShiftCardProps) {
  return (
    <div className={`rounded-xl border-2 p-4 flex items-center justify-between transition-all ${
      booked ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
    }`}>
      <div className="flex items-center gap-3">
        <div className={booked ? 'text-red-400' : 'text-green-600'}>{icon}</div>
        <div>
          <div className="font-semibold text-gray-800">{label}</div>
          <div className="text-xs text-gray-500">{time}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {booked ? (
          <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Booked
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Available
            </div>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white text-xs px-2 py-1 rounded transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                Book
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
