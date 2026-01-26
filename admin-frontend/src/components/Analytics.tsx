import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';
import { TrendingUp, Users as UsersIcon, MessageSquare, Activity, Loader2, RefreshCw } from 'lucide-react';

interface AnalyticsProps {
  token: string;
}

export default function Analytics({ token }: AnalyticsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [userStats, convStats, msgStats] = await Promise.all([
        adminApi.getUserStats(token),
        adminApi.getConversationStats(token),
        adminApi.getMessageStats(token)
      ]);
      setStats({ users: userStats, conversations: convStats, messages: msgStats });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-primary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-red-500/50 bg-red-500/10">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Analytics</h1>
          <p className="text-[var(--text-secondary)]">Insights and metrics for your platform</p>
        </div>
        <button onClick={loadAnalytics} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <UsersIcon className="w-8 h-8 text-[var(--accent-primary)]" />
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            {stats?.users?.total_users || 0}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Total Users</div>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8 text-[var(--accent-secondary)]" />
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            {stats?.conversations?.total || 0}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Conversations</div>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-blue-500" />
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            {stats?.messages?.total || 0}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Messages</div>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <UsersIcon className="w-8 h-8 text-yellow-500" />
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            {stats?.users?.active_users || 0}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Active Users</div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Usage Trends</h2>
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Chart visualization - Advanced analytics available</p>
        </div>
      </div>
    </div>
  );
}
