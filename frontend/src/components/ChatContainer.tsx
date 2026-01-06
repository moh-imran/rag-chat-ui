import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Message, ChatConfig } from '../types';
import { chatApi, conversationApi } from '../utils/api';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';

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
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

        onMessagesChange([...messages, userMessage]);
        setLoading(true);

        try {
            const response = await chatApi.query({
                question: userInput,
                conversation_id: conversationId,
                top_k: config.topK,
                temperature: config.temperature,
                return_sources: config.showSources,
            });

            if (!conversationId && response.conversation_id) {
                onConversationIdChange(response.conversation_id);
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.answer,
                sources: response.sources,
                timestamp: new Date().toISOString(),
            };

            onMessagesChange([...messages, userMessage, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: true,
                timestamp: new Date(),
            };

            onMessagesChange([...messages, userMessage, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <ChatMessage key={idx} message={msg} showSources={config.showSources} />
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800 rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                            <span className="text-sm text-slate-400">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            <ChatInput onSend={handleSend} loading={loading} />
        </>
    );
}