import React, { useState, useEffect, useMemo } from 'react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { WordPressGuideEditor } from '../components/admin/WordPressGuideEditor';
import {
  getAllMergedGuidesSync,
  saveGuideArticle,
  deleteGuideArticle,
  syncGuidesFromSupabase,
  pushLocalGuidesToSupabase,
  GUIDES_UPDATED_EVENT,
  SUPABASE_GUIDES_SQL,
  SUPABASE_GUIDES_CLEANUP_SQL,
  testSupabaseGuidesConnection,
  SupabaseGuidesStatus,
} from '../services/guideStorageDB';
import {
  getAllGuideMetricsSync,
  getAllGuideCommentsSync,
  updateCommentStatus,
  deleteGuideComment,
  GuideMetrics,
  GuideComment,
  GUIDE_METRICS_UPDATED_EVENT,
  GUIDE_COMMENTS_UPDATED_EVENT,
} from '../services/guideAnalyticsService';
import {
  isSupabaseConfigured,
  getActiveSupabaseCredentials,
} from '../lib/supabaseClient';
import { GuideArticle } from '../types';
import { CATEGORIES } from '../data/categories';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit,
  ExternalLink,
  Copy,
  Check,
  Database,
  X,
  Eye,
  RefreshCw,
  Upload,
  Heart,
  Share2,
  MessageSquare,
  Star,
  BarChart3,
  Layers,
} from 'lucide-react';
import { useRouter } from '../context/RouterContext';

