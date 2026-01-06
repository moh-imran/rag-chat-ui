import { Message } from '../types';

interface ChatMessageProps {
    message: Message;
    showSources: boolean;
}

export default function ChatMessage({ message, showSources }: ChatMessageProps) {
    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                <div
                    className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : message.error
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.sources && message.sources.length > 0 && showSources && (
                    <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-500 font-medium">Sources:</p>
                        {message.sources.map((source, idx) => (
                            <div key={idx} className="bg-slate-800/50 rounded-lg p-2 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-slate-400 font-medium">
                                        {source.metadata?.filename || 'Unknown'}
                                    </span>
                                    <span className="text-blue-400">
                                        {(source.score * 100).toFixed(1)}% match
                                    </span>
                                </div>
                                <p className="text-slate-500 line-clamp-2">{source.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}