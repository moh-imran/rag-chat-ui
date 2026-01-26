import React, { useState } from 'react';
import { X, User, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../utils/api';
import { User as UserType } from '../types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserType | null;
    onUserUpdate: (user: UserType) => void;
}

export default function ProfileModal({ isOpen, onClose, user, onUserUpdate }: ProfileModalProps) {
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    if (!isOpen) return null;

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const updatedUser = await authApi.updateProfile(fullName);
            onUserUpdate(updatedUser);
            setSuccess('Profile updated successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await authApi.resetPassword(oldPassword, newPassword);
            setSuccess('Password updated successfully!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop-color)] backdrop-blur-md transition-all duration-500">
            <div className="w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-main)]">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Account Settings</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex border-b border-[var(--border-main)]">
                    <button
                        onClick={() => { setActiveTab('profile'); setError(null); setSuccess(null); }}
                        className={`flex-1 py-4 text-sm font-medium transition-all ${activeTab === 'profile' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => { setActiveTab('password'); setError(null); setSuccess(null); }}
                        className={`flex-1 py-4 text-sm font-medium transition-all ${activeTab === 'password' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Password
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            {success}
                        </div>
                    )}

                    {activeTab === 'profile' ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">Email (read-only)</label>
                                <div className="p-3 bg-[var(--bg-neutral)] border border-[var(--border-main)] rounded-lg text-[var(--text-secondary)] text-sm">
                                    {user?.email}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-[var(--bg-neutral)] border border-[var(--border-main)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all placeholder:text-[var(--text-secondary)]/30"
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-2.5 font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">Old Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        required
                                        className="w-full bg-[var(--bg-neutral)] border border-[var(--border-main)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full bg-[var(--bg-neutral)] border border-[var(--border-main)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full bg-[var(--bg-neutral)] border border-[var(--border-main)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-30 text-white rounded-lg py-2.5 font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