export function AdminGuidesView() {
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guides, setGuides] = useState<GuideArticle[]>(getAllMergedGuidesSync);
  const [metrics, setMetrics] = useState<Record<string, GuideMetrics>>(getAllGuideMetricsSync);
  const [comments, setComments] = useState<GuideComment[]>(getAllGuideCommentsSync);

  // Active top navigation tab inside Blog & Guides manager: 'insights' | 'comments' | 'database'
  const [activeTab, setActiveTab] = useState<'insights' | 'comments' | 'database'>('insights');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes' | 'comments' | 'score'>('date');

  // Toast notice
  const [actionNotice, setActionNotice] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // In-app permanent deletion modal (replaces window.confirm)
  const [guideToDelete, setGuideToDelete] = useState<GuideArticle | null>(null);
  const [isDeletingGuide, setIsDeletingGuide] = useState(false);

  // Direct Supabase Diagnostics & Connection Status
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseGuidesStatus | null>(null);
  const [isProbingSupabase, setIsProbingSupabase] = useState(false);
  const [isPushingSupabase, setIsPushingSupabase] = useState(false);
  const [activeSqlTab, setActiveSqlTab] = useState<'cleanup' | 'fullSchema'>('cleanup');
  const [copiedSqlTab, setCopiedSqlTab] = useState<'cleanup' | 'fullSchema' | null>(null);

  // WordPress Visual Editor State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [guideBeingEdited, setGuideBeingEdited] = useState<GuideArticle | null>(null);
  const [isSavingArticle, setIsSavingArticle] = useState(false);

  // Real-time synchronization
  useEffect(() => {
    const handleGuidesUpdate = () => setGuides(getAllMergedGuidesSync());
    const handleMetricsUpdate = () => setMetrics(getAllGuideMetricsSync());
    const handleCommentsUpdate = () => setComments(getAllGuideCommentsSync());

    window.addEventListener(GUIDES_UPDATED_EVENT, handleGuidesUpdate);
    window.addEventListener(GUIDE_METRICS_UPDATED_EVENT, handleMetricsUpdate);
    window.addEventListener(GUIDE_COMMENTS_UPDATED_EVENT, handleCommentsUpdate);

    // Initial silent Supabase pull and auto-probe
    if (isSupabaseConfigured()) {
      syncGuidesFromSupabase().catch(() => {});
      testSupabaseGuidesConnection().then(setSupabaseStatus).catch(() => {});
    }

    return () => {
      window.removeEventListener(GUIDES_UPDATED_EVENT, handleGuidesUpdate);
      window.removeEventListener(GUIDE_METRICS_UPDATED_EVENT, handleMetricsUpdate);
      window.removeEventListener(GUIDE_COMMENTS_UPDATED_EVENT, handleCommentsUpdate);
    };
  }, []);

  const showNotification = (text: string, isError = false) => {
    setActionNotice({ text, isError });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const copySql = (tab: 'cleanup' | 'fullSchema' = 'cleanup') => {
    const active = tab === 'fullSchema' ? 'fullSchema' : 'cleanup';
    const sqlText = active === 'cleanup' ? SUPABASE_GUIDES_CLEANUP_SQL : SUPABASE_GUIDES_SQL;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setCopiedSqlTab(active);
    showNotification(
      active === 'cleanup'
        ? '1-Click Cleanup & Rename SQL copied to clipboard!'
        : 'Full Supabase Schema SQL copied to clipboard!'
    );
    setTimeout(() => {
      setCopiedSql(false);
      setCopiedSqlTab(null);
    }, 3000);
  };

  const handleTestSupabaseConnection = async () => {
    setIsProbingSupabase(true);
    try {
      const res = await testSupabaseGuidesConnection();
      setSupabaseStatus(res);
      if (res.detectedGuideTable) {
        showNotification(
          `Connected! Found table "${res.detectedGuideTable}" with ${res.guidesCount} guide(s).`
        );
      } else {
        showNotification(res.error || 'Connected, but no guide tables found yet.', true);
      }
    } finally {
      setIsProbingSupabase(false);
    }
  };

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await syncGuidesFromSupabase();
      showNotification(res.message, !res.success);
      setGuides(getAllMergedGuidesSync());
      // Refresh status probe
      testSupabaseGuidesConnection().then(setSupabaseStatus).catch(() => {});
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handlePushAllToSupabase = async () => {
    setIsPushingSupabase(true);
    try {
      const res = await pushLocalGuidesToSupabase();
      showNotification(res.message, !res.success);
      // Refresh status probe
      testSupabaseGuidesConnection().then(setSupabaseStatus).catch(() => {});
    } finally {
      setIsPushingSupabase(false);
    }
  };

  // Open In-App Delete Confirmation Modal
  const handleDeleteGuide = (g: GuideArticle) => {
    setGuideToDelete(g);
  };

  // Confirm and execute safe deletion
  const confirmDeleteGuide = async () => {
    if (!guideToDelete) return;
    const targetSlug = guideToDelete.slug;
    const targetTitle = guideToDelete.title;
    setIsDeletingGuide(true);
    try {
      // Optimistically update list in local state immediately
      setGuides((prev) => prev.filter((item) => item.slug.toLowerCase().trim() !== targetSlug.toLowerCase().trim()));
      setGuideToDelete(null);

      const res = await deleteGuideArticle(targetSlug);
      showNotification(res.message || `Guide "${targetTitle}" deleted permanently.`, !res.success);

      // Re-read latest state
      setGuides(getAllMergedGuidesSync());
    } finally {
      setIsDeletingGuide(false);
    }
  };

  // Filtered & Sorted Guides List
  const filteredGuides = useMemo(() => {
    return guides
      .filter((g) => {
        const matchCat = categoryFilter === 'all' || g.category === categoryFilter;
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'published' && !g.isDraft) ||
          (statusFilter === 'draft' && g.isDraft);

        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          !q ||
          g.title.toLowerCase().includes(q) ||
          g.slug.toLowerCase().includes(q) ||
          (g.targetKeyword && g.targetKeyword.toLowerCase().includes(q)) ||
          g.description.toLowerCase().includes(q);

        return matchCat && matchStatus && matchQuery;
      })
      .sort((a, b) => {
        const mA = metrics[a.slug] || { views: 0, likes: 0, commentsCount: 0 };
        const mB = metrics[b.slug] || { views: 0, likes: 0, commentsCount: 0 };

        if (sortBy === 'views') return (mB.views || 0) - (mA.views || 0);
        if (sortBy === 'likes') return (mB.likes || 0) - (mA.likes || 0);
        if (sortBy === 'comments') return (mB.commentsCount || 0) - (mA.commentsCount || 0);
        if (sortBy === 'score') return (b.seoScore || 0) - (a.seoScore || 0);

        // default date
        return new Date(b.publishedDate || 0).getTime() - new Date(a.publishedDate || 0).getTime();
      });
  }, [guides, categoryFilter, statusFilter, searchQuery, sortBy, metrics]);

  // Comment Actions
  const handleApproveComment = (id: string) => {
    updateCommentStatus(id, 'approved');
    showNotification('Comment approved and visible on live guide!');
  };

  const handleRejectComment = (id: string) => {
    updateCommentStatus(id, 'rejected');
    showNotification('Comment marked as rejected.');
  };

  const handleDeleteComment = (id: string) => {
    deleteGuideComment(id);
    showNotification('Comment deleted permanently.');
  };

  return (
    <div className="flex h-screen bg-[#FAFAFD] text-[#1E1035] overflow-hidden font-sans">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath="/admin/guides"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(true)} pageTitle="Blog & Guides" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6">
          {/* Action Notification Toast Banner */}
          {actionNotice && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-heading font-semibold shadow-xs animate-in fade-in duration-200 ${
                actionNotice.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {actionNotice.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{actionNotice.text}</span>
            </div>
          )}

          {/* Header & Primary Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#7C3AED]" />
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight text-[#1E1035]">
                  Blog &amp; Guides Manager
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                  {guides.length} Articles
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6D6582] mt-0.5">
                Publish rich mathematical articles, format in WordPress WYSIWYG editor, optimize with real-time RankMath SEO, and track audience engagement.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="px-3 py-2 bg-white hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#1E1035] hover:text-[#7C3AED] rounded-xl text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Supabase SQL</span>
              </button>

              <button
                type="button"
                onClick={handleSyncSupabase}
                disabled={isSyncingSupabase}
                className="px-3 py-2 bg-white hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#6D6582] hover:text-[#1E1035] rounded-xl text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Synchronize guides with Supabase table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin text-[#7C3AED]' : ''}`} />
                <span>{isSyncingSupabase ? 'Syncing...' : 'Sync Supabase'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGuideBeingEdited(null);
                  setIsCreatingNew(true);
                }}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write / Add New Post</span>
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-[#EDE9FE] pb-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'bg-white text-[#6D6582] hover:text-[#1E1035] border border-[#EDE9FE]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>All Published Guides &amp; Insights ({guides.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'comments'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'bg-white text-[#6D6582] hover:text-[#1E1035] border border-[#EDE9FE]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Reader Comments ({comments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'bg-white text-[#6D6582] hover:text-[#1E1035] border border-[#EDE9FE]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Supabase Connection &amp; Schema</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: ALL PUBLISHED GUIDES & ENGAGEMENT INSIGHTS */}
          {/* ========================================================================= */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              {/* Search & Filter Controls (Guaranteed Zero Inner Border) */}
              <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-[#9D95B3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, slug, or keyword..."
                    className="w-full pl-9 pr-8 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] focus:bg-white rounded-xl text-xs text-[#1E1035] outline-none shadow-2xs transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#9D95B3] hover:text-[#1E1035] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] font-heading font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-[#7C3AED]"
                  >
                    <option value="all">All Categories ({guides.length})</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] font-heading font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-[#7C3AED]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published Only</option>
                    <option value="draft">Drafts Only</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] font-heading font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-[#7C3AED]"
                  >
                    <option value="date">Sort by: Date</option>
                    <option value="views">Sort by: Most Views</option>
                    <option value="likes">Sort by: Most Likes</option>
                    <option value="comments">Sort by: Most Comments</option>
                    <option value="score">Sort by: Highest SEO Score</option>
                  </select>
                </div>
              </div>

              {/* Guides List Table with Real-Time Insights */}
              <div className="bg-white border border-[#EDE9FE] rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF9FE] border-b border-[#EDE9FE] text-[#6D6582] font-heading font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Article Title &amp; Permalinks</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Views &amp; Read Time</th>
                        <th className="py-3 px-4">Likes / Shares</th>
                        <th className="py-3 px-4">Favs</th>
                        <th className="py-3 px-4">Comments</th>
                        <th className="py-3 px-4">RankMath SEO</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE9FE]">
                      {filteredGuides.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-[#6D6582]">
                            <BookOpen className="w-8 h-8 text-[#9D95B3] mx-auto mb-2 opacity-50" />
                            <p className="font-heading font-semibold text-sm">No articles match your criteria.</p>
                            <p className="text-xs text-[#9D95B3] mt-1">Try clearing your search query or create a new blog post.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredGuides.map((g) => {
                          const m = metrics[g.slug] || { views: 0, likes: 0, shares: 0, favorites: 0, avgReadTimeSeconds: 180, commentsCount: 0 };
                          const score = g.seoScore || 85;
                          const scoreColor =
                            score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                            score >= 65 ? 'text-blue-700 bg-blue-50 border-blue-200' :
                            'text-amber-700 bg-amber-50 border-amber-200';

                          const guideComments = comments.filter((c) => c.guideSlug === g.slug);
                          const totalCommentsForGuide = guideComments.length || m.commentsCount || 0;

                          return (
                            <tr key={g.slug} className="hover:bg-[#FAF9FE] transition-colors">
                              <td className="py-3 px-4 max-w-sm">
                                <div className="font-heading font-bold text-[#1E1035] text-xs line-clamp-1">
                                  {g.title}
                                </div>
                                <div className="text-[11px] text-[#7C3AED] font-mono mt-0.5">
                                  /guides/{g.slug}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                                  {g.category}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-0.5 font-mono text-[11px]">
                                  <div className="flex items-center gap-1 text-[#1E1035]">
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{m.views.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[#6D6582] text-[10px]">
                                    <Clock className="w-3 h-3 text-[#9D95B3]" />
                                    <span>{g.readingTime || `${Math.ceil((m.avgReadTimeSeconds || 180) / 60)}m read`}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5 text-[11px] font-mono">
                                  <span className="flex items-center gap-1 text-rose-600" title="Likes">
                                    <Heart className="w-3 h-3 fill-rose-500" />
                                    <span>{m.likes}</span>
                                  </span>
                                  <span className="flex items-center gap-1 text-[#6D6582]" title="Shares">
                                    <Share2 className="w-3 h-3" />
                                    <span>{m.shares}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="flex items-center gap-1 text-amber-700 font-mono text-[11px]" title="Favorites">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                  <span>{m.favorites || 0}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('comments')}
                                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                  title="View Reader Comments"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{totalCommentsForGuide}</span>
                                </button>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-bold border ${scoreColor}`}>
                                  <Sparkles className="w-3 h-3" />
                                  <span>{score}/100</span>
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {g.isDraft ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Draft
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Published
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={`/guides/${g.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] rounded-lg transition-colors cursor-pointer"
                                    title="View Live Article"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGuideBeingEdited(g);
                                      setIsCreatingNew(false);
                                    }}
                                    className="p-1.5 text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] rounded-lg transition-colors cursor-pointer"
                                    title="Edit in WordPress WYSIWYG Editor"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGuide(g)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Permanently Delete Article"
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
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: READER COMMENTS MODERATION */}
          {/* ========================================================================= */}
          {activeTab === 'comments' && (
            <div className="bg-white border border-[#EDE9FE] rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#EDE9FE] flex items-center justify-between bg-[#FAF9FE]">
                <div>
                  <h3 className="text-sm font-heading font-bold text-[#1E1035]">Reader Comments on Guides</h3>
                  <p className="text-[11px] text-[#6D6582]">Moderate questions and discussions submitted by readers.</p>
                </div>
                <span className="text-xs font-heading font-semibold text-[#7C3AED]">
                  {comments.length} Total Comments
                </span>
              </div>

              <div className="divide-y divide-[#EDE9FE]">
                {comments.length === 0 ? (
                  <div className="p-12 text-center text-[#6D6582]">
                    <MessageSquare className="w-8 h-8 text-[#9D95B3] mx-auto mb-2 opacity-50" />
                    <p className="font-heading font-semibold text-sm">No comments submitted yet.</p>
                    <p className="text-xs text-[#9D95B3]">When users leave comments on your articles, they appear here.</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-4 hover:bg-[#FAF9FE] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-[#1E1035]">{c.authorName}</span>
                          <span className="text-[11px] text-[#9D95B3]">on</span>
                          <a
                            href={`/guides/${c.guideSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-mono text-[#7C3AED] hover:underline"
                          >
                            /guides/{c.guideSlug}
                          </a>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase ${
                            c.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#6D6582] leading-relaxed">&ldquo;{c.content}&rdquo;</p>
                        <div className="flex items-center gap-3 text-[10px] text-[#9D95B3]">
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          {c.rating && <span>Rating: {c.rating} ★</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {c.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleApproveComment(c.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-heading font-semibold cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {c.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleRejectComment(c.id)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-heading font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SUPABASE CONNECTION & SCHEMA */}
          {/* ========================================================================= */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Direct Supabase Connection Card */}
              <div className="p-5 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-heading font-bold text-[#1E1035]">
                          Project Supabase Connection
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider ${
                          isSupabaseConfigured()
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isSupabaseConfigured() ? 'Connected via Project' : 'Configured via Environment'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6D6582]">
                        Uses your centralized project Supabase connection. No manual keys required.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleTestSupabaseConnection}
                      disabled={isProbingSupabase}
                      className="px-3.5 py-2 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      title="Probe your Supabase database to check existing tables and permissions"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProbingSupabase ? 'animate-spin text-[#7C3AED]' : 'text-[#6D6582]'}`} />
                      <span>{isProbingSupabase ? 'Testing Connection...' : 'Test Database Connection'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePushAllToSupabase}
                      disabled={isPushingSupabase}
                      className="px-3.5 py-2 bg-[#FAF5FF] hover:bg-[#F3EEFF] border border-[#DDD6FE] text-[#7C3AED] rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      title="Upload all currently stored guides into your Supabase database table"
                    >
                      <Upload className={`w-3.5 h-3.5 ${isPushingSupabase ? 'animate-bounce' : ''}`} />
                      <span>{isPushingSupabase ? 'Uploading...' : 'Upload Local Guides to Supabase'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncSupabase}
                      disabled={isSyncingSupabase}
                      className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                      <span>{isSyncingSupabase ? 'Syncing...' : 'Sync from Supabase'}</span>
                    </button>
                  </div>
                </div>

                {/* Connection Status & Database Table Diagnostics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                    <span className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider block">
                      Supabase Project URL
                    </span>
                    <span className="text-xs font-mono font-medium text-[#1E1035] mt-1 block truncate">
                      {getActiveSupabaseCredentials().url || 'Configured in Project Environment'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                    <span className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider block">
                      Detected Guides Table
                    </span>
                    <span className="text-xs font-mono font-bold text-[#7C3AED] mt-1 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${supabaseStatus?.detectedGuideTable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {supabaseStatus?.detectedGuideTable
                        ? `public.${supabaseStatus.detectedGuideTable} (${supabaseStatus.guidesCount} posts)`
                        : 'Auto-detecting ("guides" / "guids")'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                    <span className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider block">
                      Comments Table
                    </span>
                    <span className="text-xs font-mono font-bold text-[#1E1035] mt-1 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${supabaseStatus?.detectedCommentTable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {supabaseStatus?.detectedCommentTable
                        ? `public.${supabaseStatus.detectedCommentTable} (${supabaseStatus.commentsCount} comments)`
                        : 'Auto-detecting ("guide_comments")'}
                    </span>
                  </div>
                </div>

                {/* Clear Advice Card on Table Structure */}
                <div className="p-4 rounded-xl bg-[#FAF5FF] border border-[#DDD6FE] text-xs text-[#1E1035] space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <h4 className="font-heading font-bold text-sm text-[#7C3AED]">
                      Table Recommendation: What to Keep & What to Clean Up
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#4C4360] leading-relaxed">
                    <p>
                      • <strong>Which table name is best?</strong> The standard database convention is <strong><code>guides</code></strong> (with an &ldquo;e&rdquo;) and <strong><code>guide_comments</code></strong> (with an underscore <code>_</code>).
                    </p>
                    <p>
                      • <strong>Why not &ldquo;guids-comment&rdquo;?</strong> In PostgreSQL / SQL, a hyphen <code>-</code> is a subtraction symbol. Tables with hyphens require double quotes everywhere (<code>&quot;guids-comment&quot;</code>), which can cause query errors.
                    </p>
                    <p>
                      • <strong>Good News:</strong> Our application automatically detects and works with <strong>both</strong> table names (<code>guids</code> and <code>guides</code>), so your articles save seamlessly right now without errors!
                    </p>
                    <p>
                      • <strong>Recommended Clean-up:</strong> If you want your database to be 100% clean and standard, run the <strong>1-Click Rename Script</strong> below in your Supabase SQL Editor. It safely renames your tables in 2 seconds without deleting any data!
                    </p>
                  </div>
                </div>

                {/* Tabbed SQL Viewers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#EDE9FE] pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSqlTab('cleanup')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold cursor-pointer transition-colors ${
                          activeSqlTab === 'cleanup'
                            ? 'bg-[#7C3AED] text-white shadow-2xs'
                            : 'bg-[#FAF9FE] text-[#6D6582] hover:bg-[#F3EEFF]'
                        }`}
                      >
                        1. 1-Click Rename &amp; Clean-up Script (Recommended)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSqlTab('fullSchema')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold cursor-pointer transition-colors ${
                          activeSqlTab === 'fullSchema'
                            ? 'bg-[#7C3AED] text-white shadow-2xs'
                            : 'bg-[#FAF9FE] text-[#6D6582] hover:bg-[#F3EEFF]'
                        }`}
                      >
                        2. Complete Fresh Table Schema DDL
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => copySql(activeSqlTab)}
                      className="px-3.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      {copiedSqlTab === activeSqlTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSqlTab === activeSqlTab ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-[#0F0A1C] text-[#E9D5FF] text-[11px] font-mono leading-relaxed overflow-x-auto border border-[#342456] max-h-[380px] select-all">
                    {activeSqlTab === 'cleanup' ? SUPABASE_GUIDES_CLEANUP_SQL : SUPABASE_GUIDES_SQL}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* WORDPRESS GUIDE VISUAL & HTML RICH EDITOR MODAL */}
      {/* ========================================================================= */}
      {(isCreatingNew || guideBeingEdited) && (
        <WordPressGuideEditor
          initialGuide={guideBeingEdited || undefined}
          onSave={async (article) => {
            setIsSavingArticle(true);
            try {
              const res = await saveGuideArticle(article);
              showNotification(res.message, !res.success);
              if (res.success) {
                setIsCreatingNew(false);
                setGuideBeingEdited(null);
                setGuides(getAllMergedGuidesSync());
                testSupabaseGuidesConnection().then(setSupabaseStatus).catch(() => {});
              }
            } finally {
              setIsSavingArticle(false);
            }
          }}
          onClose={() => {
            setIsCreatingNew(false);
            setGuideBeingEdited(null);
          }}
          isSaving={isSavingArticle}
        />
      )}

      {/* ========================================================================= */}
      {/* SUPABASE SQL VIEWER MODAL */}
      {/* ========================================================================= */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-[#EDE9FE] flex items-center justify-between bg-[#FAF9FE]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-heading font-bold text-sm text-[#1E1035]">
                  Supabase PostgreSQL Guides &amp; Comments Schema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#DDD6FE] text-xs text-[#1E1035] space-y-1 leading-relaxed">
                <p className="font-heading font-bold text-[#7C3AED]">How to run this in Supabase:</p>
                <ol className="list-decimal list-inside space-y-1 text-[#6D6582]">
                  <li>Log in to your <strong>Supabase Dashboard</strong> at <code className="bg-white px-1 py-0.5 rounded text-[#7C3AED]">supabase.com</code>.</li>
                  <li>Click on <strong>SQL Editor</strong> in the left sidebar.</li>
                  <li>Click <strong>New Query</strong>, paste the SQL code below, and click <strong>Run</strong>.</li>
                  <li>All articles published via PRBSolver Admin will automatically synchronize with your database!</li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-mono font-semibold text-[#6D6582]">guides_schema.sql</span>
                  <button
                    type="button"
                    onClick={() => copySql('fullSchema')}
                    className="px-3 py-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-[#0F0A1C] text-[#E9D5FF] text-[11px] font-mono leading-relaxed overflow-x-auto border border-[#342456] max-h-[360px] select-all">
                  {SUPABASE_GUIDES_SQL}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-[#EDE9FE] flex items-center justify-end bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-[#FAF9FE] hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#1E1035] rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE GUIDE CONFIRMATION MODAL (IN-APP SAFE DIALOG) */}
      {/* ========================================================================= */}
      {guideToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE9FE] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-heading font-extrabold text-[#1E1035]">
                Delete Guide Permanently?
              </h3>
              <p className="text-xs text-[#6D6582] leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-[#1E1035]">&ldquo;{guideToDelete.title}&rdquo;</strong>?
                This will immediately remove the article from your website, local database, and Supabase.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGuideToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-heading font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteGuide}
                disabled={isDeletingGuide}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingGuide ? 'Deleting...' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
