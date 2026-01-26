import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Loader2, Trash2, Database, Globe, Github, CheckCircle, AlertCircle, RotateCw } from 'lucide-react';
import { chatApi } from '../utils/api';
import { UploadStatus } from '../types';

interface DataSourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadStatusChange?: (status: UploadStatus | null) => void;
}

type IngestType = 'file' | 'web' | 'git';
type IngestTypeExtended = IngestType | 'notion' | 'database' | 'confluence' | 'sharepoint';

// Local status bar component for inside the modal
const InlineStatusBar: React.FC<{ status: UploadStatus | null; onDismiss?: () => void }> = ({ status, onDismiss }) => {
    if (!status) return null;

    const styles: Record<string, string> = {
        loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        error: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const icons: Record<string, typeof Loader2> = {
        loading: Loader2,
        success: CheckCircle,
        error: AlertCircle,
    };
    const Icon = icons[status.type];

    return (
        <div className={`p-3 rounded-lg flex items-center gap-2 border ${styles[status.type]} mb-4`}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${status.type === 'loading' ? 'animate-spin' : ''}`} />
            <span className="text-sm flex-1">{status.message}</span>
            {status.type !== 'loading' && onDismiss && (
                <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default function DataSourcesModal({
    isOpen,
    onClose,
    onUploadStatusChange
}: DataSourcesModalProps) {
    const [ingestType, setIngestType] = useState<IngestTypeExtended>('file');

    // Local status state - displayed inside modal
    const [localStatus, setLocalStatus] = useState<UploadStatus | null>(null);

    // Helper to update status (shows in modal)
    const setStatus = (status: UploadStatus | null) => {
        setLocalStatus(status);
        if (onUploadStatusChange) {
            onUploadStatusChange(status);
        }
    };

    // Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Web Ingest State
    const [webUrl, setWebUrl] = useState('');
    const [maxDepth, setMaxDepth] = useState(1);

    // Git Ingest State
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('main');

    // Notion State
    const [notionApiKey, setNotionApiKey] = useState('');
    const [notionDatabaseId, setNotionDatabaseId] = useState('');

    // selection for saved integrations
    const [selectedConfluenceIntegration, setSelectedConfluenceIntegration] = useState<string | null>(null);
    const [selectedSharepointIntegration, setSelectedSharepointIntegration] = useState<string | null>(null);

    // Database State
    const [dbHost, setDbHost] = useState('');
    const [dbPort, setDbPort] = useState<number>(5432);
    const [dbName, setDbName] = useState('');
    const [dbUser, setDbUser] = useState('');
    const [dbPassword, setDbPassword] = useState('');
    // Confluence State
    const [confBaseUrl, setConfBaseUrl] = useState('');
    const [confEmail, setConfEmail] = useState('');
    const [confApiToken, setConfApiToken] = useState('');
    // SharePoint State
    const [spSiteId, setSpSiteId] = useState('');
    const [spAccessToken, setSpAccessToken] = useState('');
    // Jobs
    const [jobs, setJobs] = useState<Array<any>>([]);
    const [pollingJobId, setPollingJobId] = useState<string | null>(null);

    const loadJobs = async () => {
        try {
            const res = await chatApi.ingestListJobs();
            setJobs((res.jobs || []).slice(0, 5));
        } catch (e) {
            console.warn('Failed to load jobs', e);
        }
    };

    const loadIntegrations = async () => {
        try {
            // const res = await chatApi.listIntegrations();
            // store under different categories
            // not deeply normalized; just attach to state for selection
            setIntegrations([]);
        } catch (e) {
            console.warn('Failed to load integrations', e);
        }
    };

    // local state for integrations
    const [integrations, setIntegrations] = useState<Array<any>>([]);

    useEffect(() => {
        // load recent jobs on open
        if (isOpen) loadJobs();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) loadIntegrations();
    }, [isOpen]);

    // Polling with exponential backoff
    const [pollInterval, setPollInterval] = useState(2000);
    const [pollRetries, setPollRetries] = useState(0);
    const maxPollInterval = 30000; // Max 30 seconds between polls
    const maxRetries = 100; // Stop after ~100 attempts

    useEffect(() => {
        if (!pollingJobId) {
            setPollInterval(2000);
            setPollRetries(0);
            return;
        }

        let timeoutId: number;

        const poll = async () => {
            try {
                const status = await chatApi.ingestStatus(pollingJobId);

                // Handle timeout response (server is busy processing)
                if (status._timeout) {
                    setLocalStatus({ type: 'loading', message: '⏳ Server busy processing large job... checking again soon' });
                    // Use longer interval when server is under load
                    const newInterval = Math.min(pollInterval * 1.5, maxPollInterval);
                    setPollInterval(newInterval);
                    setPollRetries(prev => prev + 1);

                    if (pollRetries < maxRetries) {
                        timeoutId = setTimeout(poll, newInterval);
                    } else {
                        setLocalStatus({ type: 'error', message: '⚠️ Job is still processing. Check back later.' });
                        setPollingJobId(null);
                    }
                    return;
                }

                // update local jobs list
                setJobs(prev => {
                    const others = prev.filter(j => j.job_id !== pollingJobId);
                    return [status, ...others].slice(0, 5);
                });

                if (status.status === 'completed') {
                    setPollingJobId(null);
                    setLocalStatus({ type: 'success', message: `✅ Ingestion completed: ${status.result?.total_chunks || 0} chunks created` });
                } else if (status.status === 'failed') {
                    setPollingJobId(null);
                    setLocalStatus({ type: 'error', message: `❌ Ingestion failed: ${status.error || 'Unknown error'}` });
                } else {
                    // Job still running - use moderate backoff
                    const newInterval = Math.min(pollInterval * 1.2, maxPollInterval);
                    setPollInterval(newInterval);
                    setPollRetries(prev => prev + 1);

                    // Update status message to show progress
                    const progressMsg = status.progress > 0 ? ` (${Math.round(status.progress)}%)` : '';
                    setLocalStatus({ type: 'loading', message: `⏳ Processing${progressMsg}...` });

                    if (pollRetries < maxRetries) {
                        timeoutId = setTimeout(poll, newInterval);
                    } else {
                        console.warn('Max poll retries reached');
                        setLocalStatus({ type: 'error', message: '⚠️ Job is taking longer than expected. Check status in Jobs list.' });
                        setPollingJobId(null);
                    }
                }
            } catch (e) {
                console.warn('Polling failed', e);
                // On error, wait longer before retry
                const newInterval = Math.min(pollInterval * 2, maxPollInterval);
                setPollInterval(newInterval);
                setPollRetries(prev => prev + 1);

                if (pollRetries < maxRetries) {
                    timeoutId = setTimeout(poll, newInterval);
                } else {
                    setLocalStatus({ type: 'error', message: '⚠️ Lost connection to server. Job may still be running.' });
                    setPollingJobId(null);
                }
            }
        };

        // Start polling
        timeoutId = setTimeout(poll, pollInterval);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [pollingJobId, pollInterval, pollRetries]);

    if (!isOpen) return null;

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setStatus({ type: 'loading', message: `Uploading ${file.name}...` });

        try {
            const data = await chatApi.uploadFile(file);
            // Check if it returned a job_id (async processing)
            if (data.job_id) {
                setPollingJobId(data.job_id);
                setJobs(prev => [{ job_id: data.job_id, status: 'running', progress: 0, meta: { source_type: 'file', filename: file.name } }, ...prev].slice(0, 5));
                setStatus({
                    type: 'success',
                    message: `📤 File uploaded! Processing: ${file.name}`,
                });
            } else {
                setStatus({
                    type: 'success',
                    message: `✅ Processed ${data.total_chunks} chunks from ${file.name}`,
                });
            }
            // Success messages persist until user dismisses
            setSelectedFile(null);
            loadJobs(); // Refresh jobs list
        } catch (error) {
            setStatus({
                type: 'error',
                message: `❌ ${error instanceof Error ? error.message : 'Upload failed'}`,
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleWebIngest = async () => {
        if (!webUrl) return;
        setUploading(true);
        setStatus({ type: 'loading', message: `Submitting web crawl for ${webUrl}...` });

        try {
            // Use async submit endpoint for web ingestion
            const res = await chatApi.ingestSubmit({ source_type: 'web', source_params: { url: webUrl, max_depth: maxDepth } });
            setPollingJobId(res.job_id);
            setJobs(prev => [{ job_id: res.job_id, status: 'running', progress: 0, meta: { source_type: 'web', url: webUrl } }, ...prev].slice(0, 5));
            setStatus({
                type: 'success',
                message: `🌐 Web crawl started! Job: ${res.job_id.slice(0, 8)}...`,
            });
            setTimeout(() => setStatus(null), 5000);
            setWebUrl('');
        } catch (error) {
            setStatus({
                type: 'error',
                message: `❌ ${error instanceof Error ? error.message : 'Web ingestion failed'}`,
            });
        } finally {
            setUploading(false);
        }
    };

    const handleGitIngest = async () => {
        if (!repoUrl) return;
        setUploading(true);
        setStatus({ type: 'loading', message: `Submitting git clone for ${repoUrl}...` });

        try {
            // Use async submit endpoint for git ingestion
            const res = await chatApi.ingestSubmit({ source_type: 'git', source_params: { repo_url: repoUrl, branch } });
            setPollingJobId(res.job_id);
            setJobs(prev => [{ job_id: res.job_id, status: 'running', progress: 0, meta: { source_type: 'git', repo_url: repoUrl } }, ...prev].slice(0, 5));
            setStatus({
                type: 'success',
                message: `📦 Git clone started! Job: ${res.job_id.slice(0, 8)}...`,
            });
            setTimeout(() => setStatus(null), 5000);
            setRepoUrl('');
        } catch (error) {
            setStatus({
                type: 'error',
                message: `❌ ${error instanceof Error ? error.message : 'Git ingestion failed'}`,
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop-color)] backdrop-blur-md transition-all duration-500">
            <div className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-main)] flex-shrink-0">
                    <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                        <Database className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Data Sources</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Status bar inside modal */}
                    <InlineStatusBar status={localStatus} onDismiss={() => setLocalStatus(null)} />

                    <div className="space-y-6">
                        <div className="space-y-3">
                            {/* Basic Sources Row */}
                            <div>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Basic Sources</p>
                                <div className="flex p-1 bg-[var(--bg-neutral)] rounded-lg gap-1 border border-[var(--border-main)]">
                                    <button
                                        onClick={() => setIngestType('file')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all ${ingestType === 'file' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-neutral)]'}`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Files
                                    </button>
                                    <button
                                        onClick={() => setIngestType('web')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all ${ingestType === 'web' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-neutral)]'}`}
                                    >
                                        <Globe className="w-4 h-4" />
                                        Web
                                    </button>
                                    <button
                                        onClick={() => setIngestType('git')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all ${ingestType === 'git' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-neutral)]'}`}
                                    >
                                        <Github className="w-4 h-4" />
                                        Git
                                    </button>
                                </div>
                            </div>
                            {/* Enterprise Sources Row */}
                            <div>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Enterprise Sources</p>
                                <div className="flex p-1 bg-[var(--bg-neutral)] rounded-lg gap-1 border border-[var(--border-main)]">
                                    <button
                                        onClick={() => setIngestType('notion')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all ${ingestType === 'notion' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-neutral)]'}`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Notion
                                    </button>
                                    <button
                                        onClick={() => setIngestType('database')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all ${ingestType === 'database' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-neutral)]'}`}
                                    >
                                        <Database className="w-4 h-4" />
                                        Database
                                    </button>
                                    <button
                                        onClick={() => setIngestType('confluence')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all ${ingestType === 'confluence' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-neutral)]'}`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Confluence
                                    </button>
                                    <button
                                        onClick={() => setIngestType('sharepoint')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all ${ingestType === 'sharepoint' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-neutral)]'}`}
                                    >
                                        <Database className="w-4 h-4" />
                                        SharePoint
                                    </button>
                                </div>
                            </div>
                        </div>

                        {ingestType === 'file' && (
                            <div className="space-y-4">
                                {!selectedFile ? (
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${dragActive ? 'border-[#00f2ff] bg-[#00f2ff]/5 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                                    >
                                        <div className={`p-4 rounded-full transition-all ${dragActive ? 'bg-[#00f2ff]/20 text-[#00f2ff] scale-110' : 'bg-white/5 text-slate-500 group-hover:text-slate-400 group-hover:scale-110'}`}>
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">Click to upload or drag and drop</p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1">PDF, TXT, DOCX, or MD (max 10MB)</p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.txt,.docx,.md"
                                            onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] flex items-center gap-4">
                                        <div className="p-3 bg-[var(--accent-secondary)]/20 rounded-lg text-[var(--accent-secondary)]">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{selectedFile.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="p-2 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <button
                                    disabled={!selectedFile || uploading}
                                    onClick={() => selectedFile && handleFileUpload(selectedFile)}
                                    className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-3 font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Ingestion'}
                                </button>
                            </div>
                        )}

                        {ingestType === 'web' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Website URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://docs.example.com"
                                        value={webUrl}
                                        onChange={(e) => setWebUrl(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Crawl Depth</label>
                                        <span className="text-xs font-mono text-[var(--accent-primary)]">{maxDepth}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="3"
                                        value={maxDepth}
                                        onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                                    />
                                </div>
                                <button
                                    disabled={!webUrl || uploading}
                                    onClick={handleWebIngest}
                                    className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-3 font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crawl & Index'}
                                </button>
                            </div>
                        )}

                        {ingestType === 'git' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Repository URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://github.com/user/repo"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Branch</label>
                                    <input
                                        type="text"
                                        placeholder="main"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                                    />
                                </div>
                                <button
                                    disabled={!repoUrl || uploading}
                                    onClick={handleGitIngest}
                                    className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-3 font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Clone & Ingest'}
                                </button>
                            </div>
                        )}

                        {ingestType === 'notion' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Notion API Key</label>
                                    <input
                                        type="password"
                                        placeholder="secret_integration_token"
                                        value={notionApiKey}
                                        onChange={(e) => setNotionApiKey(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Database ID (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Notion database id"
                                        value={notionDatabaseId}
                                        onChange={(e) => setNotionDatabaseId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                                    />
                                </div>
                                <button
                                    disabled={!notionApiKey || uploading}
                                    onClick={async () => {
                                        setUploading(true);
                                        setStatus({ type: 'loading', message: 'Ingesting Notion...' });
                                        try {
                                            await chatApi.ingestNotion({ api_key: notionApiKey, database_id: notionDatabaseId });
                                            setStatus({ type: 'success', message: '✅ Notion ingestion started' });
                                            setNotionApiKey('');
                                            setNotionDatabaseId('');
                                        } catch (error) {
                                            setStatus({ type: 'error', message: `❌ ${error instanceof Error ? error.message : 'Notion ingestion failed'}` });
                                        } finally {
                                            setUploading(false);
                                            // Error messages now persist until user dismisses them
                                        }
                                    }}
                                    className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-3 font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingest Notion'}
                                </button>
                            </div>
                        )}

                        {ingestType === 'confluence' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Confluence Base URL</label>
                                    <input type="url" placeholder="https://your-domain.atlassian.net/wiki" value={confBaseUrl} onChange={(e) => setConfBaseUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="email" placeholder="user@example.com" value={confEmail} onChange={(e) => setConfEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                    <input type="password" placeholder="api token" value={confApiToken} onChange={(e) => setConfApiToken(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                </div>
                                <div className="flex gap-2">
                                    <select value={selectedConfluenceIntegration || ''} onChange={(e) => setSelectedConfluenceIntegration(e.target.value || null)} className="bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] rounded px-3 py-2 text-sm">
                                        <option value="">-- Use saved integration --</option>
                                        {integrations.filter(i => i.type === 'confluence').map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => loadIntegrations()} className="px-3 py-2 text-xs text-[var(--accent-primary)]">Refresh</button>
                                </div>
                                <button disabled={(!confBaseUrl && !selectedConfluenceIntegration) || (!confEmail && !selectedConfluenceIntegration && !confApiToken) || uploading} onClick={async () => {
                                    setUploading(true);
                                    setStatus({ type: 'loading', message: 'Submitting Confluence ingest...' });
                                    try {
                                        const source_params: any = {};
                                        if (selectedConfluenceIntegration) {
                                            source_params['integration_id'] = selectedConfluenceIntegration;
                                        } else {
                                            source_params['base_url'] = confBaseUrl;
                                            source_params['email'] = confEmail;
                                            source_params['api_token'] = confApiToken;
                                        }
                                        const res = await chatApi.ingestSubmit({ source_type: 'confluence', source_params });
                                        setStatus({ type: 'success', message: `Job submitted: ${res.job_id}` });
                                        setPollingJobId(res.job_id);
                                        // update jobs list
                                        setJobs(prev => [{ job_id: res.job_id, status: 'running', progress: 0, meta: { source_type: 'confluence' } }, ...prev].slice(0, 5));
                                        setConfBaseUrl(''); setConfEmail(''); setConfApiToken('');
                                    } catch (error) {
                                        setStatus({ type: 'error', message: `❌ ${error instanceof Error ? error.message : 'Confluence ingest failed'}` });
                                    } finally {
                                        setUploading(false);
                                        // Error messages now persist until user dismisses them
                                    }
                                }} className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-3 font-semibold transition-all shadow-lg flex items-center justify-center gap-2">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Confluence Ingest'}</button>
                            </div>
                        )}

                        {ingestType === 'sharepoint' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">SharePoint Site ID</label>
                                    <input type="text" placeholder="{tenant}.sharepoint.com,site-id" value={spSiteId} onChange={(e) => setSpSiteId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Access Token</label>
                                    <input type="password" placeholder="OAuth access token" value={spAccessToken} onChange={(e) => setSpAccessToken(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                </div>
                                <div className="flex gap-2">
                                    <select value={selectedSharepointIntegration || ''} onChange={(e) => setSelectedSharepointIntegration(e.target.value || null)} className="bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] rounded px-3 py-2 text-sm">
                                        <option value="">-- Use saved integration --</option>
                                        {integrations.filter(i => i.type === 'sharepoint').map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => loadIntegrations()} className="px-3 py-2 text-xs text-[var(--accent-primary)]">Refresh</button>
                                </div>
                                <button disabled={(!spSiteId && !selectedSharepointIntegration) || (!spAccessToken && !selectedSharepointIntegration) || uploading} onClick={async () => {
                                    setUploading(true);
                                    setStatus({ type: 'loading', message: 'Submitting SharePoint ingest...' });
                                    try {
                                        const source_params: any = {};
                                        if (selectedSharepointIntegration) {
                                            source_params['integration_id'] = selectedSharepointIntegration;
                                        } else {
                                            source_params['site_id'] = spSiteId;
                                            source_params['access_token'] = spAccessToken;
                                        }
                                        const res = await chatApi.ingestSubmit({ source_type: 'sharepoint', source_params });
                                        setStatus({ type: 'success', message: `Job submitted: ${res.job_id}` });
                                        setPollingJobId(res.job_id);
                                        setJobs(prev => [{ job_id: res.job_id, status: 'running', progress: 0, meta: { source_type: 'sharepoint' } }, ...prev].slice(0, 5));
                                        setSpSiteId(''); setSpAccessToken(''); setSelectedSharepointIntegration(null);
                                    } catch (error) {
                                        setStatus({ type: 'error', message: `❌ ${error instanceof Error ? error.message : 'SharePoint ingest failed'}` });
                                    } finally {
                                        setUploading(false);
                                        // Error messages now persist until user dismisses them
                                    }
                                }} className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-3 font-semibold transition-all shadow-lg flex items-center justify-center gap-2">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit SharePoint Ingest'}</button>
                            </div>
                        )}

                        {ingestType === 'database' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Host</label>
                                        <input type="text" placeholder="db.example.com" value={dbHost} onChange={(e) => setDbHost(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Port</label>
                                        <input type="number" placeholder="5432" value={dbPort} onChange={(e) => setDbPort(parseInt(e.target.value || '5432'))} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Database Name</label>
                                    <input type="text" placeholder="mydb" value={dbName} onChange={(e) => setDbName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" placeholder="user" value={dbUser} onChange={(e) => setDbUser(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                    <input type="password" placeholder="password" value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-neutral)] border border-[var(--border-main)] text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none" />
                                </div>
                                <button disabled={!dbHost || !dbName || uploading} onClick={async () => {
                                    setUploading(true);
                                    setStatus({ type: 'loading', message: 'Connecting to database...' });
                                    try {
                                        await chatApi.ingestDatabase({ host: dbHost, port: dbPort, database: dbName, user: dbUser, password: dbPassword });
                                        setStatus({ type: 'success', message: '✅ Database ingestion started' });
                                        setDbHost(''); setDbName(''); setDbUser(''); setDbPassword(''); setDbPort(5432);
                                    } catch (error) {
                                        setStatus({ type: 'error', message: `❌ ${error instanceof Error ? error.message : 'Database ingestion failed'}` });
                                    } finally {
                                        setUploading(false);
                                        // Error messages now persist until user dismisses them
                                    }
                                }} className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-3 font-semibold transition-all shadow-lg flex items-center justify-center gap-2">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingest Database'}</button>


                            </div>
                        )}                        </div>

                    {/* Job history panel - Always visible */}
                    <div className="pt-6 border-t border-[var(--border-main)]">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Ingest Jobs</p>
                            <button onClick={loadJobs} className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1" title="Refresh">
                                <RotateCw className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-auto">
                            {jobs.length === 0 && <p className="text-xs text-[var(--text-secondary)]">No recent jobs. Upload a file or ingest data to see jobs here.</p>}
                            {jobs.map(job => {
                                const statusIcon = job.status === 'completed' ? '✅' : job.status === 'failed' ? '❌' : job.status === 'running' ? '⏳' : '⏸️';
                                const statusColor = job.status === 'completed' ? 'text-green-500' : job.status === 'failed' ? 'text-red-500' : job.status === 'running' ? 'text-yellow-500' : 'text-[var(--text-secondary)]';
                                const sourceInfo = job.meta?.filename || job.meta?.url || job.meta?.repo_url || job.meta?.source_type || job.meta?.params?.source_type || 'unknown';
                                const resultInfo = job.result?.total_chunks ? `${job.result.total_chunks} chunks` : job.error ? 'Error' : '';

                                return (
                                    <div key={job.job_id} className={`flex items-center justify-between bg-[var(--bg-neutral)] p-3 rounded-lg border ${job.status === 'running' ? 'border-yellow-500/30' : 'border-[var(--border-main)]'}`}>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span>{statusIcon}</span>
                                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{sourceInfo}</p>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                {job.job_id.slice(0, 8)}... • {job.meta?.source_type || 'file'}
                                                {resultInfo && ` • ${resultInfo}`}
                                            </p>
                                        </div>
                                        <div className="text-right flex items-center gap-2 ml-2">
                                            <span className={`text-xs font-semibold ${statusColor}`}>{job.status}</span>
                                            {job.status === 'failed' && job.error && (
                                                <button onClick={() => alert(`Error: ${job.error}`)} className="text-xs text-red-400 hover:text-red-300">Details</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-[var(--bg-neutral)] flex justify-end gap-3 transition-colors duration-500 flex-shrink-0">
                <button
                    onClick={onClose}
                    className="px-6 py-2 border border-[var(--border-main)] text-[var(--text-secondary)] rounded-lg font-bold hover:bg-white/5 transition-all"
                >
                    Close
                </button>
            </div>
        </div>

    );
}