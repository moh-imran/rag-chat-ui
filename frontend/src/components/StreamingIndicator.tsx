import React from 'react';
import { Search, Loader2, Sparkles, Database } from 'lucide-react';

interface StreamingIndicatorProps {
    status: string;
    isActive: boolean;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({ status, isActive }) => {
    if (!isActive || !status) return null;

    const isFinding = status.toLowerCase().includes('found') || status.toLowerCase().includes('result');
    const isSearching = status.toLowerCase().includes('search') || status.toLowerCase().includes('thinking');
    const isGenerating = status.toLowerCase().includes('generat') || status.toLowerCase().includes('synthesiz');

    return (
        <div className="flex flex-col gap-2 mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-3 px-4 py-2.5 glass-panel rounded-2xl border-none ring-1 ring-white/10 dark:ring-white/5 shadow-2xl max-w-fit">
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[var(--accent-primary)]/20 rounded-full blur-md animate-pulse-soft" />
                    <div className="relative p-1.5 bg-white/5 dark:bg-black/20 rounded-xl">
                        {isSearching && <Search className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-pulse" />}
                        {isFinding && <Database className="w-3.5 h-3.5 text-emerald-400" />}
                        {isGenerating && <Sparkles className="w-3.5 h-3.5 text-[var(--accent-secondary)] animate-spin-slow" />}
                        {!isSearching && !isFinding && !isGenerating && <Loader2 className="w-3.5 h-3.5 text-[var(--text-secondary)] animate-spin" />}
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-[13px] font-semibold tracking-wide text-[var(--text-primary)] shimmer-text uppercase transition-all">
                        {status}
                    </span>
                </div>

                <div className="flex gap-1 ml-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce" />
                </div>
            </div>
        </div>
    );
};
