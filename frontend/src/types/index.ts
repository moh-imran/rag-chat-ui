export interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
    error?: boolean;
    timestamp?: string; // Changed to string for ISO dates from backend
}

export interface Source {
    content: string;
    metadata: {
        filename?: string;
        filepath?: string;
        type?: string;
        chunk_id?: number;
    };
    score: number;
}

export interface ChatConfig {
    topK: number;
    temperature: number;
    showSources: boolean;
}

export interface QueryRequest {
    question: string;
    conversation_id?: string;
    top_k: number;
    temperature: number;
    return_sources: boolean;
    score_threshold?: number;
    system_instruction?: string;
    max_tokens?: number;
}

export interface QueryResponse {
    answer: string;
    context_used: boolean;
    conversation_id: string;
    sources?: Source[];
}

export interface User {
    id: string;
    email: string;
    full_name?: string;
}

export interface AuthToken {
    access_token: string;
    token_type: string;
}

export interface Conversation {
    id: string;
    title: string;
    updated_at: string;
}

export interface UploadStatus {
    type: 'loading' | 'success' | 'error';
    message: string;
}