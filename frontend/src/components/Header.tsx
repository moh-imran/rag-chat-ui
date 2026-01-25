import { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Settings, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import Logo from './Logo';
import { User } from '../types';

interface HeaderProps {
    user: User | null;
    onOpenProfile: () => void;
    onLogout: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

export default function Header({ user, onOpenProfile, onLogout, theme, onToggleTheme }: HeaderProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="glass-panel backdrop-blur-md border-b border-white/5 px-6 py-4 relative z-30">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                    <Logo size={48} className="opacity-90" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Congni RAG Assistant</h1>
                            <div className="flex h-1.5 w-1.5 relative mt-0.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/20"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </div>
                        </div>
                        <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold opacity-60">Neural Document Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={onToggleTheme}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>

                    {/* Profile Dropdown */}
                    {user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg border-none shadow-sm hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <UserIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                <span className="text-xs font-semibold text-[var(--text-primary)]">
                                    {user.full_name || user.email.split('@')[0]}
                                </span>
                                <ChevronDown className={`w-3 h-3 text-[var(--text-secondary)] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 min-w-[140px] glass-panel rounded-lg shadow-xl border border-[var(--border-main)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-1.5">
                                        <button
                                            onClick={() => {
                                                onOpenProfile();
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-white/5 rounded-md transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                                            Profile
                                        </button>
                                        <div className="my-1 border-t border-[var(--border-main)]" />
                                        <button
                                            onClick={() => {
                                                onLogout();
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-white/5 rounded-md transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 text-[var(--text-secondary)]" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
