import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plug, Plus, Trash2, Eye, Loader2, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const api = axios.create({ baseURL: API_URL });

export default function AdminPanel() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('confluence');
  const [config, setConfig] = useState('{}');

  const load = async () => {
    setLoading(true);
    try {
      const ints = await api.get('/integrations');
      setIntegrations(Array.isArray(ints.data) ? ints.data : (ints.data.items || []));
    } catch (e) {
      console.error(e);
    }
    try {
      const j = await api.get('/etl/jobs?limit=50');
      setJobs(j.data.items || j.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(config || '{}');
      await api.post('/integrations', { name, type, config: parsed });
      setName('');
      setConfig('{}');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to create integration');
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    try {
      await api.delete(`/integrations/${id}`);
      await load();
    } catch (e) {
      alert('Failed to delete integration');
    }
  };

  const viewLogs = async (jobId: string) => {
    try {
      const r = await api.get(`/etl/jobs/${jobId}/logs`);
      alert((r.data.logs || []).join('\n') || JSON.stringify(r.data));
    } catch (e) {
      alert('Failed to load logs');
    }
  };

  return (
    <div className="space-y-8">
      {/* Integrations Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Integrations</h2>
            <p className="text-sm text-[var(--text-secondary)]">Manage data source connections</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        {/* Create Integration Form */}
        <form onSubmit={createIntegration} className="glass-panel p-6 rounded-xl mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Integration
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Integration"
                  required
                  className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all"
                >
                  <option value="confluence">Confluence</option>
                  <option value="sharepoint">SharePoint</option>
                  <option value="notion">Notion</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Configuration (JSON)
              </label>
              <textarea
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                placeholder='{"url": "https://...", "api_key": "..."}'
                className="w-full h-32 bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50 font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:brightness-110 text-white font-semibold rounded-lg transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Integration
              </button>
              <button
                type="button"
                onClick={() => {
                  setName('');
                  setConfig('{}');
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--border-main)] text-[var(--text-secondary)] font-medium rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        {/* Integrations List */}
        <div className="glass-panel rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">Loading integrations...</p>
            </div>
          ) : integrations.length === 0 ? (
            <div className="p-8 text-center">
              <Plug className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--text-secondary)]">No integrations yet</p>
              <p className="text-sm text-[var(--text-secondary)] opacity-70">Create your first integration above</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-main)]">
              {integrations.map((it) => (
                <div
                  key={it.id || it._id || it.name}
                  className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                      <Plug className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{it.name || it.id}</div>
                      <div className="text-sm text-[var(--text-secondary)] capitalize">{it.type}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteIntegration(it.id || it._id || it.name)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ETL Jobs Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">ETL Jobs</h2>
          <p className="text-sm text-[var(--text-secondary)]">Monitor data ingestion jobs</p>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          {jobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-[var(--text-secondary)]">No jobs found</div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-main)]">
              {jobs.map((job) => (
                <div
                  key={job.job_id || job.id}
                  className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-[var(--text-primary)] font-mono text-sm">
                      {job.job_id}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          job.status === 'completed'
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
                    </div>
                  </div>
                  <button
                    onClick={() => viewLogs(job.job_id || job.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">View Logs</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
