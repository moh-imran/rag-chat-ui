import React, { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Search, Loader2, RefreshCw, Calendar, MessageCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

interface Feedback {
    timestamp: string;
    query_id: string;
    feedback_type: 'thumbs_up' | 'thumbs_down' | 'correction' | string;
    rating?: number;
    comment?: string;
    correction?: string;
}

interface FeedbackProps {
    token: string;
}

export default function Feedback({ token }: FeedbackProps) {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const loadFeedback = async () => {
        setLoading(true);
        setError('');
        try {
            const api = axios.create({ baseURL: API_URL });
            const res = await api.get('/admin/feedback', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // The backend returns a list of feedback objects
            setFeedbackList(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeedback();
    }, [token]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredFeedback = feedbackList.filter(fb =>
        fb.query_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fb.comment && fb.comment.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">User Feedback</h1>
                    <p className="text-[var(--text-secondary)]">Review "Helpful" and "Not Helpful" ratings from users</p>
                </div>
                <button
                    onClick={loadFeedback}
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
                        placeholder="Search by Query ID or comment..."
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
                {loading && feedbackList.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mb-2" />
                        <p className="text-sm text-[var(--text-secondary)]">Loading feedback...</p>
                    </div>
                ) : filteredFeedback.length === 0 ? (
                    <div className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
                        <p className="text-[var(--text-secondary)]">No feedback entries found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border-main)]">
                        {filteredFeedback.map((fb, idx) => (
                            <div key={idx} className="p-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${fb.feedback_type === 'thumbs_up' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                                }`}>
                                                {fb.feedback_type === 'thumbs_up' ?
                                                    <ThumbsUp className="w-5 h-5 text-emerald-500" /> :
                                                    <ThumbsDown className="w-5 h-5 text-red-500" />
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${fb.feedback_type === 'thumbs_up' ? 'text-emerald-500' : 'text-red-500'
                                                        }`}>
                                                        {fb.feedback_type === 'thumbs_up' ? 'Helpful' : 'Not Helpful'}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-secondary)] font-mono opacity-50">
                                                        ID: {fb.query_id.slice(0, 13)}...
                                                    </span>
                                                </div>
                                                <div className="text-sm text-[var(--text-primary)] mt-1">
                                                    {fb.comment ? (
                                                        <div className="flex items-start gap-2 bg-white/5 p-3 rounded-lg border border-[var(--border-main)] mt-2 italic">
                                                            <MessageCircle className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 flex-shrink-0" />
                                                            <span>"{fb.comment}"</span>
                                                        </div>
                                                    ) : (
                                                        <span className="italic opacity-50 text-xs">No comments provided</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] text-[var(--text-secondary)] mt-3 uppercase tracking-widest font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(fb.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
