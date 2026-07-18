import { NavLink } from 'react-router-dom';
import { navItems, navSections } from '../../config/navigation';

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside className={`fixed top-0 left-0 h-full bg-lbg-sidebar text-white z-40 transition-all duration-300 flex flex-col ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className={`flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
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
          const items = navItems.filter((n) => n.section === section);
          return (
            <div key={section} className="mb-4">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70">{section}</p>
              )}
              <ul className="space-y-0.5">
                {items.map(({ to, label, icon: Icon, badge }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                        } ${collapsed ? 'justify-center' : ''}`
                      }
                      title={collapsed ? label : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{label}</span>
                          {badge != null && (
                            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
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
