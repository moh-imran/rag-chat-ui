import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Loader2, LogOut, Database, User as UserIcon, Sun, Moon } from 'lucide-react';
import { conversationApi } from '../utils/api';
import { Conversation } from '../types';

interface SidebarProps {
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    currentConversationId?: string;
    onOpenProfile: () => void;
    onOpenDataSources: () => void;
    onLogout: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

export default function Sidebar({
    onSelectConversation,
    onNewChat,
    currentConversationId,
    onOpenProfile,
    onOpenDataSources,
    onLogout,
    theme,
    onToggleTheme
}: SidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    const loadConversations = async () => {
        try {
            const data = await conversationApi.list();
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
        // Refresh every minute to keep timestamps fresh or when a new chat might have been started elsewhere
        const interval = setInterval(loadConversations, 60000);
        return () => clearInterval(interval);
    }, []);

    // Re-load when currentConversationId changes (e.g. after first message)
    useEffect(() => {
        loadConversations();
    }, [currentConversationId]);


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
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-[var(--border-main)] text-[var(--text-primary)] rounded-lg py-2.5 transition-all font-semibold active:scale-[0.98] shadow-sm"
                >
                    <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                <div className="h-px bg-[var(--border-main)] mx-4 my-2" />

                {loading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 text-[var(--text-secondary)] animate-spin" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center p-8">
                        <p className="text-sm text-[var(--text-secondary)] italic">No conversations yet</p>
                    </div>
                ) : (
                    conversations.map((conv: Conversation) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelectConversation(conv.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all group relative ${currentConversationId === conv.id
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

                <div className="h-2" />

                <button
                    onClick={onOpenProfile}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition-all"
                >
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Profile Settings</span>
                </button>

                <div className="h-px bg-[var(--border-main)] mx-1 my-2" />

                <button
                    onClick={onToggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition-all"
                >
                    <div className="flex items-center gap-3">
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        <span className="text-sm font-medium">{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                    </div>
                </button>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign Out</span>
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
}
