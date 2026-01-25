import axios, { AxiosError } from 'axios';
import { QueryRequest, QueryResponse, StreamEvent, FeedbackRequest, WebIngestionRequest, GitIngestionRequest } from '../types';

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
    forgotPassword: async (email: string) => {
        try {
            const response = await api.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to request password reset');
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
    updateProfile: async (fullName?: string) => {
        try {
            const response = await api.put('/auth/profile', { full_name: fullName });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to update profile');
        }
    },
    resetPassword: async (oldPassword: string, newPassword: string) => {
        try {
            const response = await api.post('/auth/reset-password', {
                old_password: oldPassword,
                new_password: newPassword,
            });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to reset password');
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

    queryStream: async (
        request: QueryRequest,
        onEvent: (event: StreamEvent) => void,
        onError?: (error: Error) => void
    ): Promise<void> => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/chat/query/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const event = JSON.parse(line.slice(6)) as StreamEvent;
                            onEvent(event);
                        } catch (e) {
                            console.error('Error parsing SSE:', e);
                        }
                    }
                }
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Streaming failed');
            onError?.(err);
            throw err;
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
                onUploadProgress: (progressEvent: any) => {
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

    ingestWeb: async (request: WebIngestionRequest): Promise<any> => {
        try {
            const response = await api.post('/ingest/etl/ingest', {
                source_type: 'web',
                source_params: request
            });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to ingest web content');
        }
    },

    ingestGit: async (request: GitIngestionRequest): Promise<any> => {
        try {
            const response = await api.post('/ingest/etl/ingest', {
                source_type: 'git',
                source_params: request
            });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to ingest Git repository');
        }
    },

    ingestNotion: async (request: { api_key: string; database_id?: string; page_id?: string; chunk_size?: number; chunk_overlap?: number; batch_size?: number; store_in_qdrant?: boolean; }) => {
        try {
            const response = await api.post('/ingest/etl/ingest', {
                source_type: 'notion',
                source_params: {
                    api_key: request.api_key,
                    database_id: request.database_id,
                    page_id: request.page_id
                },
                chunk_size: request.chunk_size || 1000,
                chunk_overlap: request.chunk_overlap || 200,
                batch_size: request.batch_size || 32,
                store_in_qdrant: request.store_in_qdrant !== false
            });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to ingest Notion content');
        }
    },

    ingestDatabase: async (request: { host: string; port?: number; database: string; user?: string; password?: string; db_type?: string; query?: string; table?: string; chunk_size?: number; chunk_overlap?: number; batch_size?: number; store_in_qdrant?: boolean; }) => {
        try {
            const response = await api.post('/ingest/etl/ingest', {
                source_type: 'database',
                source_params: {
                    host: request.host,
                    port: request.port || 5432,
                    database: request.database,
                    user: request.user,
                    password: request.password,
                    db_type: request.db_type || 'postgresql',
                    query: request.query,
                    table: request.table
                },
                chunk_size: request.chunk_size || 1000,
                chunk_overlap: request.chunk_overlap || 200,
                batch_size: request.batch_size || 32,
                store_in_qdrant: request.store_in_qdrant !== false
            });
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to ingest Database content');
        }
    },

    ingestSubmit: async (payload: any) => {
        try {
            const response = await api.post('/ingest/submit', payload);
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to submit ingest job');
        }
    },

    ingestStatus: async (jobId: string) => {
        try {
            const response = await api.get(`/ingest/status/${jobId}`, { timeout: 15000 });
            return response.data;
        } catch (error) {
            // On timeout, return a pseudo-status indicating still processing
            if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
                return {
                    job_id: jobId,
                    status: 'running',
                    progress: -1, // Unknown progress
                    error: null,
                    _timeout: true // Flag to indicate this is a timeout response
                };
            }
            throw handleApiError(error, 'Failed to get ingest status');
        }
    },
    ingestListJobs: async (limit: number = 50) => {
        try {
            const response = await api.get(`/ingest/jobs?limit=${limit}`, { timeout: 15000 });
            return response.data;
        } catch (error) {
            // On timeout, return empty list to avoid crashing
            if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
                console.warn('Jobs list request timed out, returning cached or empty list');
                return { jobs: [], _timeout: true };
            }
            throw handleApiError(error, 'Failed to list ingest jobs');
        }
    },
    createIntegration: async (payload: any) => {
        try {
            const response = await api.post('/integrations', payload);
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to create integration');
        }
    },
    listIntegrations: async () => {
        try {
            const response = await api.get('/integrations');
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to list integrations');
        }
    },
    deleteIntegration: async (id: string) => {
        try {
            const response = await api.delete(`/integrations/${id}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to delete integration');
        }
    },
    ingestJobLogs: async (jobId: string) => {
        try {
            const response = await api.get(`/ingest/jobs/${jobId}/logs`);
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to fetch job logs');
        }
    },

    submitFeedback: async (request: FeedbackRequest): Promise<any> => {
        try {
            const response = await api.post('/evaluation/feedback', request);
            return response.data;
        } catch (error) {
            throw handleApiError(error, 'Failed to submit feedback');
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
    },
    delete: async (convId: string) => {
        const response = await api.delete(`/chat/conversations/${convId}`);
        return response.data;
    }
};

export default api;
