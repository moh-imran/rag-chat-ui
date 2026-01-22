import { useState, useCallback } from 'react';
import { chatApi } from '../utils/api';
import { StreamEvent, QueryRequest, Source } from '../types';

interface StreamingState {
    isStreaming: boolean;
    streamingContent: string;
    retrievalStatus: string;
    sources: Source[];
    queryId?: string;
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
            retrievalStatus: 'Initializing...',
            sources: [],
        });

        try {
            await chatApi.queryStream(
                request,
                (event: StreamEvent) => {
                    switch (event.type) {
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
        });
    }, []);

    return {
        ...state,
        streamQuery,
        reset,
    };
};
