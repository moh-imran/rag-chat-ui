import React, { useState } from 'react';
import { authApi } from '../utils/api';
import { LogIn, Loader2, ArrowLeft, Send } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
    onAuthSuccess: (token: string) => void;
}

type AuthView = 'login' | 'forgot-password';

export default function Auth({ onAuthSuccess }: AuthProps) {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (view === 'login') {
                const data = await authApi.login(email, password);
                // Store token in localStorage
                localStorage.setItem('token', data.access_token);
                onAuthSuccess(data.access_token);
            } else if (view === 'forgot-password') {
                await authApi.forgotPassword(email);
                setResetSent(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const renderHeader = () => {
        if (view === 'forgot-password') {
            return {
                title: 'Reset Password',
                subtitle: 'Enter your email to receive reset instructions'
            };
        }
        return {
            title: 'Admin Access',
            subtitle: 'Sign in to access the administration panel'
        };
    };

    const headerText = renderHeader();

    return (
        <div className="min-h-screen flex items-center justify-center mesh-bg px-4 transition-colors duration-500">
            <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl border border-[var(--border-main)] shadow-2xl relative z-10">
                <div className="text-center">
                    <div className="flex flex-col items-center mb-8">
                        <Logo size={64} className="mb-4" />
                        <h1 className="text-2xl font-bold text-[var(--accent-primary)] mb-1">Admin Panel</h1>
                        <p className="text-sm text-[var(--text-secondary)]">RAG Chat UI Administration</p>
                    </div>

                    {view === 'forgot-password' && (
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                                {headerText.title}
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {headerText.subtitle}
                            </p>
                        </div>
                    )}
                </div>

                {resetSent && view === 'forgot-password' ? (
                    <div className="text-center space-y-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-4 rounded-lg">
                            <Send className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">Check your email</p>
                            <p className="text-sm opacity-90 mt-1">
                                If an account exists for {email}, we have sent password reset instructions.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setView('login');
                                setResetSent(false);
                                setError(null);
                            }}
                            className="text-[var(--accent-primary)] hover:underline text-sm"
                        >
                            Back to Sign in
                        </button>
                    </div>
                ) : (
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
                                    placeholder="admin@company.com"
                                />
                            </div>

                            {view !== 'forgot-password' && (
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
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--accent-primary)] hover:brightness-110 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : view === 'login' ? (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    <span>Sign In</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Send Reset Link</span>
                                </>
                            )}
                        </button>
                    </form>
                )}

                {!resetSent && (
                    <div className="mt-0 flex flex-col items-center justify-center gap-y-2 text-sm">
                        {view === 'login' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setView('forgot-password');
                                    setError(null);
                                }}
                                className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
                            >
                                Forgot password?
                            </button>
                        )}

                        {view === 'forgot-password' && (
                            <button
                                onClick={() => {
                                    setView('login');
                                    setError(null);
                                }}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign in
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
