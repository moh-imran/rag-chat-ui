import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle2, Trash2, Settings, Sliders, Eye, Database, Globe, Github } from 'lucide-react';
import { chatApi } from '../utils/api';
import { UploadStatus, ChatConfig, AdvancedOptions } from '../types';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';

interface DataSourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadStatusChange: (status: UploadStatus | null) => void;
    config: ChatConfig;
    onConfigChange: (config: ChatConfig) => void;
}

type IngestType = 'file' | 'web' | 'git';

export default function DataSourcesModal({
    isOpen,
    onClose,
    onUploadStatusChange,
    config,
    onConfigChange
}: DataSourcesModalProps) {
    const [activeTab, setActiveTab] = useState<'ingest' | 'configure'>('ingest');
    const [ingestType, setIngestType] = useState<IngestType>('file');

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

    if (!isOpen) return null;

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        onUploadStatusChange({ type: 'loading', message: `Uploading ${file.name}...` });

        try {
            const data = await chatApi.uploadFile(file);
            onUploadStatusChange({
                type: 'success',
                message: `✅ Processed ${data.total_chunks} chunks from ${file.name}`,
            });
            setTimeout(() => {
                onUploadStatusChange(null);
            }, 5000);
            setSelectedFile(null);
        } catch (error) {
            onUploadStatusChange({
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
        onUploadStatusChange({ type: 'loading', message: `Crawling ${webUrl}...` });

        try {
            await chatApi.ingestWeb({ url: webUrl, max_depth: maxDepth });
            onUploadStatusChange({
                type: 'success',
                message: `✅ Successfully ingested content from ${webUrl}`,
            });
            setTimeout(() => onUploadStatusChange(null), 5000);
            setWebUrl('');
        } catch (error) {
            onUploadStatusChange({
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
        onUploadStatusChange({ type: 'loading', message: `Cloning ${repoUrl}...` });

        try {
            await chatApi.ingestGit({ repo_url: repoUrl, branch });
            onUploadStatusChange({
                type: 'success',
                message: `✅ Successfully ingested repo ${repoUrl}`,
            });
            setTimeout(() => onUploadStatusChange(null), 5000);
            setRepoUrl('');
        } catch (error) {
            onUploadStatusChange({
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

    const handleAdvancedOptionsChange = (options: AdvancedOptions) => {
        onConfigChange({
            ...config,
            useHyde: options.useHyde,
            routingStrategy: options.routingStrategy,
            selectedCollections: options.selectedCollections,
            metadataFilters: options.metadataFilters
        });
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

                <div className="flex border-b border-[var(--border-main)] flex-shrink-0 text-slate-400">
                    <button
                        onClick={() => setActiveTab('ingest')}
                        className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'ingest' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Upload className="w-4 h-4" />
                        Ingestion
                    </button>
                    <button
                        onClick={() => setActiveTab('configure')}
                        className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'configure' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Settings className="w-4 h-4" />
                        Configuration
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'ingest' ? (
                        <div className="space-y-6">
                            <div className="flex p-1 bg-slate-800/40 rounded-lg gap-1 border border-white/5">
                                <button
                                    onClick={() => setIngestType('file')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${ingestType === 'file' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Files
                                </button>
                                <button
                                    onClick={() => setIngestType('web')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${ingestType === 'web' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    Web UI
                                </button>
                                <button
                                    onClick={() => setIngestType('git')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${ingestType === 'git' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Github className="w-3.5 h-3.5" />
                                    Git Repo
                                </button>
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
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
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
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Branch</label>
                                        <input
                                            type="text"
                                            placeholder="main"
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
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
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                                        <Sliders className="w-3.5 h-3.5" />
                                        Top K Results
                                    </label>
                                    <span className="text-sm font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded border border-[var(--accent-primary)]/20">
                                        {config.topK}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={config.topK}
                                    onChange={(e) => onConfigChange({ ...config, topK: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                                        <Sliders className="w-3.5 h-3.5" />
                                        Temperature
                                    </label>
                                    <span className="text-sm font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded border border-[var(--accent-primary)]/20">
                                        {config.temperature.toFixed(1)}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={config.temperature}
                                    onChange={(e) => onConfigChange({ ...config, temperature: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-[var(--bg-neutral)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] transition-all"
                                />
                            </div>

                            <div className="pt-4 border-t border-[var(--border-main)]">
                                <label className="flex items-center justify-between cursor-pointer group mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-all ${config.showSources ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-[var(--bg-neutral)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                                            <Eye className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">Source Citations</p>
                                            <p className="text-[11px] text-[var(--text-secondary)]">Display referenced documents.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={config.showSources}
                                        onChange={(e) => onConfigChange({ ...config, showSources: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--border-main)] bg-[var(--bg-neutral)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                    />
                                </label>

                                <AdvancedSettingsPanel
                                    options={{
                                        useHyde: !!config.useHyde,
                                        routingStrategy: config.routingStrategy || 'auto',
                                        selectedCollections: config.selectedCollections || [],
                                        metadataFilters: (config.metadataFilters as Record<string, string>) || {}
                                    }}
                                    onChange={handleAdvancedOptionsChange}
                                />
                            </div>
                        </div>
                    )}
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
        </div>
    );
}

