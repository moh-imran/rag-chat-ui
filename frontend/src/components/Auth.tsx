import React, { useState } from 'react';
import { authApi } from '../utils/api';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

interface AuthProps {
    onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await authApi.login(email, password);
            } else {
                await authApi.register(email, password, fullName);
                await authApi.login(email, password);
            }
            onAuthSuccess();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="max-w-md w-full space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        {isLogin
                            ? 'Enter your credentials to access your chats'
                            : 'Sign up to start preserving your conversations'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Email address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="name@company.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isLogin ? (
                            <>
                                <LogIn className="w-5 h-5" />
                                <span>Sign In</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                <span>Register</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        {isLogin
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
