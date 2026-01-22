import { Message, FeedbackData } from '../types';
import { FeedbackButtons } from './FeedbackButtons';
import { SourceBadge } from './SourceBadge';
import { useState } from 'react';

interface ChatMessageProps {
    message: Message;
    showSources: boolean;
    onFeedbackSubmitted?: (messageIndex: number, feedback: FeedbackData) => void;
    messageIndex?: number;
}

export default function ChatMessage({ message, showSources, onFeedbackSubmitted, messageIndex }: ChatMessageProps) {
    const [showQueryId, setShowQueryId] = useState(false);

    const copyQueryId = () => {
        if (message.query_id) {
            navigator.clipboard.writeText(message.query_id);
            setShowQueryId(true);
            setTimeout(() => setShowQueryId(false), 2000);
        }
    };

    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                <div
                    className={`rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 ${message.role === 'user'
                            ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                            : message.error
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'glass-card text-[var(--text-primary)] border-[var(--border-main)]'
                        }`}
                >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {/* Streaming indicator */}
                    {message.isStreaming && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span>Generating...</span>
                        </div>
                    )}
                </div>

                {/* Collections queried badge */}
                {message.collections_queried && message.collections_queried.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Searched:</span>
                        {message.collections_queried.map((collection, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            >
                                {collection}
                            </span>
                        ))}
                    </div>
                )}

                {/* Sources */}
                {message.sources && message.sources.length > 0 && showSources && (
                    <div className="mt-3 space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sources:</p>
                        {message.sources.map((source, idx) => (
                            <div key={idx} className="bg-slate-800/50 dark:bg-slate-700/50 rounded-lg p-3 text-xs space-y-2">
                                <SourceBadge source={source} />
                                <p className="text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
                                    {source.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Feedback and Query ID (for assistant messages only) */}
                {message.role === 'assistant' && !message.error && (
                    <div className="mt-2 flex items-center justify-between">
                        <FeedbackButtons
                            queryId={message.query_id}
                            initialFeedback={message.feedback}
                            onFeedbackSubmitted={(feedback) => {
                                if (messageIndex !== undefined && onFeedbackSubmitted) {
                                    onFeedbackSubmitted(messageIndex, feedback);
                                }
                            }}
                        />

                        {message.query_id && (
                            <button
                                onClick={copyQueryId}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                title="Copy Query ID"
                            >
                                {showQueryId ? '✓ Copied!' : `ID: ${message.query_id.slice(0, 8)}...`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
