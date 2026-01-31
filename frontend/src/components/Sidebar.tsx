import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Plus, Loader2, Database, Trash2, Inbox, Search } from 'lucide-react';
import { conversationApi } from '../utils/api';
import { Conversation } from '../types';

interface SidebarProps {
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    currentConversationId?: string;
    onOpenDataSources: () => void;
    onOpenIntegrations: () => void;
}

export default React.memo(function Sidebar({
    onSelectConversation,
    onNewChat,
    currentConversationId,
    onOpenDataSources,
    onOpenIntegrations
}: SidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [prevConversationsLength, setPrevConversationsLength] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = conversations.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const loadConversations = useCallback(async () => {
        try {
            const data = await conversationApi.list();
            setConversations(data);

            // If we have more conversations than before, and it wasn't the initial load
            if (data.length > prevConversationsLength && prevConversationsLength > 0 && !loading) {
                // Find the new conversation (assuming it's at the top due to sorting)
                const newConv = data[0];
                if (newConv && newConv.id !== currentConversationId) {
                    onSelectConversation(newConv.id);
                }
            }
            setPrevConversationsLength(data.length);
        } catch (error) {
            console.error('Failed to load conversations', error);
        } finally {
            setLoading(false);
        }
    }, [prevConversationsLength, loading, currentConversationId, onSelectConversation]);

    const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this conversation?')) return;

        try {
            await conversationApi.delete(id);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (currentConversationId === id) {
                onNewChat();
            }
        } catch (error) {
            console.error('Failed to delete conversation', error);
        }
    };

    useEffect(() => {
        loadConversations();
        // Refresh every minute to keep timestamps fresh or when a new chat might have been started elsewhere
        const interval = setInterval(loadConversations, 60000);
        return () => clearInterval(interval);
    }, [loadConversations]);

    // REDUNDANT: Removed effect that re-loaded conversations on currentConversationId change.
    // Switching views should not trigger a full network reload of the list.

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-64 glass-panel border-r border-[var(--border-main)] flex flex-col h-full z-20 transition-colors duration-500">
            <div className="p-4 space-y-3">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-[var(--border-main)] text-[var(--text-primary)] rounded-lg py-2.5 transition-all font-semibold active:scale-[0.98] shadow-sm"
                >
                    <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
                    New Chat
                </button>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                <div className="h-px bg-[var(--border-main)] mx-4 my-2" />

                {loading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 text-[var(--text-secondary)] animate-spin" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center p-8">
                        <p className="text-sm text-[var(--text-secondary)] italic">
                            {searchTerm ? 'No matching chats' : 'No conversations yet'}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conv: Conversation) => (
                        <div key={conv.id} className="relative group/item">
                            <button
                                onClick={() => onSelectConversation(conv.id)}
                                className={`w-full text-left p-3 pr-10 rounded-xl transition-all ${currentConversationId === conv.id
                                    ? 'bg-[var(--accent-primary)]/10 border-l-2 border-[var(--accent-primary)] text-[var(--text-primary)] shadow-[inset_4px_0_15px_rgba(0,242,255,0.05)]'
                                    : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <MessageSquare className={`w-4 h-4 mt-1 flex-shrink-0 ${currentConversationId === conv.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]/50'
                                        }`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate leading-tight">
                                            {conv.title}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-wider font-semibold opacity-70">
                                            {formatDate(conv.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all"
                                title="Delete Chat"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-[var(--border-main)] space-y-1">
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest px-3 mb-2 opacity-50">Workbench</p>

                <button
                    onClick={onOpenDataSources}
                    className="w-full flex items-center justify-between px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-white/5 rounded-lg transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Data Sources</span>
                    </div>
                </button>

                <button
                    onClick={onOpenIntegrations}
                    className="w-full flex items-center justify-between px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-white/5 rounded-lg transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <Inbox className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Integrations</span>
                    </div>
                </button>

                <div className="pt-4 pb-2">
                    <div className="flex items-center gap-2.5 px-3 py-1.5 glass-card border-none bg-emerald-500/5 rounded-full w-fit">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-widest">Engine Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
});
