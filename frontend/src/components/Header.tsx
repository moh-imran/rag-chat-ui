import { User as UserIcon } from 'lucide-react';
import Logo from './Logo';
import { User } from '../types';

interface HeaderProps {
    user: User | null;
}

export default function Header({ user }: HeaderProps) {

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
                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg border-none shadow-sm">
                                <UserIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                <span className="text-xs font-semibold text-[var(--text-primary)]">
                                    {user.full_name || user.email.split('@')[0]}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}