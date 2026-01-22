import React from 'react';
import { Source } from '../types';

interface SourceBadgeProps {
    source: Source;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
    const getSourceIcon = () => {
        const sourceType = source.metadata.source?.toLowerCase();
        if (sourceType?.includes('web')) return '🌐';
        if (sourceType?.includes('git')) return '🔧';
        if (sourceType?.includes('notion')) return '📝';
        if (sourceType?.includes('database')) return '🗄️';
        return '📄';
    };

    const getCollectionColor = (collection?: string) => {
        if (!collection) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

        const colors: Record<string, string> = {
            docs: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
            code: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
            support: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
        };

        return colors[collection] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    };

    const formatScore = (score: number) => {
        return (score * 100).toFixed(1);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
                {getSourceIcon()}
                <span className="font-medium">
                    {source.metadata.filename || source.metadata.url || 'Document'}
                </span>
            </span>

            {source.metadata.collection && (
                <span className={`px-2 py-1 rounded-full ${getCollectionColor(source.metadata.collection)}`}>
                    {source.metadata.collection}
                </span>
            )}

            <span className="text-gray-500 dark:text-gray-400">
                Relevance: {formatScore(source.score)}%
            </span>

            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[100px]">
                <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${formatScore(source.score)}%` }}
                />
            </div>
        </div>
    );
};
