import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { SEOHelmet } from '../components/SEOHelmet';
import {
  getActiveAdminSession,
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
  getAllDBCustomTools,
  putDBCustomTool,
  DBToolRecord,
} from '../services/toolStorageDB';
import {
  getAllCategoriesFromStorage,
  saveCategoryToStorage,
} from '../services/categoryStorageDB';
import { CategoryInfo } from '../types';
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
  FileText,
  ArrowRight,
} from 'lucide-react';

export function AdminSeoView() {
  const { navigate } = useRouter();
  const [, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Documents state combining PageDocuments, Tools, and Categories
  const [pageDocs, setPageDocs] = useState<PageDocument[]>(() => getPageDocuments());
  const [customTools, setCustomTools] = useState<DBToolRecord[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    const docs = getPageDocuments();
    return docs[0]?.id || 'guide-how-to-calculate-percentage';
  });

  // Load custom tools and categories to offer in RankMath dropdown
  useEffect(() => {
    getAllDBCustomTools().then((tools) => setCustomTools(tools));
    setCategories(getAllCategoriesFromStorage());
  }, []);

  // Merged items list for RankMath analyzer
  const allSelectableItems = useMemo<PageDocument[]>(() => {
    const baseDocs = [...pageDocs];

    // Map custom tools to PageDocument format
    const toolDocs: PageDocument[] = customTools.map((t) => ({
      id: `tool-${t.slug}`,
      type: 'tool',
      name: `Tool: ${t.name}`,
      slug: `${t.category}/${t.slug}`,
      urlExample: `/${t.category}/${t.slug}`,
      focusKeyword: t.keywords?.[0] || t.name.toLowerCase(),
      metaTitle: t.seoTitle || `${t.name} – Free Online Calculator & Utility`,
      metaDescription: t.seoDescription || t.description,
      contentHtml: `<h1>${t.name}</h1><p>${t.description}</p>${t.longDescription ? `<p>${t.longDescription}</p>` : ''}`,
      lastUpdated: t.updatedAt || new Date().toISOString(),
      isPublished: t.status === 'active',
    }));

    // Map categories to PageDocument format
    const catDocs: PageDocument[] = categories.map((c) => ({
      id: `category-${c.slug}`,
      type: 'page',
      name: `Category: ${c.name}`,
      slug: c.slug,
      urlExample: `/${c.slug}`,
      focusKeyword: c.name.toLowerCase(),
      metaTitle: c.seoTitle || `${c.name} – Free Online Tools & Calculators`,
      metaDescription: c.seoDescription || c.description,
      contentHtml: `<h1>${c.name}</h1><p>${c.description}</p>`,
      lastUpdated: new Date().toISOString(),
      isPublished: true,
    }));

    return [...baseDocs, ...toolDocs, ...catDocs];
  }, [pageDocs, customTools, categories]);

  // Current working fields
  const activeDoc = useMemo(() => {
    return (
      allSelectableItems.find((d) => d.id === selectedDocId) ||
      allSelectableItems[0] ||
      DEFAULT_PAGE_DOCUMENTS[0]
    );
  }, [allSelectableItems, selectedDocId]);

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

  // Real-time RankMath analysis computation
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
  const handleSaveDocument = async () => {
    // If it's a tool
    if (selectedDocId.startsWith('tool-')) {
      const toolSlug = selectedDocId.replace('tool-', '');
      const existing = customTools.find((t) => t.slug === toolSlug);
      if (existing) {
        const updatedTool: DBToolRecord = {
          ...existing,
          seoTitle: metaTitle.trim(),
          seoDescription: metaDescription.trim(),
          keywords: focusKeyword
            ? Array.from(new Set([focusKeyword.trim(), ...(existing.keywords || [])]))
            : existing.keywords,
          updatedAt: new Date().toISOString(),
        };
        await putDBCustomTool(updatedTool);
        setCustomTools((prev) => prev.map((t) => (t.slug === toolSlug ? updatedTool : t)));
        setSaveBanner(`Saved SEO settings for tool "${existing.name}" (Score: ${analysisResult.overallScore}/100)`);
      }
    } else if (selectedDocId.startsWith('category-')) {
      // If it's a category
      const catSlug = selectedDocId.replace('category-', '');
      const existing = categories.find((c) => c.slug === catSlug);
      if (existing) {
        const updatedCat: CategoryInfo = {
          ...existing,
          seoTitle: metaTitle.trim(),
          seoDescription: metaDescription.trim(),
        };
        await saveCategoryToStorage(updatedCat);
        setCategories(getAllCategoriesFromStorage());
        setSaveBanner(`Saved SEO settings for category "${existing.name}" (Score: ${analysisResult.overallScore}/100)`);
      }
    } else {
      // Standard guide / page document
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
      setPageDocs(getPageDocuments());
      setSaveBanner(`Published & saved "${updatedDoc.name}" with SEO Score of ${analysisResult.overallScore}/100.`);
    }

    setTimeout(() => {
      setSaveBanner(null);
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
    setPageDocs(getPageDocuments());
    setSelectedDocId(newId);
  };

  const titleLength = metaTitle.length;
  const descLength = metaDescription.length;

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
        title="SEO Optimizer (RankMath) – Admin Dashboard"
        description="RankMath-style content SEO analyzer with real-time checks, focus keyword density tracking, readability checks, and auto-optimization recommendations."
        canonicalPath="/admin/seo"
      />

      <AdminSidebar currentPath="/admin/seo" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminTopNav />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
          {/* Header & Main Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
            <div>
              <div className="flex items-center gap-2">
                <SearchCheck className="w-5 h-5 text-[#7C3AED]" />
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight text-[#1E1035]">
                  RankMath SEO Content Optimizer
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#6D6582] mt-0.5">
                Real-time SEO and readability analyzer for uploaded tools, categories, guides, and pages.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                id="create-new-doc-btn"
                onClick={handleCreateNewDocument}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DDD6FE] bg-white text-xs font-heading font-semibold text-[#1E1035] hover:bg-[#F5F3FF] transition-colors cursor-pointer shadow-2xs"
              >
                <FilePlus className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>New SEO Draft</span>
              </button>

              <button
                type="button"
                id="auto-optimize-trigger-btn"
                onClick={() => setShowOptimizeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-xs font-heading font-semibold text-[#7C3AED] hover:bg-[#EDE9FE] transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Optimize</span>
              </button>

              <button
                type="button"
                id="publish-seo-content-btn"
                onClick={handleSaveDocument}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-heading font-bold hover:bg-[#6D28D9] transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save &amp; Publish SEO</span>
              </button>
            </div>
          </div>

          {/* Helpful Navigation Notice for Dedicated Blog & Guides Manager */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#F5F3FF] to-[#FAF5FF] border border-[#DDD6FE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-heading font-bold text-[#1E1035]">
                  Looking to Write, Paste, or Publish Full Blog Posts &amp; Guides?
                </p>
                <p className="text-[11px] text-[#6D6582]">
                  Use the dedicated <strong>Blog &amp; Guides Manager</strong> equipped with the Smart Paste / AI Draft Parser, structured fields, live RankMath sidebar, and Supabase database sync.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/guides')}
              className="px-3.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>Open Blog &amp; Guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Notification Banner */}
          {saveBanner && (
            <div
              id="seo-save-toast"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{saveBanner}</span>
              </div>
              <span className="text-[10px] font-mono text-[#6D6582]">
                Synchronized with live storage
              </span>
            </div>
          )}

          {/* DOCUMENT SELECTOR & FOCUS KEYWORD ROW */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Page/Tool/Category Selector */}
            <div className="md:col-span-5 bg-white border border-[#EDE9FE] rounded-2xl p-4 shadow-2xs space-y-2">
              <label
                htmlFor="seo-target-doc-select"
                className="block text-xs font-heading font-bold text-[#1E1035]"
              >
                Target Page / Tool / Category to Optimize
              </label>
              <select
                id="seo-target-doc-select"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full text-xs p-2 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
              >
                {allSelectableItems.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    [{doc.type.toUpperCase()}] {doc.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] text-[#6D6582] pt-1">
                <span>Route: <span className="font-mono text-[#7C3AED]">/{slug}</span></span>
                <span className="text-[10px]">
                  Last updated: {new Date(activeDoc.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Focus Keyword Input */}
            <div className="md:col-span-7 bg-white border border-[#EDE9FE] rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="seo-focus-keyword-input"
                  className="text-xs font-heading font-bold text-[#1E1035] flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>RankMath Focus Keyword</span>
                </label>
                <span className="text-[11px] text-[#6D6582]">
                  Density: <span className="font-bold text-[#1E1035]">{analysisResult.stats.keywordDensity}%</span> ({analysisResult.stats.keywordOccurrences}x)
                </span>
              </div>
              <div className="relative">
                <input
                  id="seo-focus-keyword-input"
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="e.g. calculate percentage, tip calculator, age calculator..."
                  className="w-full text-xs font-medium p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] placeholder-[#9D95B3] outline-none"
                />
              </div>
              <p className="text-[10px] text-[#6D6582]">
                RankMath audits inclusion across Title, Meta Description, H1 heading, content body, URL permalink, and images.
              </p>
            </div>
          </div>

          {/* TWO-COLUMN WORKSPACE: LEFT EDITOR & METADATA / RIGHT SEO ANALYSIS PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Metadata & Rich Text Editor */}
            <div className="lg:col-span-7 space-y-5">
              {/* Metadata Configuration Box */}
              <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 shadow-2xs space-y-4">
                <h2 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#7C3AED]" />
                  <span>Google Snippet Metadata</span>
                </h2>

                {/* Page Title / Meta Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="seo-meta-title-input"
                      className="font-heading font-semibold text-[#1E1035]"
                    >
                      SEO Meta Title
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          titleLength >= 45 && titleLength <= 60
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {titleLength} / 60 chars
                      </span>
                      <div className="w-12 h-1.5 bg-[#FAF9FE] border border-[#EDE9FE] rounded-full overflow-hidden">
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
                    className="w-full text-xs p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                  />
                </div>

                {/* URL Slug */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="seo-slug-input"
                    className="block text-xs font-heading font-semibold text-[#1E1035]"
                  >
                    Permalink URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="text-xs text-[#6D6582] px-2.5 py-2 bg-[#FAF9FE] border border-r-0 border-[#DDD6FE] rounded-l-xl font-mono">
                      https://onlinetools.app/
                    </span>
                    <input
                      id="seo-slug-input"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="how-to-calculate-percentage"
                      className="w-full text-xs font-mono p-2 rounded-r-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                    />
                  </div>
                </div>

                {/* Meta Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="seo-meta-description-input"
                      className="font-heading font-semibold text-[#1E1035]"
                    >
                      Meta Description
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          descLength >= 120 && descLength <= 160
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {descLength} / 160 chars
                      </span>
                      <div className="w-12 h-1.5 bg-[#FAF9FE] border border-[#EDE9FE] rounded-full overflow-hidden">
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
                    placeholder="Provide a compelling 120-160 character summary including your focus keyword..."
                    className="w-full text-xs p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none resize-y"
                  />
                </div>

                {/* LIVE GOOGLE SERP PREVIEW */}
                <div className="pt-2 border-t border-[#EDE9FE] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-heading font-bold text-[#6D6582] uppercase tracking-wider">
                      Google SERP Snippet Preview
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSerpDevice('desktop')}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          serpDevice === 'desktop'
                            ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                            : 'text-[#6D6582] hover:text-[#1E1035]'
                        }`}
                        title="Desktop Preview"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSerpDevice('mobile')}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          serpDevice === 'mobile'
                            ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                            : 'text-[#6D6582] hover:text-[#1E1035]'
                        }`}
                        title="Mobile Preview"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border border-[#DDD6FE] bg-white ${
                      serpDevice === 'mobile' ? 'max-w-md' : 'w-full'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-[#6D6582] mb-1">
                      <div className="w-4 h-4 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center text-[9px] font-bold">
                        OT
                      </div>
                      <span className="truncate">
                        https://onlinetools.app › {slug || 'guide'}
                      </span>
                    </div>
                    <div className="text-base text-[#1A0DAB] hover:underline cursor-pointer font-medium leading-snug">
                      {metaTitle || 'Page Title will appear here'}
                    </div>
                    <div className="text-xs text-[#4D5156] mt-1 line-clamp-2 leading-relaxed">
                      {metaDescription ||
                        'Write a meta description to see how your snippet appears to searchers on Google and other engines.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rich Text Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#7C3AED]" />
                    <span>Content Body &amp; Methodology</span>
                  </h2>
                  <span className="text-xs text-[#6D6582]">
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
        onApplyTitle={(t) => setMetaTitle(t)}
        onApplyDescription={(d) => setMetaDescription(d)}
        onApplyLineImprovement={(rec) => {
          setContentHtml((prev) => `${prev}<p>${rec}</p>`);
        }}
      />
    </div>
  );
}
