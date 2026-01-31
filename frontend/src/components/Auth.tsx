import React, { useState } from 'react';
import { authApi } from '../utils/api';
import { LogIn, Loader2 } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
    onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authApi.login(email, password);
            onAuthSuccess();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center mesh-bg px-4 transition-colors duration-500">
            <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl border border-[var(--border-main)] shadow-2xl relative z-10">
                <div className="text-center">
                    <div className="flex flex-col items-center mb-8">
                        <Logo size={64} className="mb-4" />
                        <h1 className="text-2xl font-bold text-[var(--accent-primary)] mb-1">Congni RAG Assistant</h1>
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-bold opacity-70">Neural Document Intelligence</p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                            Welcome back
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Enter your credentials to access your chats
                        </p>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                Email address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--accent-primary)] hover:brightness-110 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
