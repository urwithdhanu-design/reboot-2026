import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { adminApi, ADMIN_TOKEN_KEY, type AdminAuthUser } from '../api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = 'gcul-admin-user';

function toAdminUser(u: AdminAuthUser): AdminUser {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
  };
}

function loadStoredUser(): AdminUser | null {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const raw = localStorage.getItem(USER_KEY);
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(loadStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminApi.adminLogin(email.trim(), password);
    localStorage.setItem(ADMIN_TOKEN_KEY, res.access_token);
    const u = toAdminUser(res.user);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
