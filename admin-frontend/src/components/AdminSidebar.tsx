import React from 'react';
import { LayoutDashboard, Users, TrendingUp, MessageSquare, Plug, Briefcase, Activity, ChevronRight, Sliders, ThumbsUp } from 'lucide-react';
import Logo from './Logo';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg
        transition-all duration-200
        ${active
          ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
          : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] border border-transparent'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

interface AdminSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function AdminSidebar({ activeView, onNavigate }: AdminSidebarProps) {
  return (
    <aside className="w-64 glass-panel border-r border-[var(--border-main)] min-h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Admin Panel</h1>
            <p className="text-xs text-[var(--text-secondary)]">RAG Chat UI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={activeView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <NavItem
          icon={Users}
          label="User Management"
          active={activeView === 'users'}
          onClick={() => onNavigate('users')}
        />
        <NavItem
          icon={TrendingUp}
          label="Analytics"
          active={activeView === 'analytics'}
          onClick={() => onNavigate('analytics')}
        />
        <NavItem
          icon={MessageSquare}
          label="Conversations"
          active={activeView === 'conversations'}
          onClick={() => onNavigate('conversations')}
        />
        <NavItem
          icon={ThumbsUp}
          label="User Feedback"
          active={activeView === 'feedback'}
          onClick={() => onNavigate('feedback')}
        />
        <NavItem
          icon={Plug}
          label="Integrations"
          active={activeView === 'integrations'}
          onClick={() => onNavigate('integrations')}
        />

        <NavItem
          icon={Sliders}
          label="Chat Settings"
          active={activeView === 'settings'}
          onClick={() => onNavigate('settings')}
        />
        <NavItem
          icon={Activity}
          label="System Monitor"
          active={activeView === 'system'}
          onClick={() => onNavigate('system')}
        />
      </nav>
    </aside>
  );
}
