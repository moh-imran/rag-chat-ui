import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';
import {
  Users,
  MessageSquare,
  MessageCircle,
  Activity,
  Server,
  Database,
  Briefcase,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
  };
  conversations: {
    total: number;
    today: number;
    this_week: number;
    avg_per_user: number;
  };
  messages: {
    total: number;
    today: number;
    this_week: number;
    avg_per_conversation: number;
  };
  system: {
    rag_api_status: string;
    mongodb_status: string;
    uptime: string;
  };
  etl: {
    total_jobs: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  iconColor?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, iconColor = "var(--accent-primary)" }: StatCardProps) {
  return (
    <div className="glass-panel p-6 rounded-xl hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-white/5">
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-[var(--text-secondary)] mb-1">{title}</p>
        <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface SystemHealthCardProps {
  service: string;
  status: string;
  icon: React.ElementType;
}

function SystemHealthCard({ service, status, icon: Icon }: SystemHealthCardProps) {
  const getStatusColor = () => {
    if (status === 'online') return 'text-emerald-500';
    if (status === 'degraded') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (status === 'online') return <CheckCircle className="w-4 h-4" />;
    if (status === 'degraded') return <AlertCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="glass-card p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-[var(--accent-primary)]" />
        <span className="font-medium text-[var(--text-primary)]">{service}</span>
      </div>
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm capitalize">{status}</span>
      </div>
    </div>
  );
}

export default function Dashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminApi.getStats(token);
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-primary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-500">Error Loading Dashboard</h3>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Overview of your RAG Chat system</p>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`${stats.users.active} active`}
            icon={Users}
            trend={stats.users.new_this_week > 0 ? `+${stats.users.new_this_week} this week` : undefined}
          />
          <StatCard
            title="Active Users"
            value={stats.users.active}
            subtitle="Currently active"
            icon={Activity}
            iconColor="var(--accent-secondary)"
          />
          <StatCard
            title="New Today"
            value={stats.users.new_today}
            subtitle="Registered today"
            icon={TrendingUp}
            iconColor="#10b981"
          />
          <StatCard
            title="New This Week"
            value={stats.users.new_this_week}
            subtitle="Last 7 days"
            icon={Clock}
            iconColor="#f59e0b"
          />
        </div>
      </div>

      {/* Conversation & Message Stats */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Engagement Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Conversations"
            value={stats.conversations.total}
            subtitle={`${stats.conversations.avg_per_user} avg per user`}
            icon={MessageSquare}
            trend={stats.conversations.this_week > 0 ? `+${stats.conversations.this_week} this week` : undefined}
          />
          <StatCard
            title="Total Messages"
            value={stats.messages.total}
            subtitle={`${stats.messages.avg_per_conversation} avg per conversation`}
            icon={MessageCircle}
            iconColor="var(--accent-secondary)"
          />
          <StatCard
            title="Messages Today"
            value={stats.messages.today}
            subtitle="Sent today"
            icon={TrendingUp}
            iconColor="#10b981"
          />
        </div>
      </div>

      {/* ETL Stats */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">ETL Job Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Jobs"
            value={stats.etl.total_jobs}
            subtitle="All time"
            icon={Briefcase}
          />
          <StatCard
            title="Pending"
            value={stats.etl.pending}
            subtitle="Waiting to start"
            icon={Clock}
            iconColor="#f59e0b"
          />
          <StatCard
            title="Running"
            value={stats.etl.running}
            subtitle="In progress"
            icon={Activity}
            iconColor="#3b82f6"
          />
          <StatCard
            title="Completed"
            value={stats.etl.completed}
            subtitle="Successful"
            icon={CheckCircle}
            iconColor="#10b981"
          />
          <StatCard
            title="Failed"
            value={stats.etl.failed}
            subtitle="Requires attention"
            icon={AlertCircle}
            iconColor="#ef4444"
          />
        </div>
      </div>

      {/* System Health */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">System Health</h2>
        <div className="glass-panel p-6 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SystemHealthCard
              service="MongoDB"
              status={stats.system.mongodb_status}
              icon={Database}
            />
            <SystemHealthCard
              service="RAG API"
              status={stats.system.rag_api_status}
              icon={Server}
            />
            <SystemHealthCard
              service="Backend"
              status="online"
              icon={Activity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
