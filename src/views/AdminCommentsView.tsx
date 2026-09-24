import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useTheme } from '../context/ThemeContext';
import { SEOHelmet } from '../components/SEOHelmet';
import {
  getActiveAdminSession,
  logoutAdmin,
  updateAdminPassword,
  AdminSession,
  getAdminLoginRoute,
} from '../services/adminAuth';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { CommentReplyModal } from '../components/admin/CommentReplyModal';
import {
  ToolComment,
  CommentStatus,
  getComments,
  getCommentsStats,
  getToolsWithComments,
  updateCommentStatus,
  replyToComment,
  removeCommentReply,
  deleteComment,
  bulkUpdateStatus,
  bulkDelete,
  COMMENTS_CHANGED_EVENT,
} from '../../src/services/commentModerationService';
import { TOOLS } from '../data/tools';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Trash2,
  CornerDownRight,
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  Star,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  Calendar,
  Layers,
  Sparkles,
  KeyRound,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export function AdminCommentsView() {
  const { navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Comments Data & Filters
  const [comments, setComments] = useState<ToolComment[]>([]);
  const [stats, setStats] = useState(getCommentsStats());
  const [searchQuery, setSearchQuery] = useState('');
  const [toolFilter, setToolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CommentStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reply Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeReplyComment, setActiveReplyComment] = useState<ToolComment | null>(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: string; count?: number } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Auth check
  useEffect(() => {
    let isMounted = true;
    getActiveAdminSession().then((activeSession) => {
      if (!isMounted) return;
      if (!activeSession) {
        navigate(getAdminLoginRoute());
      } else {
        setSession(activeSession);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Load and refresh comments
  const refreshComments = () => {
    const list = getComments({
      toolSlug: toolFilter,
      status: statusFilter,
      dateRange: dateFilter,
      search: searchQuery,
    });
    setComments(list);
    setStats(getCommentsStats());
  };

  useEffect(() => {
    if (!loading && session) {
      refreshComments();
    }

    const handleCommentsUpdate = () => {
      refreshComments();
    };

    window.addEventListener(COMMENTS_CHANGED_EVENT, handleCommentsUpdate);
    return () => {
      window.removeEventListener(COMMENTS_CHANGED_EVENT, handleCommentsUpdate);
    };
  }, [loading, session, toolFilter, statusFilter, dateFilter, searchQuery]);

  // Clean selected IDs if filtered out
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => comments.some((c) => c.id === id)));
  }, [comments]);

  // Combined available tools list for dropdown
  const availableToolsList = useMemo(() => {
    const commentedTools = getToolsWithComments();
    const map = new Map<string, string>();
    TOOLS.forEach((t) => map.set(t.slug, t.name));
    commentedTools.forEach((ct) => map.set(ct.slug, ct.name));
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, []);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate(getAdminLoginRoute());
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    const success = await updateAdminPassword(newPassword);
    setSavingPassword(false);

    if (success) {
      setPasswordStatus({ success: true, message: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus(null);
      }, 1500);
    } else {
      setPasswordStatus({ success: false, message: 'Failed to update password. Please try again.' });
    }
  };

  // Single Action Handlers
  const handleApprove = (id: string) => {
    updateCommentStatus(id, 'approved');
    showToast('Comment approved and published to the live tool page.');
    refreshComments();
  };

  const handleReject = (id: string) => {
    updateCommentStatus(id, 'rejected');
    showToast('Comment rejected.');
    refreshComments();
  };

  const handleSpam = (id: string) => {
    updateCommentStatus(id, 'spam');
    showToast('Comment marked as spam.');
    refreshComments();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'single' && deleteTarget.id) {
      deleteComment(deleteTarget.id);
      showToast('Comment deleted permanently.');
    } else if (deleteTarget.type === 'bulk') {
      const count = bulkDelete(selectedIds);
      setSelectedIds([]);
      showToast(`${count} comment${count > 1 ? 's' : ''} deleted permanently.`);
    }

    setDeleteTarget(null);
    refreshComments();
  };

  const handleOpenReplyModal = (comment: ToolComment) => {
    setActiveReplyComment(comment);
    setReplyModalOpen(true);
  };

  const handleSaveReply = (commentId: string, replyText: string, authorName: string) => {
    replyToComment(commentId, replyText, authorName);
    showToast('Official reply saved and published.');
    refreshComments();
  };

  const handleRemoveReply = (commentId: string) => {
    removeCommentReply(commentId);
    showToast('Official reply removed.');
    refreshComments();
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedIds.length === comments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(comments.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    const count = bulkUpdateStatus(selectedIds, 'approved');
    setSelectedIds([]);
    showToast(`${count} comment${count > 1 ? 's' : ''} approved.`);
    refreshComments();
  };

  const handleBulkReject = () => {
    const count = bulkUpdateStatus(selectedIds, 'rejected');
    setSelectedIds([]);
    showToast(`${count} comment${count > 1 ? 's' : ''} rejected.`);
    refreshComments();
  };

  const handleBulkSpam = () => {
    const count = bulkUpdateStatus(selectedIds, 'spam');
    setSelectedIds([]);
    showToast(`${count} comment${count > 1 ? 's' : ''} marked as spam.`);
    refreshComments();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setToolFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
  };

  const formatCommentDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] text-[#1E1035]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#6D6582]">Loading comments moderation console...</p>
        </div>
      </div>
    );
  }

  const isFiltered =
    Boolean(searchQuery) ||
    toolFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateFilter !== 'all';

  return (
    <>
      <SEOHelmet
        title="Comments Moderation – Admin Dashboard"
        description="Review, approve, reply to, and moderate user discussions, reviews, and questions across all tools."
        canonicalPath="/admin/comments"
        noindex={true}
      />

      <div
        className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex"
      >
        {/* Admin Sidebar */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          adminEmail={session?.user?.email || 'admin@onlinetools.internal'}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopNav
            pageTitle="Comments Moderation"
            adminTheme={theme}
            onToggleTheme={toggleTheme}
            onToggleSidebar={() => setSidebarOpen(true)}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onLogout={handleLogout}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-[#1E1035]">
                  User Comments & Feedback
                </h1>
                <p className="text-xs sm:text-sm text-[#6D6582] mt-0.5">
                  Manage user discussions, reviews, suggestions, and spam prevention across all calculators and tools.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={refreshComments}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold rounded-xl border border-[#EDE9FE] bg-[#FFFFFF] text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] cursor-pointer transition-colors shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Status Metric Cards / Quick Filter Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-stretch">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer h-full flex flex-col justify-between ${
                  statusFilter === 'all'
                    ? 'bg-[#F5F3FF] border-[#7C3AED] ring-1 ring-[#7C3AED] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#EDE9FE] hover:border-[#DDD6FE] shadow-2xs'
                }`}
              >
                <div className="text-[11px] font-heading font-semibold text-[#6D6582]">
                  All Comments
                </div>
                <div className="text-xl font-bold font-mono text-[#1E1035] mt-1.5">
                  {stats.total}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer h-full flex flex-col justify-between ${
                  statusFilter === 'pending'
                    ? 'bg-[#FFFBEB] border-[#F59E0B] ring-1 ring-[#F59E0B] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#EDE9FE] hover:border-[#DDD6FE] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-heading font-semibold text-[#D97706]">
                    Pending Review
                  </span>
                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                </div>
                <div className="text-xl font-bold font-mono text-[#D97706] mt-1.5">
                  {stats.pending}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer h-full flex flex-col justify-between ${
                  statusFilter === 'approved'
                    ? 'bg-[#F0FDF4] border-[#16A34A] ring-1 ring-[#16A34A] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#EDE9FE] hover:border-[#DDD6FE] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-heading font-semibold text-[#16A34A]">
                    Approved / Live
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                </div>
                <div className="text-xl font-bold font-mono text-[#16A34A] mt-1.5">
                  {stats.approved}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('spam')}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer h-full flex flex-col justify-between ${
                  statusFilter === 'spam'
                    ? 'bg-[#FEF2F2] border-[#DC2626] ring-1 ring-[#DC2626] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#EDE9FE] hover:border-[#DDD6FE] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-heading font-semibold text-[#DC2626]">
                    Flagged Spam
                  </span>
                  <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
                </div>
                <div className="text-xl font-bold font-mono text-[#DC2626] mt-1.5">
                  {stats.spam}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer h-full flex flex-col justify-between ${
                  statusFilter === 'rejected'
                    ? 'bg-[#F5F3FF] border-[#7C3AED] ring-1 ring-[#7C3AED] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#EDE9FE] hover:border-[#DDD6FE] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-heading font-semibold text-[#6D6582]">
                    Rejected
                  </span>
                  <XCircle className="w-3.5 h-3.5 text-[#6D6582]" />
                </div>
                <div className="text-xl font-bold font-mono text-[#1E1035] mt-1.5">
                  {stats.rejected}
                </div>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search Bar */}
                <div className="sm:col-span-5 relative">
                  <input
                    type="text"
                    placeholder="Search by author, email, comment text, or tool..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 pl-9 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#60A5FA]"
                  />
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tool Dropdown Filter */}
                <div className="sm:col-span-3">
                  <div className="relative">
                    <select
                      value={toolFilter}
                      onChange={(e) => setToolFilter(e.target.value)}
                      className="w-full px-3 py-2 pr-8 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#60A5FA] appearance-none cursor-pointer"
                    >
                      <option value="all">All Tools ({stats.total})</option>
                      {availableToolsList.map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Status Dropdown Filter */}
                <div className="sm:col-span-2">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 pr-8 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#60A5FA] appearance-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending ({stats.pending})</option>
                      <option value="approved">Approved ({stats.approved})</option>
                      <option value="spam">Spam ({stats.spam})</option>
                      <option value="rejected">Rejected ({stats.rejected})</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Date Dropdown Filter */}
                <div className="sm:col-span-2">
                  <div className="relative">
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as any)}
                      className="w-full px-3 py-2 pr-8 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#60A5FA] appearance-none cursor-pointer"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Active Filter Tags */}
              {isFiltered && (
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">Active Filters:</span>
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[11px] font-medium">
                        Search: &ldquo;{searchQuery}&rdquo;
                      </span>
                    )}
                    {toolFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[11px] font-medium">
                        Tool: {toolFilter}
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[11px] font-medium capitalize">
                        Status: {statusFilter}
                      </span>
                    )}
                    {dateFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[11px] font-medium">
                        Date: {dateFilter}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline cursor-pointer shrink-0"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Bulk Actions Banner */}
            {selectedIds.length > 0 && (
              <div className="bg-[#2563EB]/10 dark:bg-[#2563EB]/20 border border-[#2563EB]/30 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                  <span>{selectedIds.length} comments selected</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleBulkApprove}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Selected</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkReject}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-600 hover:bg-slate-700 text-white cursor-pointer transition-colors shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Selected</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkSpam}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors shadow-2xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Mark as Spam</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'bulk', count: selectedIds.length })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] underline ml-2 cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            {/* Comments Table */}
            <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] text-[#64748B] dark:text-[#94A3B8] font-semibold">
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={comments.length > 0 && selectedIds.length === comments.length}
                          onChange={handleSelectAll}
                          aria-label="Select all comments"
                          className="w-4 h-4 rounded border-[#CBD5E1] dark:border-[#334155] text-[#2563EB] focus:ring-[#2563EB]"
                        />
                      </th>
                      <th className="p-4 min-w-[150px]">Tool Name</th>
                      <th className="p-4 min-w-[160px]">Commenter</th>
                      <th className="p-4 min-w-[280px]">Comment Text</th>
                      <th className="p-4 min-w-[110px]">Date</th>
                      <th className="p-4 min-w-[110px]">Status</th>
                      <th className="p-4 text-right min-w-[160px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                    {comments.map((comment) => {
                      const isSelected = selectedIds.includes(comment.id);

                      return (
                        <tr
                          key={comment.id}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-blue-50/40 dark:bg-blue-950/20'
                              : 'hover:bg-[#F8FAFC] dark:hover:bg-[#131B2E]/50'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(comment.id)}
                              aria-label={`Select comment by ${comment.authorName}`}
                              className="w-4 h-4 rounded border-[#CBD5E1] dark:border-[#334155] text-[#2563EB] focus:ring-[#2563EB]"
                            />
                          </td>

                          {/* Tool Name */}
                          <td className="p-4 align-top">
                            <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                              {comment.toolName}
                            </div>
                            <a
                              href={`/tools/${comment.toolSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] dark:text-[#60A5FA] hover:underline mt-0.5"
                            >
                              <span>View Tool</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>

                          {/* Commenter */}
                          <td className="p-4 align-top">
                            <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                              {comment.authorName}
                            </div>
                            {comment.authorEmail && (
                              <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate max-w-[160px]">
                                {comment.authorEmail}
                              </div>
                            )}
                            {comment.ipAddress && (
                              <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                                IP: {comment.ipAddress}
                              </div>
                            )}
                          </td>

                          {/* Comment Text & Reply Preview */}
                          <td className="p-4 align-top space-y-1.5">
                            {/* Star rating if present */}
                            {comment.rating && (
                              <div className="flex items-center gap-0.5 mb-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= comment.rating!
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-[#E2E8F0] dark:text-[#334155]'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                              {comment.commentText}
                            </p>

                            {/* Flag reason badge */}
                            {comment.flagReason && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 mt-1">
                                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                <span>{comment.flagReason}</span>
                              </div>
                            )}

                            {/* Official Reply preview */}
                            {comment.reply && (
                              <div className="mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] pl-2 border-l-2 border-l-[#2563EB] dark:border-l-[#60A5FA]">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                                  <CornerDownRight className="w-3 h-3" />
                                  <span>{comment.reply.author} Response:</span>
                                </div>
                                <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] italic mt-0.5">
                                  &ldquo;{comment.reply.text}&rdquo;
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="p-4 align-top whitespace-nowrap">
                            <span
                              title={new Date(comment.createdAt).toLocaleString()}
                              className="text-xs text-[#64748B] dark:text-[#94A3B8]"
                            >
                              {formatCommentDate(comment.createdAt)}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="p-4 align-top whitespace-nowrap">
                            {comment.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            )}
                            {comment.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                            {comment.status === 'spam' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                                <ShieldAlert className="w-3 h-3" />
                                <span>Spam</span>
                              </span>
                            )}
                            {comment.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <XCircle className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 align-top text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {/* Approve Button */}
                              {comment.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(comment.id)}
                                  title="Approve Comment"
                                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              {/* Reject Button */}
                              {comment.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => handleReject(comment.id)}
                                  title="Reject Comment"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              {/* Mark Spam Button */}
                              {comment.status !== 'spam' && (
                                <button
                                  type="button"
                                  onClick={() => handleSpam(comment.id)}
                                  title="Mark as Spam"
                                  className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer transition-colors"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              )}

                              {/* Reply Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenReplyModal(comment)}
                                title={comment.reply ? 'Edit Official Reply' : 'Reply to Comment'}
                                className="p-1.5 rounded-lg text-[#2563EB] dark:text-[#60A5FA] hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer transition-colors"
                              >
                                <CornerDownRight className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'single', id: comment.id })}
                                title="Delete Comment"
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Empty Table State */}
                    {comments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-16 px-4">
                          <MessageSquare className="w-10 h-10 text-[#94A3B8] mx-auto mb-3 opacity-60" />
                          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                            No comments found
                          </h3>
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
                            {isFiltered
                              ? 'No comments match your active filters. Try adjusting the search query or status filter.'
                              : 'There are currently no user comments recorded in the system.'}
                          </p>
                          {isFiltered && (
                            <button
                              type="button"
                              onClick={resetFilters}
                              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer transition-colors"
                            >
                              Clear All Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary */}
              <div className="p-4 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>
                  Showing <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{comments.length}</span>{' '}
                  of <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{stats.total}</span> total comments
                </span>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{stats.pending} pending moderation</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{stats.approved} approved</span>
                  </span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Reply Modal */}
      <CommentReplyModal
        isOpen={replyModalOpen}
        comment={activeReplyComment}
        onClose={() => {
          setReplyModalOpen(false);
          setActiveReplyComment(null);
        }}
        onSaveReply={handleSaveReply}
        onRemoveReply={handleRemoveReply}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {deleteTarget.type === 'bulk'
                    ? `Delete ${deleteTarget.count} Comments?`
                    : 'Delete Comment?'}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              {deleteTarget.type === 'bulk'
                ? `Are you sure you want to permanently delete these ${deleteTarget.count} comments? They will be removed from all public pages.`
                : 'Are you sure you want to permanently delete this user comment? It will be removed from all public views immediately.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-2xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Change Admin Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded text-[#64748B] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  passwordStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40'
                }`}
              >
                {passwordStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="new-pwd"
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  New Password
                </label>
                <input
                  id="new-pwd"
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#60A5FA]"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-pwd"
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-pwd"
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#60A5FA]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] text-[#475569] dark:text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-60 cursor-pointer"
                >
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0F172A] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#0F172A] px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 border border-[#334155] dark:border-[#E2E8F0] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
