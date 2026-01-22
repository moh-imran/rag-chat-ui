import React, { useEffect, useState } from 'react';
import { MessageSquare, Search, Eye, Trash2, Loader2, RefreshCw, User, Calendar } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

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

  const loadConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const api = axios.create({ baseURL: API_URL });
      const res = await api.get('/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      setConversations(res.data.conversations || res.data.items || res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token]);

  const filteredConversations = conversations.filter(conv =>
    conv.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            placeholder="Search by user email, title, or ID..."
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
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--text-secondary)]">No conversations found</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-main)]">
            {filteredConversations.map((conv) => (
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
                      onClick={() => alert(`View conversation ${conv.id}`)}
                      className="p-2 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                      title="View conversation"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this conversation?')) {
                          alert('Delete functionality pending');
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
      </div>

      <div className="glass-panel p-4 rounded-xl text-sm text-[var(--text-secondary)]">
        <p>Showing {filteredConversations.length} of {conversations.length} conversations</p>
      </div>
    </div>
  );
}
