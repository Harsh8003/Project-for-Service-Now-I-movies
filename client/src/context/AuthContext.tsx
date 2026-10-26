import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: Role) => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cinematic_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('cinematic_token');
      if (storedToken) {
        try {
          const res = await api.me();
          if (res.success && res.data.user) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Session expired or invalid, switching to demo customer');
          localStorage.removeItem('cinematic_token');
          setToken(null);
          // Default to demo customer for immediate seamless experience
          try {
            const demoRes = await api.demoSwitch('CUSTOMER');
            if (demoRes.success) {
              localStorage.setItem('cinematic_token', demoRes.data.token);
              setToken(demoRes.data.token);
              setUser(demoRes.data.user);
            }
          } catch {}
        }
      } else {
        // Auto-seed demo customer session for friction-free evaluation
        try {
          const demoRes = await api.demoSwitch('CUSTOMER');
          if (demoRes.success) {
            localStorage.setItem('cinematic_token', demoRes.data.token);
            setToken(demoRes.data.token);
            setUser(demoRes.data.user);
          }
        } catch {}
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (res.success) {
      localStorage.setItem('cinematic_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setAuthModalOpen(false);
    }
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    if (res.success) {
      localStorage.setItem('cinematic_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setAuthModalOpen(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cinematic_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: Role) => {
    const res = await api.demoSwitch(role);
    if (res.success) {
      localStorage.setItem('cinematic_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        isAuthModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
