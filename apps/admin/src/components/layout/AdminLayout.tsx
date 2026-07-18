import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-lbg-gray-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <div className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}>
        <Sidebar collapsed={false} />
      </div>

      <div className="transition-all duration-300 lg:ml-64">
        <TopBar onMenuToggle={() => setMobileOpen(!mobileOpen)} sidebarCollapsed={false} />
        <main id="main-content" tabIndex={-1} className="p-4 lg:p-6 max-w-[1600px] animate-fade-in outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
