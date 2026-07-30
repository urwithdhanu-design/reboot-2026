import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { navEntries, navSections, type NavGroup, type NavItem } from '../../config/navigation';

interface SidebarProps {
  collapsed: boolean;
}

function NavLinkRow({
  to,
  label,
  icon: Icon,
  badge,
  collapsed,
  nested = false,
}: {
  to: string;
  label: string;
  icon?: NavItem['icon'];
  badge?: number;
  collapsed: boolean;
  nested?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/capital-market'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
          nested ? 'px-3 py-2' : 'px-3 py-2.5'
        } ${
          isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
        } ${collapsed ? 'justify-center' : ''}`
      }
      title={collapsed ? label : undefined}
    >
      {Icon ? (
        <Icon className={`shrink-0 ${nested ? 'w-4 h-4' : 'w-5 h-5'}`} aria-hidden="true" />
      ) : (
        <span className={`shrink-0 rounded-full bg-white/20 ${nested ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} aria-hidden />
      )}
      {!collapsed && (
        <>
          <span className="flex-1 leading-snug">{label}</span>
          {badge != null && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function NavGroupRow({ group, collapsed }: { group: NavGroup; collapsed: boolean }) {
  const location = useLocation();
  const childActive = group.children.some(
    (c) =>
      location.pathname === c.to ||
      (c.to !== '/capital-market' && location.pathname.startsWith(`${c.to}/`)),
  );
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const Icon = group.icon;

  if (collapsed) {
    return (
      <NavLink
        to={group.children[0].to}
        className={({ isActive }) =>
          `flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive || childActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`
        }
        title={group.label}
      >
        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
      </NavLink>
    );
  }

  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-start gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
          childActive ? 'text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
        aria-expanded={open}
      >
        <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <span className="flex-1 min-w-0">
          <span className="block font-semibold leading-snug">{group.label}</span>
          {group.description ? (
            <span className="block text-[10px] text-white/50 mt-0.5 leading-snug">{group.description}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 mt-0.5 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className="space-y-0.5 px-2 pb-2 pt-0.5" role="list">
          {group.children.map((child) => (
            <li key={child.to}>
              <NavLinkRow to={child.to} label={child.label} collapsed={false} nested />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-lbg-sidebar text-white z-40 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0 ${
          collapsed ? 'justify-center px-0' : ''
        }`}
      >
        <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M12 2C8.5 2 6 4.5 6 8c0 2 1 3.5 2.5 4.5L12 22l3.5-9.5C17 11.5 18 10 18 8c0-3.5-2.5-6-6-6zm0 3c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">Reboot 2026</p>
            <p className="text-[10px] text-white/60 tracking-widest uppercase">Insurance Admin</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Main">
        {navSections.map((section) => {
          const entries = navEntries.filter((entry) => {
            if (entry.kind === 'link') return entry.item.section === section;
            return entry.group.section === section;
          });
          if (entries.length === 0) return null;

          return (
            <div key={section} className="mb-4">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
                  {section}
                </p>
              )}
              <ul className="space-y-0.5">
                {entries.map((entry) => {
                  if (entry.kind === 'group') {
                    return (
                      <li key={entry.group.id}>
                        <NavGroupRow group={entry.group} collapsed={collapsed} />
                      </li>
                    );
                  }
                  const { to, label, icon, badge } = entry.item;
                  return (
                    <li key={to}>
                      <NavLinkRow to={to} label={label} icon={icon} badge={badge} collapsed={collapsed} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/10 text-[10px] text-white/70 leading-relaxed">
          Reboot 2026 Insurance · v1.0
        </div>
      )}
    </aside>
  );
}
