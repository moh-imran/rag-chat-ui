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
        <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 px-6 py-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question about your documents..."
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                    RAG Assistant can make mistakes. Verify important information.
                </p>
            </div>
        </div>
    );
}