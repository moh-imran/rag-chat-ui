import React, { useState } from 'react';
import { AdvancedOptions } from '../types';

interface AdvancedSettingsPanelProps {
    options: AdvancedOptions;
    onChange: (options: AdvancedOptions) => void;
    availableCollections?: string[];
}

export const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({
    options,
    onChange,
    availableCollections = ['documents', 'docs', 'code', 'support'],
}) => {
    const [newFilterKey, setNewFilterKey] = useState('');
    const [newFilterValue, setNewFilterValue] = useState('');

    const addMetadataFilter = () => {
        if (newFilterKey && newFilterValue) {
            onChange({
                ...options,
                metadataFilters: {
                    ...options.metadataFilters,
                    [newFilterKey]: newFilterValue,
                },
            });
            setNewFilterKey('');
            setNewFilterValue('');
        }
    };

    const removeMetadataFilter = (key: string) => {
        const { [key]: _, ...rest } = options.metadataFilters;
        onChange({ ...options, metadataFilters: rest });
    };

    const toggleCollection = (collection: string) => {
        const isSelected = options.selectedCollections.includes(collection);
        onChange({
            ...options,
            selectedCollections: isSelected
                ? options.selectedCollections.filter(c => c !== collection)
                : [...options.selectedCollections, collection],
        });
    };

    return (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Advanced Query Options
            </h3>

            {/* HyDE Toggle */}
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    id="use-hyde"
                    checked={options.useHyde}
                    onChange={(e) => onChange({ ...options, useHyde: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                    <label htmlFor="use-hyde" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Use HyDE (Hypothetical Document Embeddings)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Improves retrieval quality for complex queries by generating hypothetical answers first
                    </p>
                </div>
            </div>

            {/* Routing Strategy */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Collection Routing Strategy
                </label>
                <select
                    value={options.routingStrategy}
                    onChange={(e) => onChange({ ...options, routingStrategy: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="auto">🤖 Auto (AI selects relevant collections)</option>
                    <option value="all">📚 All Collections</option>
                    <option value="specific">🎯 Specific Collections</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {options.routingStrategy === 'auto' && 'AI analyzes your query to select the most relevant collections'}
                    {options.routingStrategy === 'all' && 'Search across all available collections'}
                    {options.routingStrategy === 'specific' && 'Manually select which collections to search'}
                </p>
            </div>

            {/* Collection Selection (for specific strategy) */}
            {options.routingStrategy === 'specific' && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Collections
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {availableCollections.map((collection) => (
                            <button
                                key={collection}
                                onClick={() => toggleCollection(collection)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${options.selectedCollections.includes(collection)
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {collection}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Metadata Filters */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Metadata Filters
                </label>

                {/* Existing Filters */}
                {Object.entries(options.metadataFilters).length > 0 && (
                    <div className="space-y-2 mb-2">
                        {Object.entries(options.metadataFilters).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{key}:</span>
                                <span className="text-xs font-mono text-gray-800 dark:text-gray-200 flex-1">{value}</span>
                                <button
                                    onClick={() => removeMetadataFilter(key)}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Filter */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Key (e.g., filename)"
                        value={newFilterKey}
                        onChange={(e) => setNewFilterKey(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        value={newFilterValue}
                        onChange={(e) => setNewFilterValue(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={addMetadataFilter}
                        disabled={!newFilterKey || !newFilterValue}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Filter results by document metadata (e.g., filename, type, source)
                </p>
            </div>
        </div>
    );
};
