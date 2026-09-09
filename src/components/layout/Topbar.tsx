import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useWorkspace } from '../../lib/workspace';
import { NAV } from './nav';
import { can } from '../../lib/permissions';
import { initials } from '../../lib/format';

export default function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { staff, signOut } = useAuth();
  const { settings } = useWorkspace();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  const matches = query.trim()
    ? NAV.flatMap((s) =>
        s.to
          ? [{ label: s.label, to: s.to, perm: s.perm ?? '' }]
          : (s.children ?? []).map((c) => ({ label: `${s.label} · ${c.label}`, to: c.to, perm: c.perm }))
      )
        .filter((m) => can(staff, m.perm) && m.label.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-100 flex items-center gap-3 px-4 sm:px-6">
      <button onClick={onOpenSidebar} className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-[#0d1b0f]">
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden sm:block">
        <div className="text-sm font-bold text-[#0d1b0f] leading-tight">{settings.name}</div>
        <div className="text-[10px] tracking-[0.18em] text-gray-400 uppercase">Venue Workspace</div>
      </div>

      <div ref={searchRef} className="relative flex-1 max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search menu..."
          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-gray-200"
        />
        {showResults && matches.length > 0 && (
          <div className="absolute mt-1 w-full bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-20">
            {matches.map((m) => (
              <button
                key={m.to}
                onMouseDown={() => {
                  navigate(m.to);
                  setQuery('');
                  setShowResults(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="relative p-2 text-gray-400 hover:text-[#0d1b0f]">
        <Bell className="w-5 h-5" />
      </button>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50"
        >
          <span className="w-8 h-8 rounded-full bg-[#0d1b0f] text-[#C9A84C] text-xs font-bold grid place-items-center">
            {initials(staff?.display_name ?? 'U')}
          </span>
          <span className="hidden sm:block text-sm font-medium text-[#0d1b0f] max-w-[120px] truncate">
            {staff?.display_name ?? '...'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-20">
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="text-sm font-semibold text-[#0d1b0f] truncate">{staff?.display_name}</div>
              <div className="text-xs text-gray-400 truncate">{staff?.email}</div>
              <div className="text-[11px] mt-1 inline-flex px-1.5 py-0.5 rounded bg-[#C9A84C]/15 text-[#8a6d24] font-medium capitalize">
                {staff?.role}
              </div>
            </div>
            {can(staff, 'company_settings') && (
              <button
                onMouseDown={() => {
                  navigate('/settings');
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <SettingsIcon className="w-4 h-4" /> Company Settings
              </button>
            )}
            <button
              onMouseDown={() => void signOut()}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
