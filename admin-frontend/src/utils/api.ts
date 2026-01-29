import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL: API_URL });

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  getMe: async (token: string) => {
    const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  }
};

export const dashboardApi = {
  getStats: async (token: string) => {
    const res = await api.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  }
};

export const adminApi = {
  // Current User Profile
  getCurrentUser: async (token: string) => {
    const res = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateProfile: async (token: string, updates: { full_name?: string }) => {
    const res = await api.put('/auth/me', updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // User Management
  listUsers: async (token: string, params?: { skip?: number; limit?: number; search?: string; role?: string; is_active?: boolean }) => {
    const res = await api.get('/admin/users', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getUser: async (token: string, userId: string) => {
    const res = await api.get(`/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateUser: async (token: string, userId: string, updates: any) => {
    const res = await api.put(`/admin/users/${userId}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteUser: async (token: string, userId: string) => {
    const res = await api.delete(`/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  resetUserPassword: async (token: string, userId: string, newPassword: string) => {
    const res = await api.post(`/admin/users/${userId}/reset-password`,
      { new_password: newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  // Statistics
  getStats: async (token: string) => {
    const res = await api.get('/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getUserStats: async (token: string) => {
    const res = await api.get('/admin/stats/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getConversationStats: async (token: string) => {
    const res = await api.get('/admin/stats/conversations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getMessageStats: async (token: string) => {
    const res = await api.get('/admin/stats/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // System Health
  getSystemHealth: async (token: string) => {
    const res = await api.get('/admin/system/health', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Integrations & ETL
  getAllIntegrations: async (token: string) => {
    const res = await api.get('/admin/integrations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getAllETLJobs: async (token: string, params?: { skip?: number; limit?: number; status_filter?: string }) => {
    const res = await api.get('/admin/etl-jobs', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Activity
  getRecentActivity: async (token: string, limit: number = 50) => {
    const res = await api.get('/admin/activity', {
      params: { limit },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Conversations & Messages
  listConversations: async (token: string, params?: { skip?: number; limit?: number; search?: string }) => {
    const res = await api.get('/admin/conversations', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getConversationMessages: async (token: string, convId: string) => {
    const res = await api.get(`/admin/conversations/${convId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};
