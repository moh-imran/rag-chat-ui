import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { UploadStatus } from '../types';

interface UploadStatusBarProps {
    status: UploadStatus;
}

export default function UploadStatusBar({ status }: UploadStatusBarProps) {
    const styles = {
        loading: 'bg-blue-500/20 text-blue-400',
        success: 'bg-green-500/20 text-green-400',
        error: 'bg-red-500/20 text-red-400',
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