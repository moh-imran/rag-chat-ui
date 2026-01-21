import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle2, Trash2, Settings, Sliders, Eye, Database } from 'lucide-react';
import { chatApi } from '../utils/api';
import { UploadStatus, ChatConfig } from '../types';

interface DataSourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadStatusChange: (status: UploadStatus | null) => void;
    config: ChatConfig;
    onConfigChange: (config: ChatConfig) => void;
}

export default function DataSourcesModal({
    isOpen,
    onClose,
    onUploadStatusChange,
    config,
    onConfigChange
}: DataSourcesModalProps) {
    const [activeTab, setActiveTab] = useState<'ingest' | 'configure'>('ingest');

    // Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
            <div className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-main)]">
                    <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                        <Database className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Data Sources</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex border-b border-[var(--border-main)]">
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

                <div className="p-6">
                    {activeTab === 'ingest' ? (
                        <div className="space-y-6">
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
                                    max="10"
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
                                <label className="flex items-center justify-between cursor-pointer group">
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
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-[var(--bg-neutral)] flex justify-end gap-3 transition-colors duration-500">
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
