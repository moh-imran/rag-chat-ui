import axios, { AxiosError } from 'axios';
import { QueryRequest, QueryResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add an interceptor to add the auth token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const handleApiError = (error: any, defaultMessage: string) => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ detail: string }>;
        return new Error(
            axiosError.response?.data?.detail ||
            axiosError.message ||
            defaultMessage
        );
    }
    return error instanceof Error ? error : new Error(defaultMessage);
};

export const authApi = {
    login: async (email: string, password: string): Promise<string> => {
        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.access_token);
            return response.data.access_token;
        } catch (error) {
            throw handleApiError(error, 'Login failed');
        }
    },
    register: async (email: string, password: string, fullName?: string) => {
        try {
            const response = await api.post('/auth/register', { email, password, full_name: fullName });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Registration failed');
        }
    },
    getMe: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to fetch user profile');
        }
    },
    logout: () => {
        localStorage.removeItem('token');
    }
};

export const chatApi = {
    query: async (request: QueryRequest): Promise<QueryResponse> => {
        try {
            const response = await api.post<QueryResponse>('/chat/query', request);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    authApi.logout();
                }
                const axiosError = error as AxiosError<{ detail: string }>;
                throw new Error(
                    axiosError.response?.data?.detail ||
                    axiosError.message ||
                    'Failed to get response'
                );
            }
            throw error;
        }
    },

    uploadFile: async (
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chunk_size', '1000');
        formData.append('chunk_overlap', '200');
        formData.append('store_in_qdrant', 'true');

        try {
            const response = await api.post('/ingest/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = (progressEvent.loaded / progressEvent.total) * 100;
                        onProgress?.(progress);
                    }
                },
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<{ detail: string }>;
                throw new Error(
                    axiosError.response?.data?.detail ||
                    'Failed to upload file'
                );
            }
            throw error;
        }
    },

    checkHealth: async (): Promise<boolean> => {
        try {
            const response = await api.get('/health');
            return response.status === 200;
        } catch {
            return false;
        }
    },
};

export const conversationApi = {
    list: async () => {
        const response = await api.get('/chat/conversations');
        return response.data;
    },
    getHistory: async (convId: string) => {
        const response = await api.get(`/chat/conversations/${convId}`);
        return response.data;
    }
};

export default api;
