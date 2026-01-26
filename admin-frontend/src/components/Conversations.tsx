import React, { useEffect, useState } from 'react';
import { MessageSquare, Search, Eye, Trash2, Loader2, RefreshCw, User, Calendar } from 'lucide-react';
import { adminApi } from '../utils/api';

interface Conversation {
  id: string;
  user_id: string;
  user_email?: string;
  title?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface ConversationsProps {
  token: string;
}

export default function Conversations({ token }: ConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const LIMIT = 10;

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const loadConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const skip = page * LIMIT;
      const data = await adminApi.listConversations(token, {
        limit: LIMIT,
        skip: skip,
        search: searchTerm
      });
      // Handle both [item1, item2] and { items: [item1, item2], total: 10 }
      setConversations(data.items || data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const viewConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setMessagesLoading(true);
    try {
      const data = await adminApi.getConversationMessages(token, conv.id);
      setMessages(data || []);
    } catch (err: any) {
      alert('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadConversations();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadConversations();
  }, [page, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Conversations</h1>
          <p className="text-[var(--text-secondary)]">View and manage all user conversations</p>
        </div>
        <button
          onClick={loadConversations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      <div className="glass-panel p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50"
          />
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-red-500/50 bg-red-500/10">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading && conversations.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--text-secondary)]">No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-main)]">
            {conversations.map((conv) => (
              <div key={conv.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)]">
                          {conv.title || `Conversation ${conv.id.slice(0, 8)}`}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {conv.user_email || conv.user_id.slice(0, 8)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conv.message_count} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(conv.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewConversation(conv)}
                      className="p-2 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                      title="View conversation"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this conversation? (Caution: Database action required elsewhere)')) {
                          alert('Delete functionality should be implemented in admin router first if needed.');
                        }
                      }}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-4 border-t border-[var(--border-main)] flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--text-secondary)]">Page {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={conversations.length < LIMIT || loading}
            className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
            <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl text-[var(--text-primary)]">
                  {selectedConversation.title || 'Conversation Detail'}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  User: {selectedConversation.user_email} • {messages.length} messages
                </p>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 hover:bg-white/5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
              {messagesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50">
                  <MessageSquare className="w-12 h-12 mb-2" />
                  <p>No messages in this conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                      ? 'bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 text-[var(--text-primary)]'
                      : 'bg-white/5 border border-[var(--border-main)] text-[var(--text-primary)]'
                      }`}>
                      <div className="text-[10px] uppercase tracking-wider font-bold mb-1 opacity-50">
                        {msg.role} • {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

