import { useState, useCallback } from 'react';
import { chatApi } from '../utils/api';
import { StreamEvent, QueryRequest, Source } from '../types';

interface StreamingState {
    isStreaming: boolean;
    streamingContent: string;
    retrievalStatus: string;
    sources: Source[];
    queryId?: string;
    conversationId?: string;
    collectionsQueried?: string[];
}

export const useStreaming = () => {
    const [state, setState] = useState<StreamingState>({
        isStreaming: false,
        streamingContent: '',
        retrievalStatus: '',
        sources: [],
    });

    const streamQuery = useCallback(async (request: QueryRequest): Promise<void> => {
        setState({
            isStreaming: true,
            streamingContent: '',
            retrievalStatus: '🔍 Searching documents...',
            sources: [],
        });

        try {
            await chatApi.queryStream(
                request,
                (event: StreamEvent) => {
                    // Handle both 'type' and 'event' field names
                    const eventType = event.type || (event as any).event;
                    switch (eventType) {
                        case 'conversation_id':
                            const newConvId = (event as any).conversation_id || event.data?.conversation_id;
                            setState(prev => ({
                                ...prev,
                                conversationId: newConvId,
                            }));
                            break;

                        case 'retrieval_start':
                            setState(prev => ({
                                ...prev,
                                retrievalStatus: '🔍 Searching documents...',
                            }));
                            break;

                        case 'retrieval_complete':
                            setState(prev => ({
                                ...prev,
                                retrievalStatus: `✅ Found ${event.data.num_docs} documents`,
                                sources: event.data.sources || [],
                            }));
                            break;

                        case 'generation_start':
                            setState(prev => ({
                                ...prev,
                                retrievalStatus: '💬 Generating answer...',
                            }));
                            break;

                        case 'token':
                            setState(prev => ({
                                ...prev,
                                streamingContent: prev.streamingContent + event.data.content,
                            }));
                            break;

                        case 'done':
                            setState(prev => ({
                                ...prev,
                                isStreaming: false,
                                retrievalStatus: '',
                                // Ensure queryId is set to trigger message finalization
                                queryId: prev.queryId || 'stream-complete',
                            }));
                            break;

                        case 'error':
                            console.error('Stream error:', event.data);
                            setState(prev => ({
                                ...prev,
                                isStreaming: false,
                                retrievalStatus: '❌ Error occurred',
                            }));
                            break;
                    }
                },
                (error) => {
                    console.error('Streaming error:', error);
                    setState(prev => ({
                        ...prev,
                        isStreaming: false,
                        retrievalStatus: '❌ Streaming failed',
                    }));
                }
            );
        } catch (error) {
            console.error('Failed to start streaming:', error);
            setState(prev => ({
                ...prev,
                isStreaming: false,
                retrievalStatus: '❌ Failed to start',
            }));
        }
    }, []);

    const reset = useCallback(() => {
        setState({
            isStreaming: false,
            streamingContent: '',
            retrievalStatus: '',
            sources: [],
            conversationId: undefined,
            queryId: undefined,
        });
    }, []);

    return {
        ...state,
        streamQuery,
        reset,
    };
};
