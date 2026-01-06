import { ChatConfig } from '../types';

interface SettingsPanelProps {
    config: ChatConfig;
    onConfigChange: (config: ChatConfig) => void;
}

export default function SettingsPanel({ config, onConfigChange }: SettingsPanelProps) {
    return (
        <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
            <div className="max-w-6xl mx-auto">
                <h3 className="text-sm font-semibold text-white mb-3">Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">
                            Top K Results: {config.topK}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={config.topK}
                            onChange={(e) =>
                                onConfigChange({ ...config, topK: parseInt(e.target.value) })
                            }
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Number of relevant documents to retrieve
                        </p>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 block mb-1">
                            Temperature: {config.temperature.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config.temperature}
                            onChange={(e) =>
                                onConfigChange({ ...config, temperature: parseFloat(e.target.value) })
                            }
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Higher = more creative, Lower = more focused
                        </p>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.showSources}
                                onChange={(e) =>
                                    onConfigChange({ ...config, showSources: e.target.checked })
                                }
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-300">Show source citations</span>
                        </label>
                        <p className="text-xs text-slate-500 mt-1 ml-6">
                            Display document sources with answers
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}