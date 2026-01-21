import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { UploadStatus } from '../types';

interface UploadStatusBarProps {
    status: UploadStatus;
}

export default function UploadStatusBar({ status }: UploadStatusBarProps) {
    const styles = {
        loading: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm',
        success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm',
        error: 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm',
    };

    const Icon = {
        loading: Loader2,
        success: CheckCircle,
        error: AlertCircle,
    }[status.type];

    return (
        <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${styles[status.type]}`}>
            <Icon className={`w-4 h-4 ${status.type === 'loading' ? 'animate-spin' : ''}`} />
            <span className="text-sm">{status.message}</span>
        </div>
    );
}