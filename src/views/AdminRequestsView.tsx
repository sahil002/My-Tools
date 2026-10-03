import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import {
  Sparkles,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Filter,
  StickyNote,
  Mail,
  Calendar,
  Tag,
  User,
  Check,
  AlertTriangle,
  Bug,
  HelpCircle,
  FileQuestion,
  ExternalLink,
  X,
} from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { ToolRequestNotesModal } from '../components/admin/ToolRequestNotesModal';
import {
  AdminSession,
  getActiveAdminSession,
  getAdminLoginRoute,
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
import {
  getAllToolIssues,
  updateToolIssueStatus,
  deleteToolIssue,
  ToolIssue,
  TOOL_ISSUES_CHANGED_EVENT,
} from '../services/toolIssuesService';
import { SEOHelmet } from '../components/SEOHelmet';

type MainTab = 'requests' | 'issues';
type ViewMode = 'individual' | 'grouped';
type StatusFilter = 'all' | ToolRequestStatus;
type SortOption = 'newest' | 'oldest' | 'most_requested' | 'name';

export function AdminRequestsView() {
  const { navigate } = useRouter();
  const [, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Active top tab: Requests vs Issue Reports
  const [activeTab, setActiveTab] = useState<MainTab>('requests');

  // Requests states
  const [requests, setRequests] = useState<ToolRequest[]>(() => getToolRequests());
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeNoteRequest, setActiveNoteRequest] = useState<ToolRequest | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Tool Issues states
  const [issues, setIssues] = useState<ToolIssue[]>(() => getAllToolIssues());
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');
  const [issueSearchQuery, setIssueSearchQuery] = useState('');
  const [selectedIssueDetail, setSelectedIssueDetail] = useState<ToolIssue | null>(null);

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

  // Reload data listeners
  const reloadData = () => {
    setRequests(getToolRequests());
    setIssues(getAllToolIssues());
  };

  useEffect(() => {
    window.addEventListener(TOOL_REQUESTS_CHANGED_EVENT, reloadData);
    window.addEventListener(TOOL_ISSUES_CHANGED_EVENT, reloadData);
    return () => {
      window.removeEventListener(TOOL_REQUESTS_CHANGED_EVENT, reloadData);
      window.removeEventListener(TOOL_ISSUES_CHANGED_EVENT, reloadData);
    };
  }, []);

  // Request stats
  const requestStats = useMemo(() => getToolRequestsStats(), [requests]);

  // Issue stats
  const issueStats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === 'open').length;
    const investigating = issues.filter((i) => i.status === 'investigating').length;
    const resolved = issues.filter((i) => i.status === 'resolved').length;
    return { total, open, investigating, resolved };
  }, [issues]);

  // Categories list for filter
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    for (const r of requests) {
      if (r.category) cats.add(r.category);
    }
    return Array.from(cats).sort();
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = req.toolName.toLowerCase().includes(query);
        const matchDesc = req.description.toLowerCase().includes(query);
        const matchEmail = (req.requesterEmail || '').toLowerCase().includes(query);
        const matchRequester = (req.requesterName || '').toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchEmail && !matchRequester) return false;
      }
      return true;
    });
  }, [requests, statusFilter, categoryFilter, searchQuery]);

  // Sorted requests
  const sortedRequests = useMemo(() => {
    const list = [...filteredRequests];
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.toolName.localeCompare(b.toolName));
    } else if (sortBy === 'most_requested') {
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

  // Grouped requests
  const groupedRequests = useMemo(() => {
    return getGroupedToolRequests(filteredRequests);
  }, [filteredRequests]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (issueStatusFilter !== 'all' && iss.status !== issueStatusFilter) return false;
      if (issueTypeFilter !== 'all' && iss.issueType !== issueTypeFilter) return false;
      if (issueSearchQuery.trim()) {
        const q = issueSearchQuery.toLowerCase().trim();
        const matchTool = iss.toolName.toLowerCase().includes(q) || iss.toolSlug.toLowerCase().includes(q);
        const matchDesc = iss.description.toLowerCase().includes(q);
        const matchEmail = (iss.userEmail || '').toLowerCase().includes(q);
        if (!matchTool && !matchDesc && !matchEmail) return false;
      }
      return true;
    });
  }, [issues, issueStatusFilter, issueTypeFilter, issueSearchQuery]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedRequests.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRequestStatusChange = (id: string, status: ToolRequestStatus) => {
    updateToolRequestStatus(id, status);
    reloadData();
    setActionNotice('Status updated.');
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleDeleteRequest = (id: string) => {
    if (window.confirm('Delete this tool request?')) {
      deleteToolRequest(id);
      reloadData();
      setActionNotice('Request deleted.');
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  const handleIssueStatusChange = (id: string, status: ToolIssue['status']) => {
    updateToolIssueStatus(id, status);
    reloadData();
    if (selectedIssueDetail && selectedIssueDetail.id === id) {
      setSelectedIssueDetail({ ...selectedIssueDetail, status });
    }
    setActionNotice('Issue status updated.');
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleDeleteIssue = (id: string) => {
    if (window.confirm('Delete this issue report?')) {
      deleteToolIssue(id);
      if (selectedIssueDetail?.id === id) setSelectedIssueDetail(null);
      reloadData();
      setActionNotice('Issue report deleted.');
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  const exportRequestsCSV = () => {
    const headers = ['ID', 'Tool Name', 'Category', 'Description', 'Requester', 'Email', 'Status', 'Date'];
    const rows = sortedRequests.map((r) => [
      r.id,
      `"${r.toolName.replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${(r.requesterName || '').replace(/"/g, '""')}"`,
      `"${(r.requesterEmail || '').replace(/"/g, '""')}"`,
      r.status,
      r.createdAt,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tool-requests-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex items-center justify-center font-sans">
        <div className="text-xs text-[#6D6582]">Authenticating session...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAF9FE] text-[#1E1035] overflow-hidden font-sans">
      <SEOHelmet
        title="Tool Requests & Issue Reports – Admin Dashboard"
        description="Review community tool requests and reported bugs from users across all web utilities."
        canonicalPath="/admin/requests"
      />

      <AdminSidebar currentPath="/admin/requests" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminTopNav />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Community Demands &amp; Feedback</span>
              </div>
              <h1 className="text-2xl font-heading font-extrabold text-[#1E1035] tracking-tight">
                Requests &amp; Issue Reports
              </h1>
              <p className="text-xs text-[#6D6582] mt-0.5">
                Manage user-submitted tool requests from /request-a-tool and reported bugs from inside interactive tools.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'requests' && (
                <button
                  type="button"
                  onClick={exportRequestsCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-heading font-semibold text-[#1E1035] bg-white border border-[#DDD6FE] hover:bg-[#F5F3FF] transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Export CSV</span>
                </button>
              )}
              <button
                type="button"
                onClick={reloadData}
                className="p-2 rounded-xl text-[#6D6582] bg-white border border-[#DDD6FE] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer shadow-2xs"
                title="Refresh from DB"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Notice */}
          {actionNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{actionNotice}</span>
            </div>
          )}

          {/* Top Tabs Switcher */}
          <div className="flex items-center gap-3 border-b border-[#EDE9FE] pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white text-[#6D6582] hover:text-[#1E1035] border border-[#EDE9FE]'
              }`}
            >
              <FileQuestion className="w-4 h-4" />
              <span>Tool Requests ({requests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('issues')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
                activeTab === 'issues'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white text-[#6D6582] hover:text-[#1E1035] border border-[#EDE9FE]'
              }`}
            >
              <Bug className="w-4 h-4" />
              <span>Reported Issues &amp; Bugs ({issues.length})</span>
              {issueStats.open > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {issueStats.open}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: TOOL REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    statusFilter === 'new'
                      ? 'bg-[#F5F3FF] border-[#7C3AED] shadow-xs'
                      : 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-[#6D6582]">New / In Review</span>
                    <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1E1035]">{requestStats.newCount}</span>
                    <span className="text-[11px] text-[#7C3AED] font-medium">Needs triage</span>
                  </div>
                </div>

                <div
                  onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    statusFilter === 'in_progress'
                      ? 'bg-amber-50 border-amber-400 shadow-xs'
                      : 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-[#6D6582]">In Progress</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1E1035]">{requestStats.inProgress}</span>
                    <span className="text-[11px] text-amber-600 font-medium">Under dev</span>
                  </div>
                </div>

                <div
                  onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                      : 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-[#6D6582]">Completed</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1E1035]">{requestStats.completed}</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Shipped</span>
                  </div>
                </div>

                <div
                  onClick={() => setStatusFilter('all')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#F5F3FF] border-[#7C3AED] shadow-xs'
                      : 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-[#6D6582]">Total Requests</span>
                    <div className="w-7 h-7 rounded-lg bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1E1035]">{requestStats.total}</span>
                    <span className="text-[11px] text-[#6D6582]">From visitors</span>
                  </div>
                </div>
              </div>

              {/* Filters & Search Controls */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE9FE] space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#9D95B3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search requests, users, emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] focus:bg-white rounded-xl text-xs text-[#1E1035] outline-none shadow-2xs transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#9D95B3] hover:text-[#1E1035] cursor-pointer"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    {/* View Mode */}
                    <div className="flex items-center p-0.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('individual')}
                        className={`px-3 py-1.5 rounded-lg font-heading font-semibold transition-colors cursor-pointer ${
                          viewMode === 'individual'
                            ? 'bg-white text-[#7C3AED] shadow-2xs'
                            : 'text-[#6D6582] hover:text-[#1E1035]'
                        }`}
                      >
                        Individual ({sortedRequests.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('grouped')}
                        className={`px-3 py-1.5 rounded-lg font-heading font-semibold transition-colors cursor-pointer ${
                          viewMode === 'grouped'
                            ? 'bg-white text-[#7C3AED] shadow-2xs'
                            : 'text-[#6D6582] hover:text-[#1E1035]'
                        }`}
                      >
                        Grouped Demand ({groupedRequests.length})
                      </button>
                    </div>

                    {/* Category Filter */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs text-[#1E1035] outline-none"
                    >
                      <option value="all">All Categories</option>
                      {categoriesList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      className="px-2.5 py-1.5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs text-[#1E1035] outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-xs">
                    <span className="font-heading font-semibold text-[#7C3AED]">
                      {selectedIds.size} request(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          bulkUpdateToolRequestStatus(Array.from(selectedIds), 'completed');
                          setSelectedIds(new Set());
                          reloadData();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        Mark Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete ${selectedIds.size} selected requests?`)) {
                            bulkDeleteToolRequests(Array.from(selectedIds));
                            setSelectedIds(new Set());
                            reloadData();
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 cursor-pointer"
                      >
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Individual View Table */}
              {viewMode === 'individual' && (
                <div className="bg-white border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#EDE9FE] bg-[#FAF9FE] text-[#6D6582] font-heading font-bold uppercase tracking-wider">
                          <th className="py-3 px-4 w-10">
                            <input
                              type="checkbox"
                              checked={sortedRequests.length > 0 && selectedIds.size === sortedRequests.length}
                              onChange={(e) => handleSelectAll(e.target.value === 'true' || e.target.checked)}
                              className="rounded border-[#DDD6FE] text-[#7C3AED] focus:ring-[#7C3AED]"
                            />
                          </th>
                          <th className="py-3 px-4">Tool Requested</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Requester</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDE9FE]">
                        {sortedRequests.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-[#6D6582]">
                              <FileQuestion className="w-8 h-8 text-[#9D95B3] mx-auto mb-2 opacity-60" />
                              <p className="font-heading font-semibold text-sm text-[#1E1035]">No Tool Requests Found</p>
                              <p className="text-xs text-[#6D6582] mt-0.5">When visitors submit suggestions on /request-a-tool, they will appear here.</p>
                            </td>
                          </tr>
                        ) : (
                          sortedRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-[#FAF9FE]/60 transition-colors">
                              <td className="py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(req.id)}
                                  onChange={() => handleToggleSelect(req.id)}
                                  className="rounded border-[#DDD6FE] text-[#7C3AED] focus:ring-[#7C3AED]"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-heading font-bold text-[#1E1035]">{req.toolName}</div>
                                <div className="text-[11px] text-[#6D6582] line-clamp-1 max-w-xs">{req.description}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                                  {req.category || 'General'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-[#1E1035] font-medium">{req.requesterName || 'Visitor'}</div>
                                <div className="text-[11px] text-[#6D6582] truncate max-w-[140px]">{req.requesterEmail || '—'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={req.status}
                                  onChange={(e) => handleRequestStatusChange(req.id, e.target.value as ToolRequestStatus)}
                                  className={`px-2 py-1 rounded-lg text-xs font-heading font-semibold border outline-none cursor-pointer ${
                                    req.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : req.status === 'in_progress'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : req.status === 'declined'
                                      ? 'bg-slate-50 text-slate-600 border-slate-200'
                                      : 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]'
                                  }`}
                                >
                                  <option value="new">New</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="declined">Declined</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-[#6D6582] text-[11px] whitespace-nowrap">
                                {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveNoteRequest(req);
                                      setIsNotesModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                                    title="View details & internal notes"
                                  >
                                    <StickyNote className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRequest(req.id)}
                                    className="p-1.5 rounded-lg text-[#6D6582] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete request"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grouped Demand View */}
              {viewMode === 'grouped' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedRequests.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white border border-[#EDE9FE] rounded-2xl text-[#6D6582]">
                      <FileQuestion className="w-8 h-8 text-[#9D95B3] mx-auto mb-2 opacity-60" />
                      <p className="font-heading font-semibold text-sm text-[#1E1035]">No Grouped Demands</p>
                    </div>
                  ) : (
                    groupedRequests.map((g) => (
                      <div
                        key={g.groupKey}
                        className="p-4 rounded-2xl bg-white border border-[#EDE9FE] hover:border-[#DDD6FE] shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-heading font-bold text-sm text-[#1E1035]">{g.toolName}</h3>
                            <span className="text-[11px] text-[#7C3AED] font-heading font-semibold">
                              {g.category || 'General Utility'}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                            {g.count} {g.count === 1 ? 'request' : 'requests'}
                          </span>
                        </div>

                        <p className="text-xs text-[#6D6582] line-clamp-2">
                          {g.requests[0]?.description || 'No description provided.'}
                        </p>

                        <div className="pt-2 border-t border-[#EDE9FE] flex items-center justify-between text-[11px] text-[#6D6582]">
                          <span>Latest: {new Date(g.latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="font-heading font-semibold text-[#1E1035]">
                            {g.requesters.length} unique user(s)
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REPORTED ISSUES & BUGS */}
          {activeTab === 'issues' && (
            <div className="space-y-6">
              {/* Quick Issue Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setIssueStatusFilter(issueStatusFilter === 'open' ? 'all' : 'open')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    issueStatusFilter === 'open'
                      ? 'bg-rose-50 border-rose-400 shadow-xs'
                      : 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-[#6D6582]">Open Issues</span>
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                      <Bug className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1E1035]">{issueStats.open}</span>
                    <span className="text-[11px] text-rose-600 font-medium">Needs fix</span>
                  </div>
                </div>

                <div
                  onClick={() => setIssueStatusFilter(issueStatusFilter === 'investigating' ? 'all' : 'investigating')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    issueStatusFilter === 'investigating'
                      ? 'bg-amber-50 border-amber-400 shadow-xs'
                      : 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-[#6D6582]">Investigating</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1E1035]">{issueStats.investigating}</span>
                    <span className="text-[11px] text-amber-600 font-medium">In review</span>
                  </div>
                </div>

                <div
                  onClick={() => setIssueStatusFilter(issueStatusFilter === 'resolved' ? 'all' : 'resolved')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    issueStatusFilter === 'resolved'
                      ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                      : 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-[#6D6582]">Resolved</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1E1035]">{issueStats.resolved}</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Fixed</span>
                  </div>
                </div>

                <div
                  onClick={() => setIssueStatusFilter('all')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    issueStatusFilter === 'all'
                      ? 'bg-[#F5F3FF] border-[#7C3AED] shadow-xs'
                      : 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-[#6D6582]">Total Reports</span>
                    <div className="w-7 h-7 rounded-lg bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                      <Bug className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#1E1035]">{issueStats.total}</span>
                    <span className="text-[11px] text-[#6D6582]">From tools</span>
                  </div>
                </div>
              </div>

              {/* Issue Filters & Search */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE9FE] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#9D95B3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search issues, tools, emails..."
                    value={issueSearchQuery}
                    onChange={(e) => setIssueSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {/* Issue Type Filter */}
                  <select
                    value={issueTypeFilter}
                    onChange={(e) => setIssueTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs text-[#1E1035] outline-none"
                  >
                    <option value="all">All Issue Types</option>
                    <option value="calculation_incorrect">Calculation Incorrect</option>
                    <option value="button_not_working">Button Not Working</option>
                    <option value="layout_broken">Layout Broken</option>
                    <option value="performance_slow">Performance Slow</option>
                    <option value="other">Other</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={issueStatusFilter}
                    onChange={(e) => setIssueStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs text-[#1E1035] outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              {/* Issues List Table */}
              <div className="bg-white border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#EDE9FE] bg-[#FAF9FE] text-[#6D6582] font-heading font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Tool</th>
                        <th className="py-3 px-4">Problem Type</th>
                        <th className="py-3 px-4">Issue Description</th>
                        <th className="py-3 px-4">User Contact</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Reported</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE9FE]">
                      {filteredIssues.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#6D6582]">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
                            <p className="font-heading font-semibold text-sm text-[#1E1035]">No Bug Reports Found</p>
                            <p className="text-xs text-[#6D6582] mt-0.5">When users report a problem using &apos;Report Issue&apos; in a tool, it will appear here.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredIssues.map((iss) => (
                          <tr key={iss.id} className="hover:bg-[#FAF9FE]/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-heading font-bold text-[#1E1035]">{iss.toolName}</div>
                              <div className="text-[11px] text-[#7C3AED] font-mono">/tools/{iss.toolSlug}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-heading font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                {iss.issueType.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="text-[#1E1035] line-clamp-2 leading-relaxed">{iss.description}</div>
                              {iss.inputValues && (
                                <div className="text-[10px] text-[#6D6582] mt-0.5 font-mono truncate">Inputs: {iss.inputValues}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[#6D6582] text-[11px]">{iss.userEmail || 'Anonymous'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={iss.status}
                                onChange={(e) => handleIssueStatusChange(iss.id, e.target.value as ToolIssue['status'])}
                                className={`px-2 py-1 rounded-lg text-xs font-heading font-semibold border outline-none cursor-pointer ${
                                  iss.status === 'resolved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : iss.status === 'investigating'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : iss.status === 'dismissed'
                                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                <option value="open">Open</option>
                                <option value="investigating">Investigating</option>
                                <option value="resolved">Resolved</option>
                                <option value="dismissed">Dismissed</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-[#6D6582] text-[11px] whitespace-nowrap">
                              {new Date(iss.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedIssueDetail(iss)}
                                  className="p-1.5 rounded-lg text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                                  title="View full report details"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteIssue(iss.id)}
                                  className="p-1.5 rounded-lg text-[#6D6582] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete issue report"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Internal Notes Modal for Requests */}
      <ToolRequestNotesModal
        request={activeNoteRequest}
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setActiveNoteRequest(null);
        }}
        onUpdated={reloadData}
      />

      {/* Issue Detail Modal */}
      {selectedIssueDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1035]/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto font-sans animate-in fade-in"
        >
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                  <Bug className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#1E1035]">Issue Report Details</h3>
                  <p className="text-[11px] text-[#7C3AED] font-mono">{selectedIssueDetail.toolName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssueDetail(null)}
                className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#FAF9FE] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                <div>
                  <span className="text-[#6D6582] font-semibold block mb-0.5">Problem Type</span>
                  <span className="text-[#1E1035] font-medium capitalize">{selectedIssueDetail.issueType.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-[#6D6582] font-semibold block mb-0.5">Status</span>
                  <select
                    value={selectedIssueDetail.status}
                    onChange={(e) => handleIssueStatusChange(selectedIssueDetail.id, e.target.value as ToolIssue['status'])}
                    className="bg-white border border-[#DDD6FE] rounded-lg px-2 py-0.5 text-xs text-[#1E1035] outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <div>
                  <span className="text-[#6D6582] font-semibold block mb-0.5">Reported By</span>
                  <span className="text-[#1E1035] font-medium">{selectedIssueDetail.userEmail || 'Anonymous Visitor'}</span>
                </div>
                <div>
                  <span className="text-[#6D6582] font-semibold block mb-0.5">Date Reported</span>
                  <span className="text-[#1E1035] font-medium">
                    {new Date(selectedIssueDetail.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#6D6582] font-semibold block mb-1">Issue Description:</span>
                <div className="p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-[#1E1035] leading-relaxed whitespace-pre-wrap">
                  {selectedIssueDetail.description}
                </div>
              </div>

              {selectedIssueDetail.inputValues && (
                <div>
                  <span className="text-[#6D6582] font-semibold block mb-1">Inputs Used:</span>
                  <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] font-mono text-[11px] text-[#1E1035]">
                    {selectedIssueDetail.inputValues}
                  </div>
                </div>
              )}

              {selectedIssueDetail.expectedBehavior && (
                <div>
                  <span className="text-[#6D6582] font-semibold block mb-1">Expected Behavior:</span>
                  <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-[#1E1035]">
                    {selectedIssueDetail.expectedBehavior}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#EDE9FE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteIssue(selectedIssueDetail.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Issue</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIssueDetail(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-heading font-semibold bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
