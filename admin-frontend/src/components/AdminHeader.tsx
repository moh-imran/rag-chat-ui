import React, { useState, useEffect } from 'react';
import { User, LogOut, Bell, Shield, X, Save, Loader2 } from 'lucide-react';
import { adminApi } from '../utils/api';

interface AdminHeaderProps {
  title?: string;
  onLogout?: () => void;
}

interface UserProfile {
  email: string;
  full_name?: string;
  role: string;
}

export default function AdminHeader({ title = 'Admin Panel', onLogout }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await adminApi.getCurrentUser(token);
      setProfile(data);
      setEditedProfile(data);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await adminApi.updateProfile(token, {
        full_name: editedProfile.full_name
      });

      setProfile(editedProfile);
      setSuccess('Profile updated successfully!');

      setTimeout(() => {
        setShowProfileModal(false);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      window.location.reload();
    }
  };

  return (
    <>
    <header className="glass-card border-b border-[var(--border-main)] sticky top-0 z-10">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Title Section */}
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage your RAG Chat system</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-primary)] rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors border border-[var(--border-main)]"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {profile?.full_name || profile?.email || 'Admin User'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] capitalize">{profile?.role || 'Administrator'}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl border border-[var(--border-main)] shadow-2xl z-20">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="text-sm text-[var(--text-primary)]">Profile</span>
                    </button>
                  </div>
                  <div className="border-t border-[var(--border-main)] p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-left group"
                    >
                      <LogOut className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-red-500" />
                      <span className="text-sm text-[var(--text-primary)] group-hover:text-red-500">
                        Sign Out
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Profile Update Modal */}
    {showProfileModal && editedProfile && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-panel p-6 rounded-xl max-w-md w-full border border-[var(--border-main)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Update Profile</h2>
            <button
              onClick={() => {
                setShowProfileModal(false);
                setError('');
                setSuccess('');
                setEditedProfile(profile);
              }}
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-2 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email
              </label>
              <input
                type="email"
                value={editedProfile.email}
                disabled
                className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={editedProfile.full_name || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Role
              </label>
              <input
                type="text"
                value={editedProfile.role}
                disabled
                className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] opacity-50 cursor-not-allowed capitalize"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">Role is managed by administrators</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:brightness-110 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setError('');
                  setSuccess('');
                  setEditedProfile(profile);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] text-[var(--text-secondary)] font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
