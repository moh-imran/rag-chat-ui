import React, { useState, useEffect } from 'react';
import { Sliders, Eye, Save, RotateCcw, Zap, Database, Filter } from 'lucide-react';

interface ChatConfig {
    topK: number;
    temperature: number;
    showSources: boolean;
    useHyde: boolean;
    routingStrategy: 'auto' | 'all' | 'specific';
    selectedCollections: string[];
    metadataFilters: Record<string, string>;
}

interface ChatSettingsProps {
    token: string;
}

const DEFAULT_CONFIG: ChatConfig = {
    topK: 5,
    temperature: 0.7,
    showSources: false,
    useHyde: false,
    routingStrategy: 'auto',
    selectedCollections: [],
    metadataFilters: {},
};

const AVAILABLE_COLLECTIONS = ['documents', 'code', 'support', 'knowledge_base'];

export default function ChatSettings({ token }: ChatSettingsProps) {
    const [config, setConfig] = useState<ChatConfig>(DEFAULT_CONFIG);
    const [saved, setSaved] = useState(false);
    const [newFilterKey, setNewFilterKey] = useState('');
    const [newFilterValue, setNewFilterValue] = useState('');

    // Load saved config on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('chatConfig');
        if (savedConfig) {
            try {
                setConfig(JSON.parse(savedConfig));
            } catch (e) {
                console.error('Failed to load saved config');
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('chatConfig', JSON.stringify(config));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        localStorage.removeItem('chatConfig');
    };

    const addMetadataFilter = () => {
        if (newFilterKey && newFilterValue) {
            setConfig(prev => ({
                ...prev,
                metadataFilters: {
                    ...prev.metadataFilters,
                    [newFilterKey]: newFilterValue,
                },
            }));
            setNewFilterKey('');
            setNewFilterValue('');
        }
    };

    const removeMetadataFilter = (key: string) => {
        const { [key]: _, ...rest } = config.metadataFilters;
        setConfig(prev => ({ ...prev, metadataFilters: rest }));
    };

    const toggleCollection = (collection: string) => {
        const isSelected = config.selectedCollections.includes(collection);
        setConfig(prev => ({
            ...prev,
            selectedCollections: isSelected
                ? prev.selectedCollections.filter(c => c !== collection)
                : [...prev.selectedCollections, collection],
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Chat Settings</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Configure default RAG query parameters for all users
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--border-main)] text-[var(--text-secondary)] rounded-lg hover:bg-white/5 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            saved
                                ? 'bg-emerald-500 text-white'
                                : 'bg-[var(--accent-primary)] text-white hover:opacity-90'
                        }`}
                    >
                        <Save className="w-4 h-4" />
                        {saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Settings Card */}
                <div className="glass-card rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-main)]">
                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                            <Sliders className="w-5 h-5 text-[var(--accent-primary)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Basic Settings</h3>
                    </div>

                    {/* Top K */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                                Top K Results
                            </label>
                            <span className="text-sm font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">
                                {config.topK}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={config.topK}
                            onChange={(e) => setConfig(prev => ({ ...prev, topK: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                        />
                        <p className="text-xs text-[var(--text-secondary)]">
                            Number of relevant documents to retrieve for context
                        </p>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                                Temperature
                            </label>
                            <span className="text-sm font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">
                                {config.temperature.toFixed(1)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config.temperature}
                            onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                        />
                        <p className="text-xs text-[var(--text-secondary)]">
                            Lower = more focused responses, Higher = more creative
                        </p>
                    </div>

                    {/* Show Sources Toggle */}
                    <label className="flex items-center justify-between cursor-pointer p-4 bg-white/5 rounded-lg border border-[var(--border-main)]">
                        <div className="flex items-center gap-3">
                            <Eye className={`w-5 h-5 ${config.showSources ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                            <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">Show Source Citations</p>
                                <p className="text-xs text-[var(--text-secondary)]">Display referenced documents in responses</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.showSources}
                            onChange={(e) => setConfig(prev => ({ ...prev, showSources: e.target.checked }))}
                            className="w-5 h-5 rounded border-[var(--border-main)] bg-white/10 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                        />
                    </label>
                </div>

                {/* Advanced Settings Card */}
                <div className="glass-card rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-main)]">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Advanced Settings</h3>
                    </div>

                    {/* HyDE Toggle */}
                    <label className="flex items-center justify-between cursor-pointer p-4 bg-white/5 rounded-lg border border-[var(--border-main)]">
                        <div className="flex items-center gap-3">
                            <Zap className={`w-5 h-5 ${config.useHyde ? 'text-purple-400' : 'text-[var(--text-secondary)]'}`} />
                            <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">Use HyDE</p>
                                <p className="text-xs text-[var(--text-secondary)]">Hypothetical Document Embeddings for better retrieval</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.useHyde}
                            onChange={(e) => setConfig(prev => ({ ...prev, useHyde: e.target.checked }))}
                            className="w-5 h-5 rounded border-[var(--border-main)] bg-white/10 text-purple-400 focus:ring-purple-400"
                        />
                    </label>

                    {/* Routing Strategy */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Collection Routing Strategy
                        </label>
                        <select
                            value={config.routingStrategy}
                            onChange={(e) => setConfig(prev => ({ ...prev, routingStrategy: e.target.value as any }))}
                            className="w-full px-4 py-3 bg-white/5 border border-[var(--border-main)] rounded-lg text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                        >
                            <option value="auto">Auto (AI selects relevant collections)</option>
                            <option value="all">All Collections</option>
                            <option value="specific">Specific Collections</option>
                        </select>
                    </div>

                    {/* Collection Selection */}
                    {config.routingStrategy === 'specific' && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                                Select Collections
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_COLLECTIONS.map((collection) => (
                                    <button
                                        key={collection}
                                        onClick={() => toggleCollection(collection)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            config.selectedCollections.includes(collection)
                                                ? 'bg-[var(--accent-primary)] text-white'
                                                : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 border border-[var(--border-main)]'
                                        }`}
                                    >
                                        {collection}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Metadata Filters Card */}
                <div className="glass-card rounded-xl p-6 space-y-6 lg:col-span-2">
                    <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-main)]">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Filter className="w-5 h-5 text-amber-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Default Metadata Filters</h3>
                    </div>

                    {/* Existing Filters */}
                    {Object.entries(config.metadataFilters).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(config.metadataFilters).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-[var(--border-main)]"
                                >
                                    <span className="text-xs font-mono text-[var(--text-secondary)]">{key}:</span>
                                    <span className="text-xs font-mono text-[var(--text-primary)]">{value}</span>
                                    <button
                                        onClick={() => removeMetadataFilter(key)}
                                        className="text-red-400 hover:text-red-300 ml-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Filter */}
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Key (e.g., source)"
                            value={newFilterKey}
                            onChange={(e) => setNewFilterKey(e.target.value)}
                            className="flex-1 px-4 py-2 bg-white/5 border border-[var(--border-main)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)]"
                        />
                        <input
                            type="text"
                            placeholder="Value"
                            value={newFilterValue}
                            onChange={(e) => setNewFilterValue(e.target.value)}
                            className="flex-1 px-4 py-2 bg-white/5 border border-[var(--border-main)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)]"
                        />
                        <button
                            onClick={addMetadataFilter}
                            disabled={!newFilterKey || !newFilterValue}
                            className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Add Filter
                        </button>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                        Filter results by document metadata. These filters will be applied by default to all queries.
                    </p>
                </div>
            </div>
        </div>
    );
}
