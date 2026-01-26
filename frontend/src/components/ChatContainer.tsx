import { useEffect, useRef, useState } from 'react';
import { Message, ChatConfig, FeedbackData } from '../types';
import { conversationApi } from '../utils/api';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';
import { useStreaming } from '../hooks/useStreaming';
import { StreamingIndicator } from './StreamingIndicator';

interface ChatContainerProps {
    messages: Message[];
    config: ChatConfig;
    onMessagesChange: (messages: Message[]) => void;
    conversationId?: string;
    onConversationIdChange: (id: string) => void;
}

export default function ChatContainer({
    messages,
    config,
    onMessagesChange,
    conversationId,
    onConversationIdChange
}: ChatContainerProps) {
    const { streamQuery, isStreaming, streamingContent, retrievalStatus, sources, queryId, conversationId: newConversationId, reset: resetStream } = useStreaming();
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent, isStreaming]);

    useEffect(() => {
        if (conversationId) {
            setLoading(true);
            conversationApi.getHistory(conversationId)
                .then(history => {
                    onMessagesChange(history);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load history', err);
                    setLoading(false);
                });
        }
    }, [conversationId]);

    const handleSend = async (userInput: string) => {
        const userMessage: Message = {
            role: 'user',
            content: userInput,
            timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...messages, userMessage];
        onMessagesChange(updatedMessages);

        try {
            await streamQuery({
                question: userInput,
                conversation_id: conversationId,
                top_k: config.topK,
                temperature: config.temperature,
                return_sources: config.showSources,
                useHyde: config.useHyde,
                routingStrategy: config.routingStrategy,
                selectedCollections: config.selectedCollections,
                metadataFilters: config.metadataFilters,
            });
        } catch (error: any) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `❌ Error: ${error.message || 'Unknown error'}`,
                error: true,
                timestamp: new Date().toISOString(),
            };
            onMessagesChange([...updatedMessages, errorMessage]);
        }
    };

    // Effect to update conversation ID when a new one is received from streaming
    useEffect(() => {
        if (newConversationId && newConversationId !== conversationId) {
            onConversationIdChange(newConversationId);
        }
    }, [newConversationId, conversationId, onConversationIdChange]);

    // Effect to finalize streaming message
    useEffect(() => {
        if (!isStreaming && streamingContent && (queryId || newConversationId)) {
            const assistantMessage: Message = {
                role: 'assistant',
                content: streamingContent,
                sources: sources,
                query_id: queryId,
                timestamp: new Date().toISOString(),
            };

            onMessagesChange(prevMessages => [...prevMessages, assistantMessage]);
            resetStream();
        }
    }, [isStreaming, queryId, newConversationId, resetStream, onMessagesChange, streamingContent, sources]);

    const handleFeedbackSubmitted = (index: number, feedback: FeedbackData) => {
        const newMessages = [...messages];
        newMessages[index] = { ...newMessages[index], feedback };
        onMessagesChange(newMessages);
    };

    // Only show streaming message when we have actual content
    const streamingMessage: Message | null = (isStreaming && streamingContent) ? {
        role: 'assistant',
        content: streamingContent,
        sources: sources,
        query_id: queryId,
        isStreaming: true,
        timestamp: new Date().toISOString(),
    } : null;

    return (
        <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.length === 0 && !isStreaming ? (
                        <EmptyState />
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <ChatMessage
                                    key={idx}
                                    message={msg}
                                    showSources={config.showSources}
                                    messageIndex={idx}
                                    onFeedbackSubmitted={handleFeedbackSubmitted}
                                />
                            ))}

                            {streamingMessage && (
                                <ChatMessage
                                    message={streamingMessage}
                                    showSources={config.showSources}
                                />
                            )}

                            {isStreaming && !streamingContent && (
                                <div className="flex justify-start">
                                    <StreamingIndicator
                                        status={retrievalStatus || 'Thinking...'}
                                        isActive={true}
                                    />
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-transparent border-t border-[var(--border-main)] relative z-10">
                <div className="max-w-4xl mx-auto">
                    <ChatInput
                        onSend={handleSend}
                        loading={isStreaming}
                    />
                </div>
            </div>
        </div>
    );
}
