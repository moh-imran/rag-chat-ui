import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';
import { Users, Search, Edit, Trash2, Key, Loader2, RefreshCw, X, Save } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
}

interface UserManagementProps {
  token: string;
}

export default function UserManagement({ token }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { limit: 100 };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;

      const data = await adminApi.listUsers(token, params);
      setUsers(data.users || data.items || data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter]);

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this user and all their associated data (conversations, messages)? This action cannot be undone.')) return;
    try {
      await adminApi.deleteUser(token, userId);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      await adminApi.updateUser(token, selectedUser.id, {
        full_name: selectedUser.full_name,
        role: selectedUser.role,
        is_active: selectedUser.is_active,
        is_admin: selectedUser.is_admin
      });
      setEditMode(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password for this user:');
    if (!newPassword) return;
    try {
      await adminApi.resetUserPassword(token, userId, newPassword);
      alert('Password reset successfully');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reset password');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'user' });

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      alert("Email and password are required");
      return;
    }
    try {
      await adminApi.createUser(token, newUser);
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'user' });
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">User Management</h1>
          <p className="text-[var(--text-secondary)]">Manage user accounts and permissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:brightness-110 text-white font-semibold transition-all">
            <Users className="w-4 h-4" />
            <span>Create User</span>
          </button>
          <button onClick={loadUsers} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>
      <div className="glass-panel p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
              <input type="text" placeholder="Search by email or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/50" />
            </div>
          </div>
          <div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all">
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>
      </div>
      {error && <div className="glass-panel p-4 rounded-xl border border-red-500/50 bg-red-500/10"><p className="text-red-500 text-sm">{error}</p></div>}
      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--text-secondary)]">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-[var(--border-main)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">{user.email}</div>
                        {user.full_name && <div className="text-sm text-[var(--text-secondary)]">{user.full_name}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'superadmin' ? 'bg-purple-500/10 text-purple-500' :
                        user.role === 'admin' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditMode(true);
                          }}
                          className="p-2 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-2 rounded-lg text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                          title="Reset password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete user permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        }
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-xl max-w-md w-full border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Create New User</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none" placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
                <input type="text" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleCreateUser} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:brightness-110 text-white font-semibold transition-all">
                  <Users className="w-4 h-4" />
                  Create User
                </button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] text-[var(--text-secondary)] font-semibold transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editMode && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-xl max-w-md w-full border border-[var(--border-main)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Edit User</h2>
              <button
                onClick={() => {
                  setEditMode(false);
                  setSelectedUser(null);
                }}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] opacity-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
                <input
                  type="text"
                  value={selectedUser.full_name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                  className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full bg-white/5 border border-[var(--border-main)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUser.is_active}
                    onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border-main)] bg-white/5 text-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUser.is_admin}
                    onChange={(e) => setSelectedUser({ ...selectedUser, is_admin: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border-main)] bg-white/5 text-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">Admin</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:brightness-110 text-white font-semibold transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-main)] text-[var(--text-secondary)] font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-4 rounded-xl text-sm text-[var(--text-secondary)]">
        <p>Showing {users.length} users</p>
      </div>
    </div>
  );
}
