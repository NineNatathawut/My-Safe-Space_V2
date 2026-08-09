import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';
import { supabase } from '../lib/supabaseClient';
import type { OnboardingInfo } from '../types/assessment';

interface AuthUser {
  id: string;
  email: string;
  nickname?: string;
  role: 'admin' | 'user' | 'expert';
  onboarding?: OnboardingInfo;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    user?: AuthUser;
    token?: string;
  }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

function ensureAliasName(nickname?: string): void {
  if (nickname) {
    localStorage.setItem('alias_name', nickname);
  } else {
    localStorage.removeItem('alias_name');
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      validateToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const newToken = session.access_token;
        localStorage.setItem('token', newToken);
        setToken(newToken);

        try {
          const userRes = await api.get('/api/auth/me');
          if (userRes.data.success) {
            setUser(userRes.data.user);
            ensureAliasName(userRes.data.user?.nickname);
          }
        } catch (err) {
          console.error('Failed to fetch user after Google sign-in:', err);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const validateToken = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        ensureAliasName(res.data.user?.nickname);
      } else {
        throw new Error('Invalid response');
      }
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const newToken =
        res.data.token ||
        res.data.access_token ||
        res.data.data?.session?.access_token ||
        res.data.session?.access_token;

      if (!newToken) {
        return { success: false, error: 'ระบบหา Token ไม่เจอ' };
      }

      localStorage.setItem('token', newToken);
      setToken(newToken);

      const userRes = await api.get('/api/auth/me');
      if (userRes.data.success) {
        setUser(userRes.data.user);
        ensureAliasName(userRes.data.user?.nickname);
      }

      return { success: true, token: newToken, user: userRes.data.user };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      };
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('alias_name');
    setUser(null);
    setToken(null);
    supabase.auth.signOut();
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        ensureAliasName(res.data.user?.nickname);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ต้องใช้ภายใน AuthProvider');
  return ctx;
}
