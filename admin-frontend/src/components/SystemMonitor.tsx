import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';
import { Server, Database, Activity, CheckCircle, AlertCircle, XCircle, Loader2, RefreshCw, Cpu, HardDrive, Zap } from 'lucide-react';

interface SystemMonitorProps {
  token: string;
}

interface SystemHealth {
  mongodb_status: string;
  rag_api_status: string;
  uptime?: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
}

export default function SystemMonitor({ token }: SystemMonitorProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHealth = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getSystemHealth(token);
      setHealth(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load system health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const getStatusColor = (status: string) => {
    if (status === 'online' || status === 'healthy') return 'text-emerald-500';
    if (status === 'degraded' || status === 'warning') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'online' || status === 'healthy') return <CheckCircle className="w-6 h-6" />;
    if (status === 'degraded' || status === 'warning') return <AlertCircle className="w-6 h-6" />;
    return <XCircle className="w-6 h-6" />;
  };

  const getStatusBg = (status: string) => {
    if (status === 'online' || status === 'healthy') return 'bg-emerald-500/10 border-emerald-500/50';
    if (status === 'degraded' || status === 'warning') return 'bg-yellow-500/10 border-yellow-500/50';
    return 'bg-red-500/10 border-red-500/50';
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-primary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">System Monitor</h1>
          <p className="text-[var(--text-secondary)]">Real-time system health and performance metrics</p>
        </div>
        <button
          onClick={loadHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-red-500/50 bg-red-500/10">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {health && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`glass-panel p-6 rounded-xl border ${getStatusBg(health.mongodb_status)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-white/10">
                    <Database className="w-6 h-6 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">MongoDB</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Database</p>
                  </div>
                </div>
                <div className={getStatusColor(health.mongodb_status)}>{getStatusIcon(health.mongodb_status)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Status</span>
                <span className={`text-sm font-medium capitalize ${getStatusColor(health.mongodb_status)}`}>{health.mongodb_status}</span>
              </div>
            </div>

            <div className={`glass-panel p-6 rounded-xl border ${getStatusBg(health.rag_api_status)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-white/10">
                    <Server className="w-6 h-6 text-[var(--accent-secondary)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">RAG API</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Service</p>
                  </div>
                </div>
                <div className={getStatusColor(health.rag_api_status)}>{getStatusIcon(health.rag_api_status)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Status</span>
                <span className={`text-sm font-medium capitalize ${getStatusColor(health.rag_api_status)}`}>{health.rag_api_status}</span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border bg-emerald-500/10 border-emerald-500/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-white/10">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">Backend</h3>
                    <p className="text-xs text-[var(--text-secondary)]">API Server</p>
                  </div>
                </div>
                <div className="text-emerald-500"><CheckCircle className="w-6 h-6" /></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Status</span>
                <span className="text-sm font-medium text-emerald-500">Online</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {health.uptime && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-[var(--text-secondary)]">Uptime</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{health.uptime}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">Last Updated</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">Auto Refresh</span>
                <span className="text-sm font-medium text-emerald-500">30s</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-[var(--text-secondary)]">Environment</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">Production</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
