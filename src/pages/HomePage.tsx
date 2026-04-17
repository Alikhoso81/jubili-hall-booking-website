import { useState } from 'react';
import { CalendarDays, Users, Star, Clock, Phone, MessageCircle, ChevronDown } from 'lucide-react';
import Calendar from '../components/Calendar';
import BookingModal from '../components/BookingModal';
import { Page } from '../lib/types';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const scrollToCalendar = () => {
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/1045541/pexels-photo-1045541.jpeg?auto=compress&cs=tinysrgb&w=1920')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b0f]/80 via-[#0d1b0f]/70 to-[#0d1b0f]/90" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-[#C9A84C] text-sm tracking-[0.4em] font-medium uppercase mb-4">
            Welcome to
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-4 leading-tight tracking-tight">
            JUBLII <span className="text-[#C9A84C]">GROUP</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/70 font-light tracking-wide mb-3">
            Premium Hall Booking Experience
          </p>
          <p className="text-white/50 max-w-xl mx-auto text-base mb-10">
            Celebrate life's most important moments in a space designed for grandeur, elegance, and lasting memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={scrollToCalendar}
              className="px-8 py-4 bg-[#C9A84C] hover:bg-[#b8953e] text-[#0d1b0f] font-bold tracking-wider rounded-full transition-all duration-200 shadow-lg hover:shadow-[#C9A84C]/30 hover:shadow-xl text-sm uppercase"
            >
              Check Availability
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-8 py-4 border-2 border-white/40 text-white hover:border-[#C9A84C] hover:text-[#C9A84C] font-medium tracking-wider rounded-full transition-all duration-200 text-sm uppercase"
            >
              Contact Us
            </button>
          </div>
        </div>

        <button
          onClick={scrollToCalendar}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-[#C9A84C] transition-colors animate-bounce"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: <Users className="w-7 h-7" />, value: '500+', label: 'Guest Capacity' },
              { icon: <Star className="w-7 h-7" />, value: '5★', label: 'Rating' },
              { icon: <CalendarDays className="w-7 h-7" />, value: '200+', label: 'Events Hosted' },
              { icon: <Clock className="w-7 h-7" />, value: '24/7', label: 'Support' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="text-center p-6 rounded-2xl border border-gray-100 hover:border-[#C9A84C]/30 hover:shadow-md transition-all">
                <div className="text-[#C9A84C] flex justify-center mb-3">{icon}</div>
                <div className="text-3xl font-bold text-[#0d1b0f]">{value}</div>
                <div className="text-gray-500 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="booking-section" className="py-20 bg-[#f7f5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#C9A84C] text-sm tracking-[0.3em] font-medium uppercase mb-3">Availability</p>
            <h2 className="text-4xl font-bold text-[#0d1b0f] mb-4">Check & Book Your Date</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Select a date on the calendar to view day and night shift availability. Contact us to confirm your booking.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-3">
              <Calendar onDateSelect={setSelectedDate} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-bold text-[#0d1b0f] text-lg mb-4">How to Book</h3>
                <ol className="space-y-4">
                  {[
                    { num: '1', text: 'Select your preferred date on the calendar.' },
                    { num: '2', text: 'Choose Day Shift (9AM–6PM) or Night Shift (7PM–2AM).' },
                    { num: '3', text: 'Call or WhatsApp us to confirm your booking.' },
                    { num: '4', text: 'Our admin will register it in the system.' },
                  ].map(({ num, text }) => (
                    <li key={num} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#C9A84C] text-[#0d1b0f] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {num}
                      </span>
                      <span className="text-gray-600 text-sm">{text}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-[#0d1b0f] rounded-2xl p-6 text-white">
                <h3 className="font-bold text-lg mb-2 text-[#C9A84C]">Ready to Book?</h3>
                <p className="text-white/60 text-sm mb-5">Contact us directly for instant confirmation.</p>
                <div className="flex flex-col gap-3">
                  <a
                    href="tel:+92323415810"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4 text-[#C9A84C]" />
                    +92 302 341 5810
                  </a>
                  <a
                    href="https://wa.me/923023415810"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl transition-colors text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#C9A84C] text-sm tracking-[0.3em] font-medium uppercase mb-3">Why Choose Us</p>
            <h2 className="text-4xl font-bold text-[#0d1b0f] mb-4">The Jublii Experience</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                img: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=600',
                title: 'Elegant Interiors',
                desc: 'Meticulously designed spaces with premium décor for every occasion.',
              },
              {
                img: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=600',
                title: 'Flexible Shifts',
                desc: 'Day and night booking options to suit your schedule perfectly.',
              },
              {
                img: 'https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?auto=compress&cs=tinysrgb&w=600',
                title: 'Modern Facilities',
                desc: 'State-of-the-art sound, lighting, and catering infrastructure.',
              },
            ].map(({ img, title, desc }) => (
              <div key={title} className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="relative overflow-hidden h-48">
                  <img
                    src={img}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[#0d1b0f] text-lg mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#0d1b0f]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Make Your Event <span className="text-[#C9A84C]">Unforgettable</span>
          </h2>
          <p className="text-white/60 mb-8">
            Weddings, engagements, corporate dinners, birthdays — our hall is the perfect backdrop for every milestone.
          </p>
          <button
            onClick={scrollToCalendar}
            className="px-8 py-4 bg-[#C9A84C] hover:bg-[#b8953e] text-[#0d1b0f] font-bold tracking-wider rounded-full transition-all duration-200 text-sm uppercase"
          >
            View Availability
          </button>
        </div>
      </section>

      {selectedDate && (
        <BookingModal date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  );
}
