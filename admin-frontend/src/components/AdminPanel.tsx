import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plug, Trash2, Eye, Loader2, RefreshCw, FileText, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: API_URL });

export default function AdminPanel({ token }: { token: string }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const LIMIT = 10;

  const load = async () => {
    setLoading(true);
    try {
      const skip = page * LIMIT;
      let url = `/ingest/jobs?limit=${LIMIT}&skip=${skip}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const j = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const jobData = j.data;
      if (Array.isArray(jobData)) {
        setJobs(jobData);
      } else if (jobData?.jobs) {
        setJobs(jobData.jobs);
      } else {
        setJobs([]);
      }
    } catch (e) {
      console.error('Error loading ingestion jobs:', e);
      setJobs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      setPage(0); // Reset page on search
      load();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    load();
  }, [page]);

  const deleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ingestion job? This will remove associated vectors.')) return;
    try {
      await api.delete(`/ingest/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await load();
    } catch (e) {
      alert('Failed to delete job');
    }
  };

  const viewLogs = async (jobId: string) => {
    try {
      setSelectedJobId(jobId);
      const r = await api.get(`/ingest/jobs/${jobId}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const logData = r.data.logs;
      setLogs(Array.isArray(logData) ? logData.join('\n') : JSON.stringify(logData, null, 2));
    } catch (e) {
      alert('Failed to load logs');
    }
  };

  const closeLogs = () => {
    setLogs(null);
    setSelectedJobId(null);
  };

  return (
    <div className="space-y-8">
      {/* Metrics / Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Ingestion Jobs</h2>
          <p className="text-sm text-[var(--text-secondary)]">Monitor and manage data source ingestion</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-[var(--border-main)] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none w-64"
            />
          </div>
          <button
            onClick={() => { setPage(0); load(); }}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
            <div className="text-[var(--text-secondary)]">No ingestion jobs found</div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-main)]">
            {jobs.map((job) => (
              <div
                key={job.job_id || job.id}
                className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center mt-1">
                    <Plug className="w-5 h-5 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {job.meta?.filename || job.meta?.url || job.meta?.source_type || 'Unknown Source'}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-secondary)] bg-white/5 px-2 py-0.5 rounded">
                        {job.job_id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${job.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : job.status === 'running'
                            ? 'bg-blue-500/10 text-blue-500'
                            : job.status === 'failed'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {new Date(job.created_at || Date.now()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewLogs(job.job_id || job.id)}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
                    title="View Logs"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteJob(job.job_id || job.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
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
            disabled={jobs.length < LIMIT || loading}
            className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Logs Modal */}
      {logs !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center">
              <h3 className="font-semibold text-[var(--text-primary)]">Job Logs</h3>
              <button onClick={closeLogs} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Close
              </button>
            </div>
            <pre className="p-4 overflow-auto text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap">
              {logs || 'No logs available.'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
