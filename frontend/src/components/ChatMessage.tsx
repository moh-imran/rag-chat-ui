import { Message, FeedbackData } from '../types';
import { FeedbackButtons } from './FeedbackButtons';
import { SourceBadge } from './SourceBadge';
import { MarkdownRenderer } from './MarkdownRenderer';
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ChatMessageProps {
    message: Message;
    showSources: boolean;
    onFeedbackSubmitted?: (messageIndex: number, feedback: FeedbackData) => void;
    messageIndex?: number;
}

export default React.memo(function ChatMessage({ message, showSources, onFeedbackSubmitted, messageIndex }: ChatMessageProps) {
    const [showQueryId, setShowQueryId] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyContent = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

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
                    className={`rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 select-text ${message.role === 'user'
                        ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                        : message.error
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'glass-card text-[var(--text-primary)] border-[var(--border-main)]'
                        }`}
                >
                    {message.role === 'user' ? (
                        <div className="relative group">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap select-text cursor-text chat-message-content pr-6">{message.content}</p>
                            <button
                                onClick={handleCopyContent}
                                className="absolute top-0 right-[-10px] p-1.5 rounded-full hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all text-white/80 hover:text-white"
                                title="Copy message"
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm leading-relaxed select-text chat-message-content">
                            <MarkdownRenderer content={message.content} />
                        </div>
                    )}

                    {/* Streaming cursor indicator */}
                    {message.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-[var(--accent-primary)] animate-pulse ml-0.5 align-middle" />
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
                    <div className="mt-3 pt-2 border-t border-gray-200/10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <FeedbackButtons
                                queryId={message.query_id}
                                initialFeedback={message.feedback}
                                onFeedbackSubmitted={(feedback) => {
                                    if (messageIndex !== undefined && onFeedbackSubmitted) {
                                        onFeedbackSubmitted(messageIndex, feedback);
                                    }
                                }}
                            />
                            {/* Copy button grouped with feedback */}
                            <button
                                onClick={handleCopyContent}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-[var(--accent-primary)] hover:bg-white/5 rounded-full transition-all"
                                title="Copy response"
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>

                        {message.query_id && (
                            <button
                                onClick={copyQueryId}
                                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-mono"
                                title="Copy Query ID"
                            >
                                {showQueryId ? '✓ Copied!' : `${message.query_id.slice(0, 8)}...`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
