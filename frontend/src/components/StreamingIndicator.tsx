import React from 'react';

interface StreamingIndicatorProps {
    status: string;
    isActive: boolean;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({ status, isActive }) => {
    if (!isActive || !status) return null;

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg mb-4">
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {status}
            </span>
        </div>
    );
};
