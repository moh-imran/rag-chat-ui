import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2, Loader2, LogOut } from 'lucide-react';
import { conversationApi } from '../utils/api';
import { Conversation } from '../types';

interface SidebarProps {
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    currentConversationId?: string;
}

export default function Sidebar({
    onSelectConversation,
    onNewChat,
    currentConversationId
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
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 transition-colors font-medium shadow-lg shadow-blue-900/20"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                {loading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center p-8">
                        <p className="text-sm text-slate-500 italic">No conversations yet</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelectConversation(conv.id)}
                            className={`w-full text-left p-3 rounded-lg transition-all group relative ${currentConversationId === conv.id
                                ? 'bg-slate-800 border-l-2 border-blue-500 text-white'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <MessageSquare className={`w-4 h-4 mt-1 flex-shrink-0 ${currentConversationId === conv.id ? 'text-blue-400' : 'text-slate-500'
                                    }`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate leading-tight">
                                        {conv.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                                        {formatDate(conv.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 px-2 py-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Connected to RAG API
                </div>
            </div>
        </div>
    );
}
