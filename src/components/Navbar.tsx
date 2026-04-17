import { useState, useEffect } from 'react';
import { Menu, X, Crown, LogOut } from 'lucide-react';
import { Page } from '../lib/types';
import { getAdminSession, clearAdminSession } from '../lib/adminAuth';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navLinks: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'About', page: 'about' },
  { label: 'Gallery', page: 'gallery' },
  { label: 'Contact', page: 'contact' },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const admin = getAdminSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    clearAdminSession();
    handleNav('home');
  };

  const isAdminPage = currentPage === 'admin-login' || currentPage === 'admin-dashboard';
  const bgClass = scrolled || menuOpen || isAdminPage
    ? 'bg-[#0d1b0f] shadow-lg'
    : 'bg-transparent';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2 group"
          >
            <Crown className="w-7 h-7 text-[#C9A84C] group-hover:scale-110 transition-transform" />
            <div className="leading-tight">
              <span className="block text-white font-bold text-lg tracking-widest">JUBLII</span>
              <span className="block text-[#C9A84C] text-xs tracking-[0.3em] font-medium">GROUP</span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ label, page }) => (
              <button
                key={page}
                onClick={() => handleNav(page)}
                className={`text-sm font-medium tracking-wider transition-colors duration-200 ${
                  currentPage === page
                    ? 'text-[#C9A84C]'
                    : 'text-white/80 hover:text-[#C9A84C]'
                }`}
              >
                {label}
              </button>
            ))}
            {admin ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNav('admin-dashboard')}
                  className={`text-sm font-medium tracking-wider transition-colors duration-200 ${
                    currentPage === 'admin-dashboard' ? 'text-[#C9A84C]' : 'text-white/80 hover:text-[#C9A84C]'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('admin-login')}
                className="px-4 py-2 border border-[#C9A84C]/50 text-[#C9A84C] text-sm tracking-wider rounded hover:bg-[#C9A84C] hover:text-[#0d1b0f] transition-all duration-200"
              >
                Admin
              </button>
            )}
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0d1b0f] border-t border-[#C9A84C]/20 px-4 pb-4">
          {navLinks.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => handleNav(page)}
              className={`block w-full text-left py-3 text-sm font-medium tracking-wider border-b border-white/10 ${
                currentPage === page ? 'text-[#C9A84C]' : 'text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
          {admin ? (
            <>
              <button
                onClick={() => handleNav('admin-dashboard')}
                className="block w-full text-left py-3 text-sm font-medium tracking-wider border-b border-white/10 text-white/80"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left py-3 text-sm text-red-400"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNav('admin-login')}
              className="block w-full text-left py-3 text-sm font-medium tracking-wider text-[#C9A84C]"
            >
              Admin Login
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
