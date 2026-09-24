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
import { RichTextEditor } from '../components/admin/RichTextEditor';
import { SeoAnalysisPanel } from '../components/admin/SeoAnalysisPanel';
import { AutoOptimizeModal } from '../components/admin/AutoOptimizeModal';
import {
  PageDocument,
  getPageDocuments,
  savePageDocument,
  analyzeContent,
  generateAutoOptimizations,
  DEFAULT_PAGE_DOCUMENTS,
} from '../services/seoOptimizerService';
import {
  SearchCheck,
  Key,
  Sparkles,
  Save,
  CheckCircle2,
  FilePlus,
  Globe,
  Smartphone,
  Monitor,
  RotateCcw,
  ExternalLink,
  Radio,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export function AdminSeoView() {
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

  // Document management states
  const [documents, setDocuments] = useState<PageDocument[]>(() => getPageDocuments());
  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    const docs = getPageDocuments();
    return docs[0]?.id || 'guide-how-to-calculate-percentage';
  });

  // Current working fields
  const activeDoc = useMemo(() => {
    return (
      documents.find((d) => d.id === selectedDocId) ||
      documents[0] ||
      DEFAULT_PAGE_DOCUMENTS[0]
    );
  }, [documents, selectedDocId]);

  const [name, setName] = useState(activeDoc.name);
  const [slug, setSlug] = useState(activeDoc.slug);
  const [focusKeyword, setFocusKeyword] = useState(activeDoc.focusKeyword);
  const [metaTitle, setMetaTitle] = useState(activeDoc.metaTitle);
  const [metaDescription, setMetaDescription] = useState(activeDoc.metaDescription);
  const [contentHtml, setContentHtml] = useState(activeDoc.contentHtml);

  // Sync state when active document switches
  useEffect(() => {
    setName(activeDoc.name);
    setSlug(activeDoc.slug);
    setFocusKeyword(activeDoc.focusKeyword);
    setMetaTitle(activeDoc.metaTitle);
    setMetaDescription(activeDoc.metaDescription);
    setContentHtml(activeDoc.contentHtml);
  }, [activeDoc.id]);

  // Real-time SERP device preview toggle
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Auto-Optimize Modal
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);

  // Save notification toast
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    let isMounted = true;
    getActiveAdminSession().then((activeSession) => {
      if (!isMounted) return;
      if (!activeSession) {
        const loginRoute = getAdminLoginRoute();
        navigate(`${loginRoute}?redirect=/admin/seo`);
      } else {
        setSession(activeSession);
      }
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

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

  // Real-time analysis computation
  const analysisResult = useMemo(() => {
    return analyzeContent({
      title: metaTitle,
      metaDescription,
      slug,
      contentHtml,
      focusKeyword,
    });
  }, [metaTitle, metaDescription, slug, contentHtml, focusKeyword]);

  // Auto-optimization suggestions
  const autoSuggestions = useMemo(() => {
    return generateAutoOptimizations({
      title: metaTitle,
      metaDescription,
      slug,
      contentHtml,
      focusKeyword,
    });
  }, [metaTitle, metaDescription, slug, contentHtml, focusKeyword]);

  // Save / Publish Action
  const handleSaveDocument = () => {
    const updatedDoc: PageDocument = {
      ...activeDoc,
      name: name.trim() || 'Untitled Page',
      slug: slug.trim(),
      focusKeyword: focusKeyword.trim(),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      contentHtml,
      lastUpdated: new Date().toISOString(),
      isPublished: true,
    };

    savePageDocument(updatedDoc);
    setDocuments(getPageDocuments());
    setSaveBanner(`Published & saved "${updatedDoc.name}" with SEO Score of ${analysisResult.overallScore}/100.`);
    setTimeout(() => {
      setSaveBanner((prev) => (prev?.includes(updatedDoc.name) ? null : prev));
    }, 4000);
  };

  // Create new blank document
  const handleCreateNewDocument = () => {
    const newId = `custom-page-${Date.now()}`;
    const newDoc: PageDocument = {
      id: newId,
      type: 'post',
      name: 'New SEO Article Draft',
      slug: 'new-seo-article',
      urlExample: '/guides/new-seo-article',
      focusKeyword: '',
      metaTitle: '',
      metaDescription: '',
      contentHtml: '<h1>Article Title</h1><p>Start writing your SEO optimized content here...</p>',
      lastUpdated: new Date().toISOString(),
      isPublished: false,
    };
    savePageDocument(newDoc);
    const updatedDocs = getPageDocuments();
    setDocuments(updatedDocs);
    setSelectedDocId(newId);
  };

  // Character length indicators
  const titleLength = metaTitle.length;
  const descLength = metaDescription.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex items-center justify-center">
        <div className="text-xs text-[#6D6582]">
          Verifying administrator credentials...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex">
      <SEOHelmet
        title="SEO Optimizer – Content Analysis & Ranking Tool"
        description="RankMath-style content SEO analyzer with real-time checks, focus keyword density tracking, readability checks, and auto-optimization recommendations."
        canonicalPath="/admin/seo"
      />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminEmail={session?.user?.email || 'admin@onlinetools.internal'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopNav
          pageTitle="SEO Optimizer"
          adminTheme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
          {/* Header & Main Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <SearchCheck className="w-5 h-5 text-[#7C3AED]" />
                <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-[#1E1035]">
                  SEO Content Optimizer
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#6D6582] mt-0.5">
                Real-time RankMath-style SEO and readability analysis for blog posts, tools, and landing pages.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                id="create-new-doc-btn"
                onClick={handleCreateNewDocument}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE9FE] bg-[#FFFFFF] text-xs font-heading font-semibold text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer shadow-2xs"
              >
                <FilePlus className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>New Draft</span>
              </button>

              <button
                type="button"
                id="auto-optimize-trigger-btn"
                onClick={() => setShowOptimizeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#2563EB]/30 bg-blue-50 dark:bg-blue-950/40 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Optimize</span>
              </button>

              <button
                type="button"
                id="publish-seo-content-btn"
                onClick={handleSaveDocument}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shadow-2xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Publish</span>
              </button>
            </div>
          </div>

          {/* Live Notification Banner */}
          {saveBanner && (
            <div
              id="seo-save-toast"
              className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/40 text-xs text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-between gap-2 animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{saveBanner}</span>
              </div>
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                Published to live application storage
              </span>
            </div>
          )}

          {/* DOCUMENT SELECTOR & FOCUS KEYWORD ROW */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Page/Post Selector */}
            <div className="md:col-span-5 bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4 shadow-2xs space-y-2">
              <label
                htmlFor="seo-target-doc-select"
                className="block text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]"
              >
                Target Page / Post to Optimize
              </label>
              <select
                id="seo-target-doc-select"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    [{doc.type.toUpperCase()}] {doc.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] pt-1">
                <span>Route: <span className="font-mono text-[#0F172A] dark:text-[#F8FAFC]">/{slug}</span></span>
                <span className="text-[10px]">
                  Last updated: {new Date(activeDoc.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Focus Keyword Input */}
            <div className="md:col-span-7 bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="seo-focus-keyword-input"
                  className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Focus Keyword</span>
                </label>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  Density: <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{analysisResult.stats.keywordDensity}%</span> ({analysisResult.stats.keywordOccurrences}x)
                </span>
              </div>
              <div className="relative">
                <input
                  id="seo-focus-keyword-input"
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="e.g. calculate percentage, word counter online..."
                  className="w-full text-xs font-semibold p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                Real-time checks verify inclusion in title, meta description, H1, opening paragraph, URL, and image alt text.
              </p>
            </div>
          </div>

          {/* TWO-COLUMN WORKSPACE: LEFT EDITOR & METADATA / RIGHT SEO ANALYSIS PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Metadata & Rich Text Editor */}
            <div className="lg:col-span-7 space-y-5">
              {/* Metadata Configuration Box */}
              <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-5 shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#2563EB]" />
                  <span>Search Snippet Metadata</span>
                </h2>

                {/* Page Title / Meta Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="seo-meta-title-input"
                      className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                    >
                      SEO Meta Title
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          titleLength >= 45 && titleLength <= 60
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {titleLength} / 60 chars
                      </span>
                      <div className="w-12 h-1.5 bg-[#E2E8F0] dark:bg-[#1E293B] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            titleLength >= 45 && titleLength <= 60
                              ? 'bg-emerald-500'
                              : titleLength > 60
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (titleLength / 60) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <input
                    id="seo-meta-title-input"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Enter an engaging, keyword-rich SEO title..."
                    className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                {/* URL Slug */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="seo-slug-input"
                    className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                  >
                    Permalink URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8] px-2.5 py-2 bg-[#F1F5F9] dark:bg-[#1E293B] border border-r-0 border-[#CBD5E1] dark:border-[#334155] rounded-l-lg font-mono">
                      https://onlinetools.app/
                    </span>
                    <input
                      id="seo-slug-input"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="how-to-calculate-percentage"
                      className="w-full text-xs font-mono p-2 rounded-r-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Meta Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="seo-meta-description-input"
                      className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                    >
                      Meta Description
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          descLength >= 120 && descLength <= 160
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {descLength} / 160 chars
                      </span>
                      <div className="w-12 h-1.5 bg-[#E2E8F0] dark:bg-[#1E293B] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            descLength >= 120 && descLength <= 160
                              ? 'bg-emerald-500'
                              : descLength > 160
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (descLength / 160) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <textarea
                    id="seo-meta-description-input"
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Provide a compelling 120-160 character summary including your primary keyword and a clear value proposition..."
                    className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB] resize-y"
                  />
                </div>

                {/* LIVE GOOGLE SERP PREVIEW */}
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                      Google SERP Snippet Preview
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSerpDevice('desktop')}
                        className={`p-1 rounded ${
                          serpDevice === 'desktop'
                            ? 'bg-[#E2E8F0] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC]'
                            : 'text-[#64748B]'
                        }`}
                        title="Desktop Preview"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSerpDevice('mobile')}
                        className={`p-1 rounded ${
                          serpDevice === 'mobile'
                            ? 'bg-[#E2E8F0] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC]'
                            : 'text-[#64748B]'
                        }`}
                        title="Mobile Preview"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#0B0F17] ${
                      serpDevice === 'mobile' ? 'max-w-md' : 'w-full'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-[#4D5156] dark:text-[#9AA0A6] mb-1">
                      <div className="w-4 h-4 rounded-full bg-[#E2E8F0] dark:bg-[#1E293B] flex items-center justify-center text-[9px] font-bold">
                        OT
                      </div>
                      <span className="truncate">
                        https://onlinetools.app › {slug || 'guide'}
                      </span>
                    </div>
                    <div className="text-base text-[#1A0DAB] dark:text-[#8AB4F8] hover:underline cursor-pointer font-medium leading-snug">
                      {metaTitle || 'Page Title will appear here'}
                    </div>
                    <div className="text-xs text-[#4D5156] dark:text-[#BDC1C6] mt-1 line-clamp-2 leading-relaxed">
                      {metaDescription ||
                        'Write a meta description to see how your snippet appears to searchers on Google and other engines.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rich Text Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span>Article & Page Content</span>
                  </h2>
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {analysisResult.stats.wordCount} words &bull; ~{analysisResult.stats.readingTimeMinutes} min read
                  </span>
                </div>

                <RichTextEditor
                  value={contentHtml}
                  onChange={(val) => setContentHtml(val)}
                  placeholder="Write or paste your article content here. Format headings, add links, insert images with alt text..."
                />
              </div>
            </div>

            {/* Right Column: SEO Analysis & Recommendations Panel */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
              <SeoAnalysisPanel
                analysis={analysisResult}
                focusKeyword={focusKeyword}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Auto-Optimize Suggestions Modal */}
      <AutoOptimizeModal
        isOpen={showOptimizeModal}
        onClose={() => setShowOptimizeModal(false)}
        suggestions={autoSuggestions}
        analysis={analysisResult}
        currentTitle={metaTitle}
        currentMetaDescription={metaDescription}
        onApplyTitle={(t) => {
          setMetaTitle(t);
        }}
        onApplyDescription={(d) => {
          setMetaDescription(d);
        }}
        onApplyLineImprovement={(rec) => {
          // Replace opening paragraph
          const updated = contentHtml.replace(/<p[^>]*>[\s\S]*?<\/p>/i, `<p>${rec}</p>`);
          setContentHtml(updated);
        }}
      />

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div
          id="admin-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Update Admin Password
            </h3>
            {passwordStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  passwordStatus.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {passwordStatus.message}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] dark:text-[#94A3B8] mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordStatus(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
