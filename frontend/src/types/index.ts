export interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
    error?: boolean;
    timestamp?: string;
    query_id?: string;
    collections_queried?: string[];
    feedback?: FeedbackData;
    isStreaming?: boolean;
}

export interface Source {
    content: string;
    metadata: {
        filename?: string;
        filepath?: string;
        type?: string;
        chunk_id?: number;
        collection?: string;
        source?: string;
        url?: string;
        repo_url?: string;
    };
    score: number;
}

export interface ChatConfig {
    topK: number;
    temperature: number;
    showSources: boolean;
    useHyde?: boolean;
    routingStrategy?: 'auto' | 'all' | 'specific';
    selectedCollections?: string[];
    metadataFilters?: Record<string, any>;
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
    use_hyde?: boolean;
    metadata_filters?: Record<string, any>;
    routing_strategy?: 'auto' | 'all' | 'specific';
    specific_collections?: string[];
}

export interface QueryResponse {
    answer: string;
    context_used: boolean;
    conversation_id: string;
    sources?: Source[];
    query_id?: string;
    collections_queried?: string[];
}

export interface StreamEvent {
    type: 'conversation_id' | 'retrieval_start' | 'retrieval_complete' | 'generation_start' | 'token' | 'done' | 'error';
    data: any;
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

export type DataSourceType = 'file' | 'web' | 'git' | 'notion' | 'database';

export interface WebIngestionRequest {
    url: string;
    max_depth?: number;
}

export interface GitIngestionRequest {
    repo_url: string;
    branch?: string;
    file_extensions?: string[];
}

export interface FeedbackData {
    type: 'thumbs_up' | 'thumbs_down' | 'rating';
    rating?: number;
    comment?: string;
    submitted?: boolean;
}

export interface FeedbackRequest {
    query_id: string;
    feedback_type: 'thumbs_up' | 'thumbs_down' | 'correction';
    rating?: number;
    comment?: string;
    correction?: string;
}

export interface AdvancedOptions {
    useHyde: boolean;
    metadataFilters: Record<string, string>;
    routingStrategy: 'auto' | 'all' | 'specific';
    selectedCollections: string[];
}
