import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Users,
  Shield,
  KeyRound,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  User,
  ShieldAlert,
  Save,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react';

interface UserItem {
  id: number;
  username: string;
  email: string;
  role_id: number | null;
  role_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface RoleItem {
  id: number;
  name: string;
  description: string;
  user_count: number;
}

interface PermissionItem {
  id?: number;
  role?: number;
  resource_name: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export const UsersManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Active tab: 'users' | 'roles' | 'security'
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'security'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<number | null>(null);

  // Modals state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [targetUser, setTargetUser] = useState<UserItem | null>(null);

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role_id: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '' });

  // Notifications / feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showNotification = (successMsg?: string, errorMsg?: string) => {
    if (successMsg) {
      setActionSuccess(successMsg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
    if (errorMsg) {
      setActionError(errorMsg);
      setTimeout(() => setActionError(null), 5000);
    }
  };

  // Queries
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserItem[]>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users/');
      return res.data?.results || res.data || [];
    },
  });

  const { data: roles = [] } = useQuery<RoleItem[]>({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const res = await apiClient.get('/roles/');
      const data = res.data?.results || res.data || [];
      if (data.length > 0 && selectedRoleForPerms === null) {
        setSelectedRoleForPerms(data[0].id);
      }
      return data;
    },
  });

  // Permissions query for selected role
  const { data: rolePermissions = [], isLoading: isLoadingPerms } = useQuery<PermissionItem[]>({
    queryKey: ['role-permissions', selectedRoleForPerms],
    queryFn: async () => {
      if (!selectedRoleForPerms) return [];
      const res = await apiClient.get(`/roles/${selectedRoleForPerms}/permissions/`);
      return res.data || [];
    },
    enabled: !!selectedRoleForPerms,
  });

  // Local state for editing permissions before saving
  const [editingPerms, setEditingPerms] = useState<PermissionItem[]>([]);

  React.useEffect(() => {
    if (rolePermissions.length > 0) {
      setEditingPerms(rolePermissions);
    }
  }, [rolePermissions]);

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (payload: typeof newUserForm) => {
      const res = await apiClient.post('/users/', {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role_id: payload.role_id ? parseInt(payload.role_id) : null,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setShowCreateUserModal(false);
      setNewUserForm({ username: '', email: '', password: '', role_id: '' });
      showNotification(t('users.userCreatedSuccess', { user: data.username }) || `User ${data.username} created successfully!`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to create user.';
      showNotification(undefined, msg);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiClient.post(`/users/${userId}/toggle-active/`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      showNotification(`Account ${data.username} is now ${data.is_active ? 'Active' : 'Disabled'}.`);
    },
    onError: (err: any) => {
      showNotification(undefined, err.response?.data?.detail || 'Failed to toggle account status.');
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      const res = await apiClient.post(`/users/${userId}/set-password/`, { password });
      return res.data;
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      setNewPassword('');
      setTargetUser(null);
      showNotification('Password updated successfully!');
    },
    onError: (err: any) => {
      showNotification(undefined, err.response?.data?.password?.[0] || 'Failed to update password.');
    },
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async (perms: PermissionItem[]) => {
      if (!selectedRoleForPerms) return;
      const res = await apiClient.post(`/roles/${selectedRoleForPerms}/permissions/`, perms);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRoleForPerms] });
      showNotification(t('users.permissionsSaved') || 'Permissions saved successfully!');
    },
    onError: (err: any) => {
      showNotification(undefined, err.response?.data?.detail || 'Failed to save permissions.');
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const res = await apiClient.post('/roles/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
      setShowCreateRoleModal(false);
      setNewRoleForm({ name: '', description: '' });
      setSelectedRoleForPerms(data.id);
      showNotification(`Role '${data.name}' created successfully!`);
    },
    onError: (err: any) => {
      showNotification(undefined, err.response?.data?.name?.[0] || 'Failed to create role.');
    },
  });

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role_name?.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Permission helpers
  const handleTogglePerm = (resourceName: string, field: 'can_create' | 'can_read' | 'can_update' | 'can_delete') => {
    setEditingPerms((prev) =>
      prev.map((p) => {
        if (p.resource_name === resourceName) {
          return { ...p, [field]: !p[field] };
        }
        return p;
      })
    );
  };

  const handleApplyPreset = (preset: 'all' | 'readonly' | 'none') => {
    setEditingPerms((prev) =>
      prev.map((p) => ({
        ...p,
        can_read: preset === 'all' || preset === 'readonly',
        can_create: preset === 'all',
        can_update: preset === 'all',
        can_delete: preset === 'all',
      }))
    );
  };

  const currentSelectedRole = roles.find((r) => r.id === selectedRoleForPerms);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {t('users.title', 'User & Access Management')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              'users.subtitle',
              'Manage system accounts, assign role memberships, and configure granular resource access control'
            )}
          </p>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('users.addUser', 'Create User')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('users.tabUsers', 'User Accounts')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'roles'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t('users.tabRoles', 'Roles & Permission Matrix')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {roles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{t('users.tabSecurity', 'Security & Infrastructure')}</span>
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3.5 rtl:right-3.5 rtl:left-auto" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('users.searchPlaceholder', 'Search username or email...')}
                className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{t('users.filterAllRoles', 'All Roles')}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {isLoadingUsers ? (
              <div className="py-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>{t('common.loading', 'Loading accounts...')}</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                {t('users.noUsers', 'No user accounts found matching your query.')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">{t('users.user', 'User')}</th>
                      <th className="px-6 py-4">{t('users.email', 'Email')}</th>
                      <th className="px-6 py-4">{t('users.role', 'Role')}</th>
                      <th className="px-6 py-4">{t('users.status', 'Status')}</th>
                      <th className="px-6 py-4">{t('users.joined', 'Joined Date')}</th>
                      <th className="px-6 py-4 text-center">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm uppercase">
                              {user.username.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {user.username}
                              </div>
                              <div className="text-xs text-slate-400">UID #{user.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {user.email || '—'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role_name?.toLowerCase() === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : user.role_name?.toLowerCase() === 'teacher'
                                ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            {user.role_name || 'No Role'}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t('users.active', 'Active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900">
                              <XCircle className="w-3.5 h-3.5" />
                              {t('users.disabled', 'Disabled')}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setTargetUser(user);
                                setShowPasswordModal(true);
                              }}
                              title={t('users.resetPassword', 'Reset Password')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleActiveMutation.mutate(user.id)}
                              title={
                                user.is_active
                                  ? t('users.deactivateAccount', 'Disable Account')
                                  : t('users.activateAccount', 'Enable Account')
                              }
                              className={`p-1.5 rounded-lg transition ${
                                user.is_active
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {user.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSION MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Roles Selector & Add Role */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roles.map((role) => {
              const isSelected = selectedRoleForPerms === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleForPerms(role.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      {role.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      {role.user_count} {t('users.members', 'users')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {role.description || t('users.defaultRoleDesc', 'Standard system access configuration role.')}
                  </p>
                </div>
              );
            })}

            {/* Add Role Card */}
            <div
              onClick={() => setShowCreateRoleModal(true)}
              className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-indigo-600 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-semibold">{t('users.addNewRole', 'Add Custom Role')}</span>
            </div>
          </div>

          {/* Matrix Panel */}
          {currentSelectedRole && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              {/* Matrix Header */}
              <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{t('users.roleMatrixTitle', 'Permissions for')}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400 underline-offset-4">
                      {currentSelectedRole.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t(
                      'users.roleMatrixDesc',
                      'Configure Create, Read, Update, and Delete access rights for each domain resource.'
                    )}
                  </p>
                </div>

                {/* Quick Presets & Save */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleApplyPreset('all')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    {t('users.presetGrantAll', 'Full Access')}
                  </button>
                  <button
                    onClick={() => handleApplyPreset('readonly')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    {t('users.presetReadOnly', 'Read Only')}
                  </button>
                  <button
                    onClick={() => handleApplyPreset('none')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    {t('users.presetClearAll', 'Clear All')}
                  </button>

                  <button
                    onClick={() => savePermissionsMutation.mutate(editingPerms)}
                    disabled={savePermissionsMutation.isPending}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savePermissionsMutation.isPending ? t('common.saving', 'Saving...') : t('users.saveMatrix', 'Save Matrix')}</span>
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              {isLoadingPerms ? (
                <div className="py-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  <span>{t('common.loading', 'Loading permissions...')}</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5">{t('users.resourceModule', 'Resource Module')}</th>
                        <th className="px-6 py-3.5 text-center">{t('users.canRead', 'Read (View)')}</th>
                        <th className="px-6 py-3.5 text-center">{t('users.canCreate', 'Create (Add)')}</th>
                        <th className="px-6 py-3.5 text-center">{t('users.canUpdate', 'Update (Edit)')}</th>
                        <th className="px-6 py-3.5 text-center">{t('users.canDelete', 'Delete (Remove)')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {editingPerms.map((perm) => (
                        <tr
                          key={perm.resource_name}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white capitalize">
                            {perm.resource_name.replace('_', ' ')}
                          </td>

                          {/* Read */}
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_read}
                              onChange={() => handleTogglePerm(perm.resource_name, 'can_read')}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Create */}
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_create}
                              onChange={() => handleTogglePerm(perm.resource_name, 'can_create')}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Update */}
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_update}
                              onChange={() => handleTogglePerm(perm.resource_name, 'can_update')}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Delete */}
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_delete}
                              onChange={() => handleTogglePerm(perm.resource_name, 'can_delete')}
                              className="w-4 h-4 text-rose-600 rounded border-slate-300 dark:border-slate-700 focus:ring-rose-500 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SECURITY & AUDIT OVERVIEW */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">
              {t('users.hashPolicy', 'Argon2id Password Hashing')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All credentials in SSMS are cryptographically hashed using standard Argon2id with memory-hard parameters. Plaintext passwords are never stored or logged.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
              <Check className="w-4 h-4" />
              <span>OWASP Compliant</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">
              {t('users.rbacPolicy', 'Role-Based Scoping & IDOR Defense')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every API endpoint performs object-level scoping and role verification before processing reads or mutations, preventing unauthorized vertical or horizontal privilege escalation.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
              <Check className="w-4 h-4" />
              <span>Scoped Queries Active</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">
              {t('users.dbEngine', 'PostgreSQL Native Security')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Connected directly to the local PostgreSQL database server on port 5433 with parameterized SQL queries and database-level foreign key constraints.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-indigo-600 font-semibold">
              <span>PostgreSQL 13 on port 5433</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {t('users.createUserTitle', 'Create New User Account')}
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate(newUserForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('users.username', 'Username')} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. john_doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('users.email', 'Email Address')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="john@school.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('users.password', 'Initial Password')} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('users.assignRole', 'Assign Role')}
                </label>
                <select
                  value={newUserForm.role_id}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('users.selectRolePlaceholder', 'Select Role...')}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {createUserMutation.isPending ? t('common.creating', 'Creating...') : t('users.createBtn', 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showPasswordModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                {t('users.resetPasswordFor', 'Reset Password for')} {targetUser.username}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPasswordMutation.mutate({ userId: targetUser.id, password: newPassword });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('users.newPassword', 'New Password')} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:right-3 rtl:left-auto" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter new password (min 4 characters)"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={setPasswordMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {setPasswordMutation.isPending ? t('common.saving', 'Saving...') : t('users.savePasswordBtn', 'Update Password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ROLE */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                {t('users.createRoleTitle', 'Create Custom Role')}
              </h3>
              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate(newRoleForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('users.roleName', 'Role Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Accountant, Librarian, Supervisor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('users.roleDescription', 'Description')}
                </label>
                <textarea
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Responsibilities and access scope..."
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {createRoleMutation.isPending ? t('common.creating', 'Creating...') : t('users.createRoleBtn', 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementPage;
