import { Send, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    loading: boolean;
}

export default function ChatInput({ onSend, loading }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim() || loading) return;
        onSend(input);
        setInput('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative">
            <div className="relative flex gap-1 p-1.5 glass-panel rounded-2xl">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask anything about your documents..."
                    disabled={loading}
                    rows={1}
                    className="flex-1 bg-transparent text-[var(--text-primary)] px-4 py-3 focus:outline-none text-sm placeholder:text-[var(--text-secondary)] disabled:opacity-50 resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="flex items-center justify-center w-11 h-11 bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-xl transition-all active:scale-95 shadow-lg"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
            <p className="mt-3 text-[9px] text-slate-600 text-center uppercase tracking-widest font-bold opacity-40">
                Neural RAG Pipeline
            </p>
        </div>
    );
}