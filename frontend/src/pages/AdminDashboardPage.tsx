import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Calendar,
  Download,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Activity,
  Server,
  Database,
  Layers,
  Sparkles,
  Eye,
  X,
  KeyRound,
  Check,
  Send,
  AlertCircle,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { useAuth } from '../store/authStore';

export const AdminDashboardPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  
  // Navigation Tabs: 'OVERVIEW' | 'USERS' | 'AUDIT' | 'HEALTH'
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'AUDIT' | 'HEALTH'>('OVERVIEW');

  // Stats & Health
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users Management State
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // User Detail Drawer State
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [activeUserTarget, setActiveUserTarget] = useState<any>(null);

  // Form States
  const [createForm, setCreateForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'FREE',
    password: '',
  });
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    role: 'FREE',
    is_active: true,
  });
  const [selectedNewRole, setSelectedNewRole] = useState('FREE');

  // Action Loading & Feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load platform stats & health
  const fetchStatsAndHealth = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        apiFetch<any>('/admin/stats'),
        apiFetch<any>('/admin/system-health'),
      ]);
      setStats(statsRes.data);
      setHealth(healthRes.data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load paginated users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: String(pageSize),
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });
      const res = await apiFetch<any>(`/admin/users?${params.toString()}`);
      setUsers(res.data.items || []);
      setTotalUsers(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err: any) {
      setFeedbackMsg({ type: 'ERROR', text: err.message || 'Failed to fetch users' });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load paginated audit logs
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const params = new URLSearchParams({
        page: String(auditPage),
        page_size: '15',
        action: auditActionFilter,
      });
      const res = await apiFetch<any>(`/admin/audit-logs?${params.toString()}`);
      setAuditLogs(res.data.items || []);
      setAuditTotal(res.data.total || 0);
      setAuditPages(res.data.total_pages || 1);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchStatsAndHealth();
  }, []);

  useEffect(() => {
    if (activeTab === 'USERS') {
      fetchUsers();
    } else if (activeTab === 'AUDIT') {
      fetchAuditLogs();
    }
  }, [activeTab, currentPage, pageSize, debouncedSearch, roleFilter, statusFilter, auditPage, auditActionFilter]);

  // Open User Detail Drawer
  const handleOpenDetail = async (userId: string) => {
    setLoadingDetail(true);
    setSelectedUserDetail(null);
    try {
      const res = await apiFetch<any>(`/admin/users/${userId}`);
      setSelectedUserDetail(res.data);
    } catch (err: any) {
      setFeedbackMsg({ type: 'ERROR', text: err.message || 'Failed to load user details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Create User Submit
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      setFeedbackMsg({ type: 'SUCCESS', text: `User ${createForm.email} created successfully.` });
      setIsCreateModalOpen(false);
      setCreateForm({ email: '', full_name: '', phone: '', role: 'FREE', password: '' });
      fetchUsers();
      fetchStatsAndHealth();
    } catch (err: any) {
      setFeedbackMsg({ type: 'ERROR', text: err.message || 'Failed to create user.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Edit User Submit
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserTarget) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      await apiFetch(`/admin/users/${activeUserTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setFeedbackMsg({ type: 'SUCCESS', text: `User ${activeUserTarget.email} updated successfully.` });
      setIsEditModalOpen(false);
      fetchUsers();
      if (selectedUserDetail?.id === activeUserTarget.id) {
        handleOpenDetail(activeUserTarget.id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'ERROR', text: err.message || 'Failed to update user.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Change Role Submit
  const handleChangeRoleSubmit = async () => {
    if (!activeUserTarget) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      await apiFetch(`/admin/users/${activeUserTarget.id}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: selectedNewRole }),
      });
      setFeedbackMsg({ type: 'SUCCESS', text: `Role for ${activeUserTarget.email} changed to ${selectedNewRole}.` });
      setIsRoleModalOpen(false);
      fetchUsers();
      fetchStatsAndHealth();
    } catch (err: any) {
      setFeedbackMsg({ type: 'ERROR', text: err.message || 'Failed to change role.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Status Submit
  const handleToggleStatusSubmit = async () => {
    if (!activeUserTarget) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    const newStatus = !activeUserTarget.is_active;
    try {
      await apiFetch(`/admin/users/${activeUserTarget.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ is_active: newStatus }),
      });
      const statusLabel = newStatus ? 'activated' : 'deactivated';
      setFeedbackMsg({ type: 'SUCCESS', text: `User ${activeUserTarget.email} ${statusLabel}.` });
      setIsStatusModalOpen(false);
      fetchUsers();
      fetchStatsAndHealth();
    } catch (err: any) {
      setFeedbackMsg({ type: 'ERROR', text: err.message || 'Failed to update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Soft Delete User Submit
  const handleDeleteUserSubmit = async () => {
    if (!activeUserTarget) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      await apiFetch(`/admin/users/${activeUserTarget.id}`, {
        method: 'DELETE',
      });
      setFeedbackMsg({ type: 'SUCCESS', text: `User ${activeUserTarget.email} was soft-deleted.` });
      setIsDeleteModalOpen(false);
      if (selectedUserDetail?.id === activeUserTarget.id) {
        setSelectedUserDetail(null);
      }
      fetchUsers();
      fetchStatsAndHealth();
    } catch (err: any) {
      setFeedbackMsg({ type: 'ERROR', text: err.message || 'Failed to delete user.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Export Users CSV
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('nimantran_access_token');
      const response = await fetch('/api/v1/admin/export-users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download CSV');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nimantran_users_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setFeedbackMsg({ type: 'ERROR', text: 'Failed to export CSV.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      
      {/* 🌟 1. ADMIN EXECUTIVE HEADER 🌟 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-amber-300/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Shield className="w-4 h-4 text-amber-400" /> NIMANTRAN AI • EXECUTIVE ADMIN CONSOLE
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            System Administration
          </h1>
          <p className="text-xs text-slate-300">
            Platform governance, user management, role-based access controls, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Badge */}
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Postgres & Redis Live</span>
          </span>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-all flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => {
              fetchStatsAndHealth();
              if (activeTab === 'USERS') fetchUsers();
              if (activeTab === 'AUDIT') fetchAuditLogs();
            }}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-md animate-in fade-in duration-200 ${
            feedbackMsg.type === 'SUCCESS'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 🌟 2. NAVIGATION TABS BAR 🌟 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { id: 'OVERVIEW', label: '📊 Platform Overview', icon: Activity },
          { id: 'USERS', label: '👥 User Management & RBAC', icon: Users },
          { id: 'AUDIT', label: '📜 Audit Logs', icon: Layers },
          { id: 'HEALTH', label: '⚙️ System Health', icon: Server },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 🌟 TAB 1: PLATFORM OVERVIEW 🌟 */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top KPI Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-300/20 space-y-2">
              <span className="text-[11px] font-mono font-bold text-amber-300 uppercase block">
                Total Users
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-white">
                {stats?.total_users ?? 0}
              </div>
              <span className="text-[10px] text-slate-400">Registered platform accounts</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase block">
                Active Users
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-emerald-300">
                {stats?.active_users ?? 0}
              </div>
              <span className="text-[10px] text-slate-400">Currently active status</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 space-y-2">
              <span className="text-[11px] font-mono font-bold text-purple-400 uppercase block">
                Pro & Hosts
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-purple-300">
                {stats?.pro_users ?? 0}
              </div>
              <span className="text-[10px] text-slate-400">Active Pro subscriptions</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase block">
                Free Users
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-cyan-300">
                {stats?.free_users ?? 0}
              </div>
              <span className="text-[10px] text-slate-400">Free tier accounts</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 space-y-2">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase block">
                Total Events
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-white">
                {stats?.total_events ?? 0}
              </div>
              <span className="text-[10px] text-slate-400">Celebrations created</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-rose-500/30 space-y-2">
              <span className="text-[11px] font-mono font-bold text-rose-400 uppercase block">
                Invites Shared
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-rose-300">
                {stats?.total_invitations_shared ?? 0}
              </div>
              <span className="text-[10px] text-slate-400">Total guest invitations</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-teal-500/30 space-y-2">
              <span className="text-[11px] font-mono font-bold text-teal-400 uppercase block">
                Total RSVPs
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-teal-300">
                {stats?.total_rsvps ?? 0}
              </div>
              <span className="text-[10px] text-slate-400">Guest responses logged</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
              <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase block">
                Admin Accounts
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-extrabold text-indigo-300">
                {stats?.admin_users ?? 0}
              </div>
              <span className="text-[10px] text-slate-400">Privileged supervisors</span>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-amber-300/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="font-serif text-2xl font-bold text-white">
                Manage Platform Users & Permissions
              </h3>
              <p className="text-xs text-slate-300">
                Search accounts, change role tiers, activate/deactivate accounts, and inspect audit logs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('USERS')}
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Go to User Management →</span>
            </button>
          </div>
        </div>
      )}

      {/* 🌟 TAB 2: USER MANAGEMENT & RBAC 🌟 */}
      {activeTab === 'USERS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Controls Bar: Search, Role Filter, Status Filter, Create Button */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-300/20 space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email or phone..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters & Create User */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Role Filter */}
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] font-mono">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900">All Roles</option>
                    <option value="ADMIN" className="bg-slate-900">ADMIN</option>
                    <option value="SUPER" className="bg-slate-900">SUPER</option>
                    <option value="PRO" className="bg-slate-900">PRO / HOST</option>
                    <option value="FREE" className="bg-slate-900">FREE</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] font-mono">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900">All Status</option>
                    <option value="ACTIVE" className="bg-slate-900">Active</option>
                    <option value="INACTIVE" className="bg-slate-900">Inactive</option>
                  </select>
                </div>

                {/* Create User Button */}
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Create User</span>
                </button>
              </div>
            </div>
          </div>

          {/* User Table (Desktop & Tablet) */}
          <div className="rounded-3xl bg-slate-900/90 border border-amber-300/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-amber-300 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Login</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-serif italic">
                        Loading platform users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-serif italic">
                        No users found matching current search or filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u.id === currentAdmin?.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{u.full_name}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                            {u.phone && <div className="text-[10px] text-slate-500 font-mono">{u.phone}</div>}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : u.role === 'SUPER'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                  : u.role === 'PRO' || u.role === 'HOST'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.is_active
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-[11px] text-slate-400">
                            {u.last_login_at
                              ? new Date(u.last_login_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'Never'}
                          </td>

                          <td className="p-4 font-mono text-[11px] text-slate-400">
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(u.id)}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-300" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveUserTarget(u);
                                  setEditForm({
                                    full_name: u.full_name,
                                    phone: u.phone || '',
                                    role: u.role,
                                    is_active: u.is_active,
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit User"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Change Role */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveUserTarget(u);
                                  setSelectedNewRole(u.role);
                                  setIsRoleModalOpen(true);
                                }}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors"
                                title="Change Role"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Status */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveUserTarget(u);
                                  setIsStatusModalOpen(true);
                                }}
                                className={`p-2 rounded-xl transition-colors ${
                                  u.is_active
                                    ? 'bg-rose-950/40 hover:bg-rose-900 text-rose-300'
                                    : 'bg-emerald-950/40 hover:bg-emerald-900 text-emerald-300'
                                }`}
                                title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>

                              {/* Soft Delete */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveUserTarget(u);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900 text-rose-400 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <span className="text-slate-400">
                Showing {users.length} of {totalUsers} total users (Page {currentPage} of {totalPages})
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-slate-900 rounded-xl font-mono text-amber-300 font-bold">
                  {currentPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 TAB 3: AUDIT LOGS 🌟 */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-300/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Platform Security Audit Trail</h3>
              <p className="text-xs text-slate-300">
                Chronological log of logins, role adjustments, status changes, and administration events.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Action Filter:</span>
              <select
                value={auditActionFilter}
                onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="USER_LOGIN">USER_LOGIN</option>
                <option value="USER_REGISTER">USER_REGISTER</option>
                <option value="USER_CREATE">USER_CREATE</option>
                <option value="USER_UPDATE">USER_UPDATE</option>
                <option value="ROLE_CHANGE">ROLE_CHANGE</option>
                <option value="USER_ACTIVATE">USER_ACTIVATE</option>
                <option value="USER_DEACTIVATE">USER_DEACTIVATE</option>
                <option value="USER_DELETE">USER_DELETE</option>
                <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
              </select>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900/90 border border-amber-300/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-amber-300 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-serif italic">
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-serif italic">
                        No audit logs recorded for this filter.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-slate-400">
                          {new Date(log.created_at).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white">{log.actor_name || 'System'}</div>
                          {log.actor_role && (
                            <span className="text-[9px] font-mono text-purple-300 uppercase">
                              {log.actor_role}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-amber-300/30 text-amber-300 font-mono text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-400">
                          {log.target_type ? `${log.target_type}: ${log.target_id || ''}` : '—'}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                          {JSON.stringify(log.details || {})}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-500">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Showing {auditLogs.length} of {auditTotal} audit events
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-slate-900 rounded-xl font-mono text-amber-300 font-bold">
                  {auditPage}
                </span>
                <button
                  type="button"
                  disabled={auditPage >= auditPages}
                  onClick={() => setAuditPage((p) => Math.min(auditPages, p + 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 TAB 4: SYSTEM HEALTH 🌟 */}
      {activeTab === 'HEALTH' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <Database className="w-6 h-6 text-emerald-400" />
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  CONNECTED
                </span>
              </div>
              <h4 className="font-serif text-lg font-bold text-white">PostgreSQL 16</h4>
              <p className="text-xs text-slate-400">Relational event & user database storage.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <Server className="w-6 h-6 text-emerald-400" />
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  CONNECTED
                </span>
              </div>
              <h4 className="font-serif text-lg font-bold text-white">Redis 7 Cache</h4>
              <p className="text-xs text-slate-400">In-memory caching and background event queue.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <Layers className="w-6 h-6 text-emerald-400" />
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  OPTIMAL
                </span>
              </div>
              <h4 className="font-serif text-lg font-bold text-white">Media Storage</h4>
              <p className="text-xs text-slate-400">Persistent upload storage directory `/app/uploads`.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <Activity className="w-6 h-6 text-emerald-400" />
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  ONLINE
                </span>
              </div>
              <h4 className="font-serif text-lg font-bold text-white">FastAPI Async Core</h4>
              <p className="text-xs text-slate-400">Active uvicorn cluster workers.</p>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 USER DETAIL DRAWER / MODAL 🌟 */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-l border-amber-300/30 w-full max-w-md h-full p-6 sm:p-8 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest block">
                  USER PROFILE DETAIL
                </span>
                <h3 className="font-serif text-xl font-bold text-white">
                  {selectedUserDetail.full_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div><span className="text-slate-500">Email:</span> <span className="font-mono text-white">{selectedUserDetail.email}</span></div>
                <div><span className="text-slate-500">Phone:</span> <span className="font-mono text-white">{selectedUserDetail.phone || 'None'}</span></div>
                <div><span className="text-slate-500">Role:</span> <span className="font-bold text-amber-300">{selectedUserDetail.role}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className={selectedUserDetail.is_active ? 'text-emerald-400' : 'text-rose-400'}>{selectedUserDetail.is_active ? 'Active' : 'Inactive'}</span></div>
                <div><span className="text-slate-500">Registered:</span> <span className="font-mono text-slate-300">{new Date(selectedUserDetail.created_at).toLocaleDateString('en-IN')}</span></div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-white font-serif">{selectedUserDetail.event_count}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Events Created</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-white font-serif">{selectedUserDetail.guest_count}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Guests Managed</div>
                </div>
              </div>

              {/* Recent Events */}
              <div className="space-y-2">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider">Recent Celebrations</h4>
                {selectedUserDetail.recent_events?.length === 0 ? (
                  <p className="text-slate-500 italic">No events created yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUserDetail.recent_events?.map((ev: any) => (
                      <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">{ev.title}</div>
                          <div className="text-[10px] text-amber-300 font-mono">{ev.event_type}</div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(ev.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 CREATE USER MODAL 🌟 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-300/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif text-lg font-bold text-white">Create New User</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+919876543210"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Role Tier</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="FREE">FREE User</option>
                  <option value="PRO">PRO / Host</option>
                  <option value="SUPER">SUPER Operator</option>
                  <option value="ADMIN">ADMIN Administrator</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Initial Password (Optional)</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Leave empty for temporary default"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 EDIT USER MODAL 🌟 */}
      {isEditModalOpen && activeUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-300/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif text-lg font-bold text-white">Edit User Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 CHANGE ROLE MODAL (WITH SAFEGUARD WARNING) 🌟 */}
      {isRoleModalOpen && activeUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-purple-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <h3 className="font-serif text-lg font-bold text-white">Change User Role</h3>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                Select a new access tier for <span className="font-bold text-white">{activeUserTarget.full_name}</span> ({activeUserTarget.email}):
              </p>

              <div className="space-y-2">
                {['FREE', 'PRO', 'SUPER', 'ADMIN'].map((r) => (
                  <label
                    key={r}
                    onClick={() => setSelectedNewRole(r)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedNewRole === r
                        ? 'bg-purple-950/60 border-purple-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold font-mono">{r}</span>
                      <span className="text-[11px] block text-slate-400">
                        {r === 'ADMIN' && 'Full administrator control over all platform data & users'}
                        {r === 'SUPER' && 'Support operator & moderation capabilities'}
                        {r === 'PRO' && 'Premium invitation creation and advanced sharing'}
                        {r === 'FREE' && 'Standard basic invitation tier'}
                      </span>
                    </div>
                    {selectedNewRole === r && <Check className="w-4 h-4 text-purple-400" />}
                  </label>
                ))}
              </div>

              {activeUserTarget.id === currentAdmin?.id && selectedNewRole !== 'ADMIN' && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Safeguard: You cannot remove your own Administrator role.</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading || (activeUserTarget.id === currentAdmin?.id && selectedNewRole !== 'ADMIN')}
                  onClick={handleChangeRoleSubmit}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-40"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Role Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 ACTIVATE / DEACTIVATE MODAL 🌟 */}
      {isStatusModalOpen && activeUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-300/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="font-serif text-lg font-bold text-white">
              {activeUserTarget.is_active ? 'Deactivate Account?' : 'Activate Account?'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeUserTarget.is_active
                ? `Deactivating ${activeUserTarget.email} will prevent them from logging in. Their invitations and guests will be preserved.`
                : `Activating ${activeUserTarget.email} will restore their login access immediately.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleStatusSubmit}
                className={`px-5 py-2 rounded-xl font-bold ${
                  activeUserTarget.is_active
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {actionLoading ? 'Updating...' : activeUserTarget.is_active ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 SOFT DELETE MODAL 🌟 */}
      {isDeleteModalOpen && activeUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold text-white">Soft-Delete User Account?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">{activeUserTarget.email}</span>? This will mark the account as deleted and revoke access.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteUserSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Soft Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
