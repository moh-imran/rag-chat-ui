import { X, Sliders, Eye } from 'lucide-react';
import { ChatConfig, AdvancedOptions } from '../types';
import { AdvancedSettingsPanel } from './AdvancedSettingsPanel';

interface ChatSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: ChatConfig;
    onConfigChange: (config: ChatConfig) => void;
}

export default function ChatSettingsModal({
    isOpen,
    onClose,
    config,
    onConfigChange
}: ChatSettingsModalProps) {
    if (!isOpen) return null;

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
            <div className="w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-main)] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                            <Sliders className="w-5 h-5 text-[var(--accent-primary)]" />
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Chat Settings</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
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
                            <p className="text-[11px] text-[var(--text-secondary)]">Number of relevant documents to retrieve</p>
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
                            <p className="text-[11px] text-[var(--text-secondary)]">Lower = more focused, Higher = more creative</p>
                        </div>

                        <div className="pt-4 border-t border-[var(--border-main)]">
                            <label className="flex items-center justify-between cursor-pointer group mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-all ${config.showSources ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-[var(--bg-neutral)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                                        <Eye className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Source Citations</p>
                                        <p className="text-[11px] text-[var(--text-secondary)]">Display referenced documents in responses</p>
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
