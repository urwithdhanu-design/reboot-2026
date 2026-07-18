import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_USER: AdminUser = {
  id: 'admin-001',
  name: 'Platform Admin',
  email: 'admin@reboot2026.local',
  role: 'Operations Manager',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const s = localStorage.getItem('gcul-admin-user');
    return s ? JSON.parse(s) : null;
  });

  const login = useCallback(async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 500));
    const u = { ...ADMIN_USER, email };
    localStorage.setItem('gcul-admin-user', JSON.stringify(u));
    setUser(u);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gcul-admin-user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
