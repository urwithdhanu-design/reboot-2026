import { Bell, Search, Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

interface TopBarProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-lbg-gray-100 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4 flex-1">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-lbg-gray-100 text-lbg-gray-600 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-lbg-gray-400 shrink-0" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search customers, policies, claims..."
            aria-label="Search customers, policies, claims"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-lbg-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative p-2 rounded-lg hover:bg-lbg-gray-100 text-lbg-gray-600"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-lbg-gray-100"
            aria-label="Account menu"
            aria-expanded={showMenu}
            aria-haspopup="menu"
          >
            <div className="w-8 h-8 rounded-lg bg-lbg-green flex items-center justify-center text-white text-xs font-bold">
              {user?.name.split(' ').map((n) => n[0]).join('') ?? 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-lbg-black leading-tight">{user?.name}</p>
              <p className="text-[10px] text-lbg-gray-400">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-lbg-gray-400 hidden sm:block" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-lbg-gray-100 py-1 z-50">
                <button
                  onClick={() => { logout(); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
