import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/ApiService';

interface User {
  id: number;
  username: string;
  email: string;
  account_type: 'Basic' | 'Premium';
  is_admin?: boolean;
  is_active: boolean;
  premium_balance?: number;
  subscription_expires_at?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isPremium: () => boolean;
  isAdmin: () => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado
    const verifyToken = async () => {
      const token = AuthService.getToken();
      if (token) {
        const result = await AuthService.verify();
        if (result.valid && result.user) {
          setUser(result.user);
        } else {
          AuthService.logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await AuthService.login(email, password);
    setUser(response.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await AuthService.register(username, email, password);
    setUser(response.user);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const isPremium = () => {
    if (!user) return false;
    
    // Verificar si es Premium en la base de datos
    if (user.account_type !== 'Premium') return false;
    
    // Verificar fecha de expiración si existe
    if (user.subscription_expires_at) {
      const expirationDate = new Date(user.subscription_expires_at);
      const now = new Date();
      
      // Si ya expiró, retornar false
      if (now > expirationDate) {
        return false;
      }
    }
    
    // Es Premium y no ha expirado (o no tiene fecha de expiración)
    return true;
  };

  const isAdmin = () => {
    return user?.is_admin === true;
  };

  const refreshUser = async () => {
    const result = await AuthService.verify();
    if (result.valid && result.user) {
      setUser(result.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isPremium, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
