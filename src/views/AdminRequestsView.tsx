import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  ExternalLink,
  ChevronDown,
  Layers,
  List,
  Mail,
  Calendar,
  Tag,
  StickyNote,
  User,
  Check,
  ChevronRight,
  Eye,
  Plus,
  ArrowUpDown,
} from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { ToolRequestNotesModal } from '../components/admin/ToolRequestNotesModal';
import {
  AdminSession,
  getActiveAdminSession,
  getAdminLoginRoute,
  logoutAdmin,
  updateAdminPassword,
} from '../services/adminAuth';
import {
  ToolRequest,
  ToolRequestStatus,
  GroupedToolRequest,
  getToolRequests,
  getGroupedToolRequests,
  getToolRequestsStats,
  updateToolRequestStatus,
  deleteToolRequest,
  bulkUpdateToolRequestStatus,
  bulkDeleteToolRequests,
  TOOL_REQUESTS_CHANGED_EVENT,
} from '../../src/services/toolRequestsService';
import { SEOHelmet } from '../components/SEOHelmet';

type ViewMode = 'individual' | 'grouped';
type StatusFilter = 'all' | ToolRequestStatus;
type SortOption = 'newest' | 'oldest' | 'most_requested' | 'name';

export function AdminRequestsView() {
  const { navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Password update modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate(getAdminLoginRoute());
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      const ok = await updateAdminPassword(newPassword);
      if (ok) {
        setPasswordStatus({ success: true, message: 'Password updated successfully.' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordStatus(null);
        }, 1200);
      } else {
        setPasswordStatus({ success: false, message: 'Failed to update password.' });
      }
    } catch {
      setPasswordStatus({ success: false, message: 'Error updating password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  // Auth guard
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

  // Data states
  const [requests, setRequests] = useState<ToolRequest[]>(() => getToolRequests());
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Notes Modal state
  const [activeNoteRequest, setActiveNoteRequest] = useState<ToolRequest | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Delete Confirmation modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'single' | 'bulk';
    id?: string;
    count?: number;
  } | null>(null);

  // Expanded groups in grouped view
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(new Set());

  // Reload data helper
  const reloadData = () => {
    setRequests(getToolRequests());
  };

  // Listen to cross-component changes
  useEffect(() => {
    const handleStorageUpdate = () => {
      reloadData();
    };
    window.addEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleStorageUpdate);
    return () => window.removeEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleStorageUpdate);
  }, []);

  // Stats
  const stats = useMemo(() => getToolRequestsStats(), [requests]);

  // Available categories
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    for (const r of requests) {
      if (r.category) cats.add(r.category);
    }
    return Array.from(cats).sort();
  }, [requests]);

  // Filtered individual requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status filter
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && req.category !== categoryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = req.toolName.toLowerCase().includes(query);
        const matchDesc = req.description.toLowerCase().includes(query);
        const matchEmail = (req.requesterEmail || '').toLowerCase().includes(query);
        const matchRequester = (req.requesterName || '').toLowerCase().includes(query);
        const matchUseCase = (req.useCase || '').toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchEmail && !matchRequester && !matchUseCase) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, categoryFilter, searchQuery]);

  // Sorted individual requests
  const sortedRequests = useMemo(() => {
    const list = [...filteredRequests];
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.toolName.localeCompare(b.toolName));
    } else if (sortBy === 'most_requested') {
      // Sort by frequency of the tool name
      const countsMap = new Map<string, number>();
      for (const r of requests) {
        const k = r.toolName.toLowerCase().trim();
        countsMap.set(k, (countsMap.get(k) || 0) + 1);
      }
      list.sort((a, b) => {
        const countA = countsMap.get(a.toolName.toLowerCase().trim()) || 0;
        const countB = countsMap.get(b.toolName.toLowerCase().trim()) || 0;
        if (countB !== countA) return countB - countA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return list;
  }, [filteredRequests, sortBy, requests]);

  // Grouped requests (for "Most Requested" view)
  const groupedRequests = useMemo(() => {
    let source = requests;
    if (statusFilter !== 'all') {
      source = source.filter((r) => r.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      source = source.filter((r) => r.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      source = source.filter(
        (r) =>
          r.toolName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.requesterEmail && r.requesterEmail.toLowerCase().includes(q))
      );
    }
    const grouped = getGroupedToolRequests(source);

    if (sortBy === 'name') {
      grouped.sort((a, b) => a.toolName.localeCompare(b.toolName));
    } else if (sortBy === 'newest') {
      grouped.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
    } else if (sortBy === 'oldest') {
      grouped.sort((a, b) => new Date(a.latestDate).getTime() - new Date(b.latestDate).getTime());
    }
    // Default getGroupedToolRequests is already sorted by count desc
    return grouped;
  }, [requests, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(sortedRequests.map((r) => r.id));
      setSelectedIds(ids);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Status updates
  const handleStatusChange = (id: string, status: ToolRequestStatus) => {
    updateToolRequestStatus(id, status);
    reloadData();
  };

  // Bulk actions
  const handleBulkStatus = (status: ToolRequestStatus) => {
    const ids = Array.from(selectedIds);
    bulkUpdateToolRequestStatus(ids, status);
    setSelectedIds(new Set());
    reloadData();
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    bulkDeleteToolRequests(ids);
    setSelectedIds(new Set());
    setDeleteConfirmTarget(null);
    reloadData();
  };

  const handleSingleDelete = (id: string) => {
    deleteToolRequest(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDeleteConfirmTarget(null);
    reloadData();
  };

  // Accordion toggle in grouped view
  const toggleExpandGroup = (key: string) => {
    setExpandedGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'Request ID',
      'Tool Name',
      'Category',
      'Status',
      'Requester Name',
      'Requester Email',
      'Date Submitted',
      'Description',
      'Use Case',
      'Notes Count',
    ];
    const rows = sortedRequests.map((r) => [
      `"${r.id}"`,
      `"${r.toolName.replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${(r.requesterName || '').replace(/"/g, '""')}"`,
      `"${(r.requesterEmail || '').replace(/"/g, '""')}"`,
      `"${r.createdAt}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${(r.useCase || '').replace(/"/g, '""')}"`,
      r.adminNotes?.length || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tool_requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#6D6582]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#7C3AED]" />
          <span>Loading tool requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex">
      <SEOHelmet
        title="Tool Requests Manager – Admin Console"
        description="Review and triage community-submitted tool requests, update development status, and prioritize tools by demand."
        canonicalPath="/admin/requests"
      />

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminEmail={session?.user?.email || 'admin@onlinetools.internal'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopNav
          pageTitle="Tool Requests Manager"
          adminTheme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#6D6582] uppercase tracking-wider">
                  Admin Management
                </span>
                <span className="text-xs text-[#9D95B3]">•</span>
                <span className="text-xs font-medium text-[#7C3AED]">
                  Requests
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] flex items-center gap-2.5">
                <span>Tool Requests Manager</span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] font-mono border border-[#DDD6FE]">
                  {stats.total} total
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6D6582] mt-0.5">
                Manage user suggestions from <code className="text-[11px] bg-[#FAF9FE] px-1.5 py-0.5 rounded text-[#7C3AED] border border-[#EDE9FE]">/request-a-tool</code>, track development progress, and identify the most wanted utilities.
              </p>
            </div>

            {/* Top action buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
              <a
                href="/request-a-tool"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#0F172A] text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                <span>View Public Form</span>
              </a>

              <button
                type="button"
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#0F172A] text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={reloadData}
                className="p-1.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#0F172A] text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                title="Refresh requests"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* New Requests */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'new'
                  ? 'bg-blue-50/50 border-blue-400 dark:bg-blue-950/40 dark:border-blue-700 shadow-xs'
                  : 'bg-[#FFFFFF] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  New / In Review
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                  {stats.newCount}
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400">Needs triage</span>
              </div>
            </div>

            {/* In Progress */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-50/50 border-amber-400 dark:bg-amber-950/40 dark:border-amber-700 shadow-xs'
                  : 'bg-[#FFFFFF] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  In Progress
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                  {stats.inProgress}
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400">Under dev</span>
              </div>
            </div>

            {/* Completed */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-50/50 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-700 shadow-xs'
                  : 'bg-[#FFFFFF] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Completed
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                  {stats.completed}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Shipped</span>
              </div>
            </div>

            {/* Declined / Out of Scope */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'declined' ? 'all' : 'declined')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'declined'
                  ? 'bg-slate-100/50 border-slate-400 dark:bg-slate-800 dark:border-slate-600 shadow-xs'
                  : 'bg-[#FFFFFF] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Declined
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                  {stats.declined}
                </span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Out of scope</span>
              </div>
            </div>
          </div>

          {/* Primary Controls Card */}
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
            {/* View Mode Tabs & Status Tabs Row */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#1E293B] pb-4">
              {/* View Mode Toggle */}
              <div className="flex items-center p-1 bg-[#F1F5F9] dark:bg-[#0B0F17] rounded-lg border border-[#E2E8F0] dark:border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setViewMode('individual')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    viewMode === 'individual'
                      ? 'bg-[#FFFFFF] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] shadow-2xs'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Individual Submissions ({filteredRequests.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('grouped');
                    setSortBy('most_requested');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    viewMode === 'grouped'
                      ? 'bg-[#FFFFFF] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] shadow-2xs'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grouped by Tool / Most Requested ({groupedRequests.length})</span>
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 text-xs">
                {(['all', 'new', 'in_progress', 'completed', 'declined'] as StatusFilter[]).map((st) => {
                  const isActive = statusFilter === st;
                  const labelMap: Record<StatusFilter, string> = {
                    all: `All (${requests.length})`,
                    new: `New (${stats.newCount})`,
                    in_progress: `In Progress (${stats.inProgress})`,
                    completed: `Completed (${stats.completed})`,
                    declined: `Declined (${stats.declined})`,
                  };

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#2563EB] text-[#FFFFFF]'
                          : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]'
                      }`}
                    >
                      {labelMap[st]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search Field */}
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by tool name, description, requester email, use case..."
                  className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="sm:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="sm:col-span-3">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full py-2 pl-3 pr-8 bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer appearance-none"
                  >
                    <option value="most_requested">Sort by: Most Requested</option>
                    <option value="newest">Sort by: Newest First</option>
                    <option value="oldest">Sort by: Oldest First</option>
                    <option value="name">Sort by: Tool Name (A-Z)</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active filters and reset */}
            {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim()) && (
              <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] text-xs">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Active filters:</span>
                {statusFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E2E8F0] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1">
                    Status: {statusFilter}
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="hover:text-rose-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E2E8F0] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1">
                    Category: {categoryFilter}
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className="hover:text-rose-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E2E8F0] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1">
                    Query: "{searchQuery}"
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-rose-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-[#2563EB] dark:text-[#60A5FA] hover:underline ml-auto font-medium cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Bar (Sticky if items selected) */}
          {selectedIds.size > 0 && (
            <div className="sticky top-16 z-30 bg-[#0F172A] text-[#F8FAFC] rounded-xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-5 h-5 rounded-full bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center text-[10px] font-bold">
                  {selectedIds.size}
                </span>
                <span>items selected</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkStatus('in_progress')}
                  className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatus('completed')}
                  className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-[#334155] text-emerald-300 transition-colors cursor-pointer"
                >
                  Mark Completed
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatus('declined')}
                  className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-[#334155] text-slate-300 transition-colors cursor-pointer"
                >
                  Mark Declined
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget({ type: 'bulk', count: selectedIds.size })}
                  className="px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 hover:bg-rose-900 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[#94A3B8] hover:text-[#F8FAFC] px-2 py-1"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: Individual Submissions Table */}
          {viewMode === 'individual' && (
            <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B0F17] text-[#64748B] dark:text-[#94A3B8]">
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            sortedRequests.length > 0 &&
                            selectedIds.size === sortedRequests.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-[#CBD5E1] dark:border-[#334155] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                          aria-label="Select all requests"
                        />
                      </th>
                      <th className="p-3.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] min-w-[220px]">
                        Requested Tool
                      </th>
                      <th className="p-3.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] min-w-[280px]">
                        Description & Details
                      </th>
                      <th className="p-3.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] min-w-[170px]">
                        Requester
                      </th>
                      <th className="p-3.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] min-w-[110px]">
                        Date
                      </th>
                      <th className="p-3.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] min-w-[130px]">
                        Status
                      </th>
                      <th className="p-3.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] text-right min-w-[140px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                    {sortedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-[#64748B] dark:text-[#94A3B8]">
                          <Sparkles className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                            No tool requests found matching your filters
                          </p>
                          <p className="text-xs mt-1">
                            Try broadening your search query or reset active filters.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      sortedRequests.map((req) => {
                        const isSelected = selectedIds.has(req.id);
                        return (
                          <tr
                            key={req.id}
                            className={`transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#0B0F17]/60 ${
                              isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(req.id)}
                                className="rounded border-[#CBD5E1] dark:border-[#334155] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                                aria-label={`Select request ${req.toolName}`}
                              />
                            </td>

                            {/* Tool Name & Category */}
                            <td className="p-3.5">
                              <div className="font-semibold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                                {req.toolName}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {req.category && (
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155]">
                                    {req.category}
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-[#94A3B8]">
                                  {req.id}
                                </span>
                              </div>
                            </td>

                            {/* Description & Use Case */}
                            <td className="p-3.5">
                              <p className="text-[#334155] dark:text-[#CBD5E1] line-clamp-2 leading-relaxed">
                                {req.description}
                              </p>
                              {req.useCase && (
                                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 italic line-clamp-1">
                                  Use case: {req.useCase}
                                </p>
                              )}
                              {req.adminNotes && req.adminNotes.length > 0 && (
                                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#2563EB] dark:text-[#60A5FA]">
                                  <StickyNote className="w-3 h-3" />
                                  <span>{req.adminNotes.length} internal note{req.adminNotes.length > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </td>

                            {/* Requester */}
                            <td className="p-3.5">
                              <div className="text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                                {req.requesterName || 'Anonymous Visitor'}
                              </div>
                              {req.requesterEmail ? (
                                <a
                                  href={`mailto:${req.requesterEmail}`}
                                  className="text-[11px] text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate max-w-[140px]">{req.requesterEmail}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-[#94A3B8]">No email provided</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="p-3.5 text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                              <div>
                                {new Date(req.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-[10px] text-[#94A3B8]">
                                {new Date(req.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>

                            {/* Status Selector */}
                            <td className="p-3.5">
                              <select
                                value={req.status}
                                onChange={(e) =>
                                  handleStatusChange(req.id, e.target.value as ToolRequestStatus)
                                }
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                                  req.status === 'new'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                                    : req.status === 'in_progress'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                                    : req.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                }`}
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="declined">Declined</option>
                              </select>
                            </td>

                            {/* Row Actions */}
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveNoteRequest(req);
                                    setIsNotesModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#CBD5E1] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#0F172A] text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                                  title="View details & admin notes"
                                >
                                  <StickyNote className="w-3.5 h-3.5 text-[#2563EB]" />
                                  <span>Notes ({req.adminNotes?.length || 0})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteConfirmTarget({ type: 'single', id: req.id })
                                  }
                                  className="p-1 rounded text-[#94A3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                                  title="Delete request"
                                  aria-label="Delete request"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-wrap items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                <div>
                  Showing <strong>{sortedRequests.length}</strong> of <strong>{requests.length}</strong> total submissions
                </div>
                <div>
                  Tip: Toggle to <strong>"Grouped by Tool"</strong> to automatically aggregate duplicate user requests and see highest community demand.
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Grouped by Tool (Most Requested Demand Analysis) */}
          {viewMode === 'grouped' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Duplicate Request Aggregation:</span> Identical or semantically matching tool names are grouped together to surface the highest community demand. Click on any row to expand and inspect all individual user submissions and their private notes.
                </div>
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl shadow-2xs overflow-hidden">
                <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                  {groupedRequests.length === 0 ? (
                    <div className="p-12 text-center text-[#64748B] dark:text-[#94A3B8]">
                      <Layers className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                        No grouped tools match your filters
                      </p>
                    </div>
                  ) : (
                    groupedRequests.map((group, idx) => {
                      const isExpanded = expandedGroupKeys.has(group.groupKey);
                      return (
                        <div key={group.groupKey} className="transition-colors">
                          {/* Main Group Header Row */}
                          <div
                            onClick={() => toggleExpandGroup(group.groupKey)}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#0B0F17]/50"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              {/* Rank Indicator */}
                              <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] flex items-center justify-center text-xs font-bold font-mono shrink-0">
                                #{idx + 1}
                              </div>

                              {/* Demand Count Badge */}
                              <div
                                className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 ${
                                  group.count > 1
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                                    : 'bg-[#F1F5F9] text-[#475569] dark:bg-[#1E293B] dark:text-[#94A3B8]'
                                }`}
                              >
                                {group.count > 1 && <Sparkles className="w-3 h-3 text-[#2563EB] dark:text-[#60A5FA]" />}
                                <span>{group.count} {group.count === 1 ? 'request' : 'requests'}</span>
                              </div>

                              <div>
                                <div className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2 flex-wrap">
                                  <span>{group.toolName}</span>
                                  {group.category && (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] font-normal border border-[#E2E8F0] dark:border-[#334155]">
                                      {group.category}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 flex items-center gap-3 flex-wrap">
                                  <span>
                                    Latest request:{' '}
                                    <strong className="text-[#0F172A] dark:text-[#F8FAFC]">
                                      {new Date(group.latestDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </strong>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {group.requesters.length > 0
                                      ? `${group.requesters.length} unique email${group.requesters.length > 1 ? 's' : ''}`
                                      : 'Anonymous submissions'}
                                  </span>
                                  {group.totalNotesCount > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-[#2563EB] dark:text-[#60A5FA]">
                                        <StickyNote className="w-3 h-3" />
                                        {group.totalNotesCount} notes
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status and Expand Arrow */}
                            <div className="flex items-center gap-3 self-end sm:self-center">
                              {/* Status Pills Breakdown */}
                              <div className="flex items-center gap-1.5 text-[11px]">
                                {group.statusBreakdown.new > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
                                    {group.statusBreakdown.new} New
                                  </span>
                                )}
                                {group.statusBreakdown.in_progress > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-medium">
                                    {group.statusBreakdown.in_progress} In Progress
                                  </span>
                                )}
                                {group.statusBreakdown.completed > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                                    {group.statusBreakdown.completed} Done
                                  </span>
                                )}
                                {group.statusBreakdown.declined > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
                                    {group.statusBreakdown.declined} Declined
                                  </span>
                                )}
                              </div>

                              <a
                                href={`/admin/tools?createFromRequest=${encodeURIComponent(group.toolName)}&cat=${encodeURIComponent(group.category || '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2563EB] text-[#FFFFFF] text-xs font-medium hover:bg-[#1D4ED8] transition-colors shadow-2xs"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Build Tool</span>
                              </a>

                              <div className="p-1 rounded-md text-[#94A3B8]">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Submissions Nested List */}
                          {isExpanded && (
                            <div className="bg-[#F8FAFC] dark:bg-[#0B0F17] p-4 sm:p-5 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-2">
                                Submissions for "{group.toolName}" ({group.requests.length})
                              </div>
                              <div className="space-y-2.5">
                                {group.requests.map((subReq) => (
                                  <div
                                    key={subReq.id}
                                    className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="space-y-1 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                                          {subReq.id}
                                        </span>
                                        <span className="text-[#0F172A] dark:text-[#F8FAFC] font-semibold">
                                          {subReq.requesterName || 'Anonymous'}
                                        </span>
                                        {subReq.requesterEmail && (
                                          <a
                                            href={`mailto:${subReq.requesterEmail}`}
                                            className="text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                                          >
                                            {subReq.requesterEmail}
                                          </a>
                                        )}
                                        <span className="text-[#94A3B8]">
                                          {new Date(subReq.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                                        {subReq.description}
                                      </p>
                                      {subReq.useCase && (
                                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] italic">
                                          Use case: {subReq.useCase}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <select
                                        value={subReq.status}
                                        onChange={(e) =>
                                          handleStatusChange(
                                            subReq.id,
                                            e.target.value as ToolRequestStatus
                                          )
                                        }
                                        className="text-xs px-2 py-1 rounded bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                                      >
                                        <option value="new">New</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="declined">Declined</option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveNoteRequest(subReq);
                                          setIsNotesModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 rounded border border-[#CBD5E1] dark:border-[#334155] text-xs font-medium hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                                      >
                                        Notes ({subReq.adminNotes?.length || 0})
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Internal Admin Notes Modal */}
      <ToolRequestNotesModal
        request={activeNoteRequest}
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setActiveNoteRequest(null);
        }}
        onUpdated={() => {
          reloadData();
          if (activeNoteRequest) {
            const updated = getToolRequests().find((r) => r.id === activeNoteRequest.id);
            setActiveNoteRequest(updated || null);
          }
        }}
        adminEmail={session?.user?.email || 'admin@onlinetools.internal'}
      />

      {/* Admin Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Update Admin Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordStatus(null);
                }}
                className="p-1 rounded text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {passwordStatus && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    passwordStatus.success
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordStatus(null);
                  }}
                  className="px-3 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] text-xs font-semibold disabled:opacity-50"
                >
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Confirm Deletion
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                {deleteConfirmTarget.type === 'bulk'
                  ? `Are you sure you want to permanently delete these ${deleteConfirmTarget.count} selected tool requests? This action cannot be undone.`
                  : 'Are you sure you want to permanently delete this tool request record? This action cannot be undone.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3 py-1.5 rounded-md border border-[#CBD5E1] dark:border-[#334155] text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmTarget.type === 'bulk') {
                    handleBulkDelete();
                  } else if (deleteConfirmTarget.id) {
                    handleSingleDelete(deleteConfirmTarget.id);
                  }
                }}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-[#FFFFFF] text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Delete Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
