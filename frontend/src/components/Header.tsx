import { Upload, Settings, Trash2, FileText, Loader2, LogOut, User as UserIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { chatApi } from '../utils/api';
import { UploadStatus, User } from '../types';

interface HeaderProps {
    onClearChat: () => void;
    onToggleSettings: () => void;
    onUploadStatusChange: (status: UploadStatus | null) => void;
    onLogout: () => void;
    user: User | null;
}

export default function Header({ onClearChat, onToggleSettings, onUploadStatusChange, onLogout, user }: HeaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        onUploadStatusChange({ type: 'loading', message: 'Uploading and processing...' });

        try {
            const data = await chatApi.uploadFile(file);

            onUploadStatusChange({
                type: 'success',
                message: `✅ Processed ${data.total_chunks} chunks from ${file.name}`,
            });

            setTimeout(() => onUploadStatusChange(null), 5000);
        } catch (error) {
            onUploadStatusChange({
                type: 'error',
                message: `❌ ${error instanceof Error ? error.message : 'Upload failed'}`,
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">RAG Assistant</h1>
                        <p className="text-xs text-slate-400">Ask questions about your documents</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        Upload Document
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.docx,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <button
                        onClick={onToggleSettings}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        aria-label="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <div className="h-4 w-px bg-slate-700 mx-1" />

                    {user && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700">
                            <UserIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-slate-200">
                                {user.full_name || user.email.split('@')[0]}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={onLogout}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        aria-label="Logout"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}