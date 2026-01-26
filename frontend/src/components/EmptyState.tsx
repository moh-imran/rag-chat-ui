
import { MessageSquare } from 'lucide-react';
import Logo from './Logo';

export default function EmptyState() {
    return (
        <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="mb-6 inline-block relative">
                <div className="absolute inset-0 bg-[var(--accent-primary)]/10 blur-3xl rounded-full"></div>
                <Logo size={70} className="relative z-10 opacity-90" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">RAG Assistant</h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto leading-relaxed opacity-70">
                Unlock the knowledge within your documents. Upload files to start a context-aware conversation powered by neural search.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="glass-card p-5 rounded-xl text-left transition-colors group">
                    <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3 text-[var(--accent-primary)]" />
                        Prompt Idea
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm group-hover:text-[var(--text-primary)] transition-colors">"Summarize the key takeaways from the uploaded documents."</p>
                </div>
                <div className="glass-card p-5 rounded-xl text-left transition-colors group">
                    <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3 text-[var(--accent-primary)]" />
                        Prompt Idea
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm group-hover:text-[var(--text-primary)] transition-colors">"What are the specific requirements mentioned in the latest file?"</p>
                </div>
            </div>
        </div>
    );
}
