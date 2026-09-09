import { CalendarDays, Building2, ReceiptText, Users } from 'lucide-react';
import { PageHeader, Card } from '../components/ui';

const STEPS = [
  {
    icon: Building2,
    title: '1 · Set up your venues',
    body: 'Go to Events → Venues and add every hall or branch you operate. Each booking is tied to one main venue (plus optional extra halls).',
  },
  {
    icon: CalendarDays,
    title: '2 · Take a booking',
    body: 'Open Events → Booking Calendar, tap an open date, and fill the 3-step form: event details, charges, then review. New bookings start as Tentative.',
  },
  {
    icon: ReceiptText,
    title: '3 · Collect & invoice',
    body: 'Open a booking to record advance payments and print an invoice. The balance due updates automatically from charges minus payments.',
  },
  {
    icon: Users,
    title: '4 · Add your team',
    body: 'Settings → Users lets an admin invite staff and choose exactly what each person can see and do.',
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader eyebrow="Support" title="Help & User Manual" subtitle="A quick tour of how the booking manager works." />
      <div className="grid sm:grid-cols-2 gap-4">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/15 text-[#8a6d24] grid place-items-center shrink-0">
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0d1b0f]">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
