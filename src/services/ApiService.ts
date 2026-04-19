import axios from 'axios';

// ============================================================================
// DETECCIÓN DINÁMICA DE API URL
// ============================================================================
// Detecta automáticamente la URL correcta del backend basándose en:
// - En desarrollo (localhost): http://localhost:3001/api
// - En producción: usa la misma base URL sin puerto (backend sirve frontend)
// - Permite override con VITE_API_URL si se necesita un backend separado

const getApiUrl = () => {
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  const currentPort = window.location.port;
  
  let apiUrl: string;
  
  // Si estamos en localhost o 127.0.0.1 (desarrollo local)
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    apiUrl = 'http://localhost:3001/api';
  } 
  // En producción: usa la misma URL base sin puerto (backend y frontend en mismo servicio)
  else {
    apiUrl = `${currentProtocol}//${currentHost}/api`;
  }
  
  // Override con variable de entorno si existe (para backend separado)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    apiUrl = envApiUrl;
  }
  
  // Log para debugging en desarrollo
  if (import.meta.env.DEV) {
    console.log(`🌐 API Service Config:`, {
      frontend: `${currentProtocol}//${currentHost}:${currentPort}`,
      backend: apiUrl,
      hostname: currentHost,
      isLocalhost: currentHost === 'localhost' || currentHost === '127.0.0.1',
      envOverride: envApiUrl || 'none'
    });
  }
  
  return apiUrl;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para CORS con credentials
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('d4builds_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('d4builds_token');
      localStorage.removeItem('d4builds_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH SERVICE
// ============================================================================

export class AuthService {
  static async register(username: string, email: string, password: string) {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('d4builds_token', response.data.token);
      localStorage.setItem('d4builds_user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  static async login(email: string, password: string) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('d4builds_token', response.data.token);
      localStorage.setItem('d4builds_user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  static async verify() {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  }

  static logout() {
    localStorage.removeItem('d4builds_token');
    localStorage.removeItem('d4builds_user');
  }

  static getToken() {
    return localStorage.getItem('d4builds_token');
  }

  static getUser() {
    const userStr = localStorage.getItem('d4builds_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static isPremium() {
    const user = this.getUser();
    return user?.account_type === 'Premium';
  }
}

// ============================================================================
// USER SERVICE
// ============================================================================

export class UserService {
  static async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  }

  static async updateProfile(username?: string, email?: string) {
    const response = await api.put('/users/profile', {
      username,
      email,
    });
    
    // Actualizar usuario en localStorage
    localStorage.setItem('d4builds_user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  static async upgradeToPremium(paymentMethod: string = 'ficticio') {
    const response = await api.post('/users/upgrade-premium', {
      payment_method: paymentMethod,
    });
    
    // Actualizar usuario en localStorage
    localStorage.setItem('d4builds_user', JSON.stringify(response.data.user));
    
    return response.data;
  }
}

// ============================================================================
// BILLING SERVICE
// ============================================================================

export class BillingAPIService {
  static async logUsage(data: {
    provider: string;
    model: string;
    functionality: string;
    tokens_input: number;
    tokens_output: number;
    tokens_total: number;
    cost_input: number;
    cost_output: number;
    cost_total: number;
    category?: string;
    operation?: string;
  }) {
    const response = await api.post('/billing/log', data);
    return response.data;
  }

  static async getMyUsage(limit: number = 50, offset: number = 0) {
    const response = await api.get('/billing/my-usage', {
      params: { limit, offset },
    });
    return response.data;
  }

  static async getStats() {
    const response = await api.get('/billing/stats');
    return response.data;
  }
}

// ============================================================================
// ADMIN SERVICE
// ============================================================================

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  account_type: 'Basic' | 'Premium';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_ai_requests?: number;
  total_cost?: string;
}

export interface AdminStats {
  users: {
    active_users: string;
    inactive_users: string;
    premium_users: string;
    basic_users: string;
    admin_users: string;
  };
  billing: {
    total_requests: number;
    total_cost: string;
    avg_cost_per_request: string;
  };
}

export class AdminAPIService {
  static async getUsers(page: number = 1, limit: number = 20, search: string = '') {
    const response = await api.get('/admin/users', {
      params: { page, limit, search },
    });
    return response.data;
  }

  static async getUserDetails(userId: number) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  }

  static async updateUser(userId: number, data: {
    username?: string;
    email?: string;
    account_type?: 'Basic' | 'Premium';
    is_active?: boolean;
    is_admin?: boolean;
  }) {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  static async resetUserPassword(userId: number, newPassword: string) {
    const response = await api.post(`/admin/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
    return response.data;
  }

  static async changeOwnPassword(currentPassword: string, newPassword: string) {
    const response = await api.put('/admin/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  static async deleteUser(userId: number) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  static async getStats(): Promise<AdminStats> {
    const response = await api.get('/admin/stats');
    return response.data;
  }
}

// ============================================================================
// PROFILE SERVICE
// ============================================================================

export interface Subscription {
  id: number;
  plan_type: '1_month' | '6_months' | '1_year';
  start_date: string;
  end_date: string;
  expires_at: string;
  is_active: boolean;
  auto_renew: boolean;
  status: 'active' | 'expired' | 'none';
}

export interface UsageStats {
  total_requests: number;
  total_cost: number;
  last_week: {
    requests: number;
    cost: number;
  };
  last_month: {
    requests: number;
    cost: number;
  };
  last_year: {
    requests: number;
    cost: number;
  };
}

export interface ProfileData {
  user: {
    id: number;
    username: string;
    email: string;
    account_type: 'Basic' | 'Premium';
    premium_balance: number;
    created_at: string;
  };
  subscription: Subscription | null;
  usage: UsageStats;
}

export interface UsageHistoryItem {
  id: number;
  action_type: string;
  cost: number;
  metadata: any;
  created_at: string;
}

export interface UsageHistory {
  history: UsageHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export class ProfileAPIService {
  static async getProfile(): Promise<ProfileData> {
    const response = await api.get('/profile');
    return response.data;
  }

  static async updateProfile(data: { username?: string; email?: string }) {
    const response = await api.put('/profile', data);
    return response.data;
  }

  static async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.put('/profile/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  static async getUsageHistory(limit: number = 50, offset: number = 0): Promise<UsageHistory> {
    const response = await api.get('/profile/usage-history', {
      params: { limit, offset },
    });
    return response.data;
  }

  static async subscribe(planType: '1_month' | '6_months' | '1_year') {
    const response = await api.post('/profile/subscribe', { planType });
    return response.data;
  }

  static async extendSubscription(planType: '1_month' | '6_months' | '1_year') {
    const response = await api.post('/profile/extend-subscription', { planType });
    return response.data;
  }

  static async addCredits(amount: number) {
    const response = await api.post('/profile/add-credits', { amount });
    return response.data;
  }
}

export default api;
