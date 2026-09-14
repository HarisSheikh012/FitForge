import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/axios';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'GYM_OWNER' | 'STAFF' | 'TRAINER' | 'MEMBER';
  gymId: string | null;
  twoFactorEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userDetails: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userDetails));
    setAccessToken(token);
    setUser(userDetails);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setAccessToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
