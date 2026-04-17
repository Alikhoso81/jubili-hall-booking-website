import { Phone, Mail, MapPin, MessageCircle, Clock, Crown } from 'lucide-react';

export default function ContactPage() {
  const WHATSAPP_NUMBER = '+92 302 341 5810';

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <section className="relative pt-32 pb-20 bg-[#0d1b0f]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Crown className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-white/60 text-lg">We'd love to hear from you.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[#C9A84C] text-sm tracking-[0.3em] font-medium uppercase mb-3">Get in Touch</p>
              <h2 className="text-4xl font-bold text-[#0d1b0f] mb-6">Ready to Plan Your Event?</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                For bookings and inquiries, reach out to us directly. Our team is available to assist you with availability checks, pricing, and event planning.
              </p>

              <div className="space-y-5 mb-10">
                <ContactItem
                  icon={<Phone className="w-5 h-5 text-[#C9A84C]" />}
                  label="Phone"
                  value="+92 302 341 5810"
                  href="tel:+92 302 341 5810"
                />
                <ContactItem
                  icon={<MessageCircle className="w-5 h-5 text-green-600" />}
                  label="WhatsApp"
                  value="+92 302 341 5810"
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  external
                />
                <ContactItem
                  icon={<Mail className="w-5 h-5 text-[#C9A84C]" />}
                  label="Email"
                  value="info@jubliigroup.com"
                  href="mailto:info@jubliigroup.com"
                />
                <ContactItem
                  icon={<MapPin className="w-5 h-5 text-[#C9A84C]" />}
                  label="Address"
                  value="123 Grand Avenue, City, Country"
                />
                <ContactItem
                  icon={<Clock className="w-5 h-5 text-[#C9A84C]" />}
                  label="Office Hours"
                  value="Mon–Sun: 9:00 AM – 9:00 PM"
                />
              </div>

              <div className="bg-[#0d1b0f] rounded-2xl p-6 text-white">
                <h3 className="font-bold text-[#C9A84C] text-lg mb-2">Quick WhatsApp Booking</h3>
                <p className="text-white/60 text-sm mb-4">
                  Send us a message on WhatsApp with your preferred date and shift for a fast response.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello! I want to book the hall at Jublii Group.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
                >
                  <MessageCircle className="w-5 h-5" />
                  Start WhatsApp Chat
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-[#0d1b0f] px-6 py-4">
                  <h3 className="text-white font-bold text-lg">Booking Information</h3>
                  <p className="text-[#C9A84C] text-sm">What you need to know before booking</p>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { q: 'What shifts are available?', a: 'We offer a Day Shift (9AM–6PM) and Night Shift (7PM–2AM) on all days.' },
                    { q: 'How do I confirm a booking?', a: 'Call or WhatsApp us. Our admin team will register your booking and confirm it.' },
                    { q: 'Can I book both shifts?', a: 'Yes, you can book both the day and night shifts on the same date.' },
                    { q: 'Is advance booking required?', a: 'We recommend booking at least 7–14 days in advance for your preferred date.' },
                    { q: 'What is the guest capacity?', a: 'Our hall comfortably accommodates up to 500 guests.' },
                  ].map(({ q, a }) => (
                    <div key={q} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <p className="font-semibold text-[#0d1b0f] text-sm mb-1">{q}</p>
                      <p className="text-gray-500 text-sm">{a}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <iframe
                  title="Jublii Group Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387190.2799160891!2d-74.25987368715491!3d40.69767006326903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1700000000000"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface ContactItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

function ContactItem({ icon, label, value, href, external }: ContactItemProps) {
  const content = (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full bg-[#f7f5f0] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-0.5">{label}</div>
        <div className="text-[#0d1b0f] font-medium text-sm">{value}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {content}
      </a>
    );
  }
  return content;
}
