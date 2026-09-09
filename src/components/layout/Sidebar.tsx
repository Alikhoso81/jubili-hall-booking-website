import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Crown, ChevronDown, PanelLeftClose, PanelLeft, LogOut, LifeBuoy } from 'lucide-react';
import { NAV, NavSection } from './nav';
import { useAuth } from '../../lib/auth';
import { can } from '../../lib/permissions';

function visibleChildren(section: NavSection, check: (perm: string) => boolean) {
  return (section.children ?? []).filter((c) => check(c.perm));
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
}) {
  const { staff, signOut } = useAuth();
  const location = useLocation();
  const check = useMemo(() => (perm: string) => can(staff, perm), [staff]);

  const sections = useMemo(
    () =>
      NAV.map((s) => ({ section: s, children: visibleChildren(s, check) })).filter(
        ({ section, children }) => (section.to ? check(section.perm ?? '') : children.length > 0)
      ),
    [check]
  );

  return (
    <aside
      className={`flex flex-col h-full bg-[#0d1b0f] text-white transition-[width] duration-200 ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <div className={`flex items-center gap-2.5 h-16 shrink-0 border-b border-white/10 ${collapsed ? 'justify-center px-0' : 'px-5'}`}>
        <Crown className="w-7 h-7 text-[#C9A84C] shrink-0" />
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-bold tracking-widest text-sm">JUBLII</div>
            <div className="text-[#C9A84C] text-[10px] tracking-[0.25em]">BOOKING MANAGER</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {sections.map(({ section, children }) => (
          <SidebarItem
            key={section.label}
            section={section}
            items={children}
            collapsed={collapsed}
            activePath={location.pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3 space-y-1">
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!collapsed && 'Collapse'}
        </button>
        <NavLink
          to="/help"
          onClick={onNavigate}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LifeBuoy className="w-4 h-4 shrink-0" />
          {!collapsed && 'Help & User Manual'}
        </NavLink>
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-300 hover:text-red-200 hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  section,
  items,
  collapsed,
  activePath,
  onNavigate,
}: {
  section: NavSection;
  items: NavSection['children'];
  collapsed: boolean;
  activePath: string;
  onNavigate?: () => void;
}) {
  const kids = items ?? [];
  const groupActive = kids.some((c) => (c.end ? activePath === c.to : activePath.startsWith(c.to)));
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen === null ? groupActive : manualOpen;
  const Icon = section.icon;

  const base =
    'flex items-center gap-3 w-full rounded-lg text-sm font-medium transition-colors';
  const idle = 'text-white/65 hover:text-white hover:bg-white/5';
  const active = 'bg-[#C9A84C] text-[#0d1b0f]';

  if (section.to) {
    return (
      <NavLink
        to={section.to}
        end={section.end}
        onClick={onNavigate}
        title={collapsed ? section.label : undefined}
        className={({ isActive }) =>
          `${base} px-3 py-2.5 ${collapsed ? 'justify-center' : ''} ${isActive ? active : idle}`
        }
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && section.label}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setManualOpen(!open)}
        title={collapsed ? section.label : undefined}
        className={`${base} px-3 py-2.5 ${collapsed ? 'justify-center' : 'justify-between'} ${
          groupActive && !open ? 'text-white' : idle
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && section.label}
        </span>
        {!collapsed && (
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {!collapsed && open && (
        <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
          {kids.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              end={c.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  isActive ? 'text-[#C9A84C] font-semibold bg-white/5' : 'text-white/55 hover:text-white'
                }`
              }
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
