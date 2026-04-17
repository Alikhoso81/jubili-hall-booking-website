import { Crown, Star, Users, MapPin, Clock } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <section className="relative pt-32 pb-20 bg-[#0d1b0f]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Crown className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-white mb-4">About Jublii Group</h1>
          <p className="text-white/60 text-lg">A legacy of elegance, celebration, and unforgettable events.</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#C9A84C] text-sm tracking-[0.3em] font-medium uppercase mb-3">Our Story</p>
              <h2 className="text-4xl font-bold text-[#0d1b0f] mb-6 leading-tight">
                Where Every Event Becomes a Memory
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Jublii Group has been at the heart of the region's most celebrated events for years. What began as a vision for a premium event space has grown into a landmark destination for weddings, corporate gatherings, and milestone celebrations.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Our hall combines timeless architecture with modern amenities to create an atmosphere that is both grand and welcoming. Every corner is designed to inspire awe and create the perfect setting for your most important moments.
              </p>
              <p className="text-gray-600 leading-relaxed">
                With a dedicated team, professional service, and attention to every detail, we ensure that your event is not just hosted — it is crafted with care.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Jublii Hall Interior"
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-[#C9A84C] rounded-xl p-4 shadow-lg">
                <div className="text-[#0d1b0f] font-bold text-3xl">10+</div>
                <div className="text-[#0d1b0f]/80 text-sm font-medium">Years of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f7f5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-[#0d1b0f] mb-3">Our Facilities</h2>
            <p className="text-gray-500">Everything you need for a flawless event.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Users className="w-8 h-8" />, title: 'Seating', desc: 'Comfortably seats up to 500 guests with flexible arrangements.' },
              { icon: <Star className="w-8 h-8" />, title: 'Décor', desc: 'Premium furnishings, draping, and ambient lighting throughout.' },
              { icon: <MapPin className="w-8 h-8" />, title: 'Location', desc: 'Centrally located with ample parking and easy access.' },
              { icon: <Clock className="w-8 h-8" />, title: 'Shifts', desc: 'Day and night shifts available for maximum flexibility.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="text-[#C9A84C] mb-4">{icon}</div>
                <h3 className="font-bold text-[#0d1b0f] text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-[#0d1b0f] mb-3">Our Shifts</h2>
            <p className="text-gray-500">We offer two booking shifts per day to maximize flexibility.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-md border border-amber-100">
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-4 flex items-center gap-3">
                <span className="text-white text-2xl">☀️</span>
                <h3 className="text-white font-bold text-xl">Day Shift</h3>
              </div>
              <div className="p-6 bg-amber-50">
                <p className="text-3xl font-bold text-[#0d1b0f] mb-1">9:00 AM</p>
                <p className="text-gray-500 mb-3">to 6:00 PM</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Full hall access for 9 hours</li>
                  <li>✓ Ideal for weddings & receptions</li>
                  <li>✓ Setup & decoration time included</li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md border border-blue-100">
              <div className="bg-gradient-to-r from-blue-800 to-slate-800 px-6 py-4 flex items-center gap-3">
                <span className="text-white text-2xl">🌙</span>
                <h3 className="text-white font-bold text-xl">Night Shift</h3>
              </div>
              <div className="p-6 bg-blue-50">
                <p className="text-3xl font-bold text-[#0d1b0f] mb-1">7:00 PM</p>
                <p className="text-gray-500 mb-3">to 2:00 AM</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Full hall access for 7 hours</li>
                  <li>✓ Perfect for evening celebrations</li>
                  <li>✓ Premium lighting ambiance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
