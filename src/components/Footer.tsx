import { Crown, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Page } from '../lib/types';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleNav = (page: Page) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0d1b0f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-7 h-7 text-[#C9A84C]" />
              <div>
                <div className="text-white font-bold text-lg tracking-widest">JUBLII</div>
                <div className="text-[#C9A84C] text-xs tracking-[0.3em]">GROUP</div>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Premium hall booking for every occasion. Weddings, corporate events, celebrations — we make every moment unforgettable.
            </p>
          </div>

          <div>
            <h3 className="text-[#C9A84C] font-semibold tracking-wider text-sm mb-4 uppercase">Quick Links</h3>
            <ul className="space-y-2">
              {(['home', 'about', 'gallery', 'contact'] as Page[]).map((page) => (
                <li key={page}>
                  <button
                    onClick={() => handleNav(page)}
                    className="text-white/60 hover:text-[#C9A84C] text-sm capitalize transition-colors"
                  >
                    {page}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[#C9A84C] font-semibold tracking-wider text-sm mb-4 uppercase">Contact Us</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C9A84C] mt-0.5 shrink-0" />
                <span>123 Grand Avenue, City, Country</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span>+92 302 341 5810</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C9A84C] shrink-0" />
                <span>info@jubliigroup.com</span>
              </li>
              <li>
                <a
                  href="https://wa.me/923023415810"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors mt-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Jublii Group. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Booking inquiries: call or WhatsApp us
          </p>
        </div>
      </div>
    </footer>
  );
}
