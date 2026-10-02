import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import {
  getAllMergedGuidesSync,
  saveGuideArticle,
  deleteGuideArticle,
  parsePastedArticle,
  calculateRankMathScore,
  GUIDES_UPDATED_EVENT,
  SUPABASE_GUIDES_SQL,
  RankMathAnalysis,
} from '../services/guideStorageDB';
import { GuideArticle, GuideSection } from '../types';
import { CATEGORIES } from '../data/categories';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
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
  ArrowRight,
  TrendingUp,
  X,
  Sliders,
  HelpCircle,
  Code,
  Tag,
  Eye,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { useRouter } from '../context/RouterContext';

export function AdminGuidesView() {
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guides, setGuides] = useState<GuideArticle[]>(getAllMergedGuidesSync);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionNotice, setActionNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  // Editor Modal / Screen State
  const [isEditing, setIsEditing] = useState(false);
  const [creationMode, setCreationMode] = useState<'smart_paste' | 'manual'>('smart_paste');
  const [pastedArticleText, setPastedArticleText] = useState('');
  const [parsingNotice, setParsingNotice] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('calculators');
  const [author, setAuthor] = useState('PRBSolver Editorial Team');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [formula, setFormula] = useState('');
  const [quickAnswer, setQuickAnswer] = useState('');
  const [readingTime, setReadingTime] = useState('5 min read');
  const [sections, setSections] = useState<GuideSection[]>([
    { title: 'Core Concept & Mathematical Explanation', paragraphs: [''] },
  ]);
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([
    { question: '', answer: '' },
  ]);
  const [isDraft, setIsDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // RankMath Live Testing Tab / Panel
  const [showRankMathPanel, setShowRankMathPanel] = useState(true);

  // Sync guides with live database
  useEffect(() => {
    const handleUpdate = () => {
      setGuides(getAllMergedGuidesSync());
    };
    window.addEventListener(GUIDES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(GUIDES_UPDATED_EVENT, handleUpdate);
  }, []);

  const showNotification = (text: string, isError = false) => {
    setActionNotice({ text, isError });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_GUIDES_SQL);
    setCopiedSql(true);
    showNotification('Supabase SQL schema copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Filtered guides list
  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      const matchCat = categoryFilter === 'all' || g.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q) ||
        (g.targetKeyword && g.targetKeyword.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [guides, categoryFilter, searchQuery]);

  // Current draft article object for live RankMath evaluation
  const currentDraftArticle: Partial<GuideArticle> = useMemo(() => {
    return {
      title,
      slug,
      description,
      category,
      author,
      targetKeyword,
      formula: formula || undefined,
      quickAnswer,
      sections: sections.filter((s) => s.title.trim() || s.paragraphs.some((p) => p.trim())),
      faq: faqItems.filter((f) => f.question.trim() && f.answer.trim()),
    };
  }, [title, slug, description, category, author, targetKeyword, formula, quickAnswer, sections, faqItems]);

  // Live RankMath SEO Score
  const rankMathAnalysis: RankMathAnalysis = useMemo(() => {
    return calculateRankMathScore(currentDraftArticle);
  }, [currentDraftArticle]);

  // Handle Smart Paste Parsing
  const handleAutoParsePastedText = () => {
    if (!pastedArticleText.trim()) {
      setParsingNotice('Please paste your article text first.');
      return;
    }

    const parsed = parsePastedArticle(pastedArticleText);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.slug) setSlug(parsed.slug);
    if (parsed.description) setDescription(parsed.description);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.targetKeyword) setTargetKeyword(parsed.targetKeyword);
    if (parsed.formula) setFormula(parsed.formula);
    if (parsed.quickAnswer) setQuickAnswer(parsed.quickAnswer);
    if (parsed.readingTime) setReadingTime(parsed.readingTime);
    if (parsed.sections && parsed.sections.length > 0) setSections(parsed.sections);
    if (parsed.faq && parsed.faq.length > 0) setFaqItems(parsed.faq);

    setParsingNotice(`Parsed successfully! Extracted ${parsed.sections?.length || 0} sections and ${parsed.faq?.length || 0} FAQs.`);
    setCreationMode('manual'); // Switch to review fields
    setTimeout(() => setParsingNotice(null), 4000);
  };

  // Handle Draft File Upload (.txt or .md)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPastedArticleText(text);
        const parsed = parsePastedArticle(text);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.slug) setSlug(parsed.slug);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.targetKeyword) setTargetKeyword(parsed.targetKeyword);
        if (parsed.formula) setFormula(parsed.formula);
        if (parsed.quickAnswer) setQuickAnswer(parsed.quickAnswer);
        if (parsed.readingTime) setReadingTime(parsed.readingTime);
        if (parsed.sections && parsed.sections.length > 0) setSections(parsed.sections);
        if (parsed.faq && parsed.faq.length > 0) setFaqItems(parsed.faq);

        setParsingNotice(`File "${file.name}" uploaded and parsed! Extracted ${parsed.sections?.length || 0} sections and ${parsed.faq?.length || 0} FAQs.`);
        setCreationMode('manual');
        setShowRankMathPanel(true);
        setTimeout(() => setParsingNotice(null), 5000);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenCreateNew = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setCategory('calculators');
    setAuthor('PRBSolver Editorial Team');
    setTargetKeyword('');
    setFormula('');
    setQuickAnswer('');
    setReadingTime('5 min read');
    setSections([{ title: 'Core Concept & Mathematical Explanation', paragraphs: [''] }]);
    setFaqItems([{ question: '', answer: '' }]);
    setPastedArticleText('');
    setParsingNotice(null);
    setIsDraft(false);
    setCreationMode('smart_paste');
    setIsEditing(true);
  };

  const handleEditGuide = (g: GuideArticle) => {
    setTitle(g.title);
    setSlug(g.slug);
    setDescription(g.description);
    setCategory(g.category);
    setAuthor(g.author || 'PRBSolver Editorial Team');
    setTargetKeyword(g.targetKeyword || '');
    setFormula(g.formula || '');
    setQuickAnswer(g.quickAnswer || '');
    setReadingTime(g.readingTime || '5 min read');
    setSections(g.sections && g.sections.length > 0 ? g.sections : [{ title: 'Explanation', paragraphs: [''] }]);
    setFaqItems(g.faq && g.faq.length > 0 ? g.faq : [{ question: '', answer: '' }]);
    setIsDraft(Boolean(g.isDraft));
    setCreationMode('manual');
    setIsEditing(true);
  };

  const handleDeleteGuide = async (g: GuideArticle) => {
    if (window.confirm(`Are you sure you want to delete "${g.title}"?`)) {
      const res = await deleteGuideArticle(g.slug);
      showNotification(res.message, !res.success);
    }
  };

  const handleSaveArticle = async (asDraft = false) => {
    if (!title.trim()) {
      showNotification('Please provide an article title.', true);
      return;
    }
    const finalSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setIsSaving(true);
    try {
      const articleToSave: GuideArticle = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim() || `Comprehensive guide for ${title.trim()}`,
        category,
        author: author.trim() || 'PRBSolver Editorial Team',
        publishedDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
        readingTime: readingTime || '5 min read',
        quickAnswer: quickAnswer.trim() || description.trim(),
        formula: formula.trim() || undefined,
        sections: sections.filter((s) => s.title.trim() || s.paragraphs.some((p) => p.trim())),
        faq: faqItems.filter((f) => f.question.trim() && f.answer.trim()),
        targetKeyword: targetKeyword.trim(),
        seoScore: rankMathAnalysis.overallScore,
        isDraft: asDraft,
        practicalExamples: [],
        commonMistakes: [],
        relatedTools: [],
        relatedGuides: [],
      };

      const res = await saveGuideArticle(articleToSave);
      showNotification(res.message, !res.success);
      if (res.success) {
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Section helper handlers
  const handleAddSection = () => {
    setSections([...sections, { title: 'New Subheading H2', paragraphs: [''] }]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionTitleChange = (index: number, val: string) => {
    const updated = [...sections];
    updated[index].title = val;
    setSections(updated);
  };

  const handleSectionParagraphChange = (secIdx: number, pIdx: number, val: string) => {
    const updated = [...sections];
    updated[secIdx].paragraphs[pIdx] = val;
    setSections(updated);
  };

  const handleAddParagraph = (secIdx: number) => {
    const updated = [...sections];
    updated[secIdx].paragraphs.push('');
    setSections(updated);
  };

  // FAQ helper handlers
  const handleAddFaq = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', val: string) => {
    const updated = [...faqItems];
    updated[index][field] = val;
    setFaqItems(updated);
  };

  return (
    <div className="flex h-screen bg-[#FAF9FE] text-[#1E1035] overflow-hidden font-sans">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath="/admin/guides"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminTopNav onMenuClick={() => setSidebarOpen(true)} title="Blog & Guides Management" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Action Notification Banner */}
          {actionNotice && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in ${
                actionNotice.isError
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionNotice.isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>{actionNotice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top Banner: Supabase Database Sync & SQL Card */}
          <section className="bg-white border border-[#EDE9FE] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE]">
                  <Database className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-heading font-bold text-[#1E1035]">
                  Supabase Blog &amp; Guides Integration
                </h2>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  SQL Table Ready
                </span>
              </div>
              <p className="text-xs text-[#6D6582] max-w-2xl leading-relaxed">
                Add the <code className="bg-[#FAF9FE] text-[#7C3AED] px-1.5 py-0.5 rounded font-mono text-[11px] border border-[#EDE9FE]">public.guides</code> table in your Supabase SQL Editor so all published articles persist permanently in PostgreSQL.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#1E1035] hover:text-[#7C3AED] rounded-xl text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>View Supabase SQL Schema</span>
              </button>

              <button
                type="button"
                onClick={copySql}
                className="px-3.5 py-2 bg-[#FAF9FE] hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] hover:text-[#6D28D9] rounded-xl text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateNew}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write / Add New Guide</span>
              </button>
            </div>
          </section>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs">
              <span className="text-[11px] text-[#6D6582] font-semibold block uppercase tracking-wider">Total Articles</span>
              <span className="text-2xl font-heading font-extrabold text-[#1E1035] mt-1 block">{guides.length}</span>
              <span className="text-[10px] text-[#7C3AED] font-medium mt-0.5 block">Live in directory</span>
            </div>

            <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs">
              <span className="text-[11px] text-[#6D6582] font-semibold block uppercase tracking-wider">Published</span>
              <span className="text-2xl font-heading font-extrabold text-emerald-600 mt-1 block">
                {guides.filter((g) => !g.isDraft).length}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">Indexed for Google</span>
            </div>

            <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs">
              <span className="text-[11px] text-[#6D6582] font-semibold block uppercase tracking-wider">Drafts</span>
              <span className="text-2xl font-heading font-extrabold text-amber-600 mt-1 block">
                {guides.filter((g) => g.isDraft).length}
              </span>
              <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">Unpublished</span>
            </div>

            <div className="p-4 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs">
              <span className="text-[11px] text-[#6D6582] font-semibold block uppercase tracking-wider">Avg RankMath SEO</span>
              <span className="text-2xl font-heading font-extrabold text-[#7C3AED] mt-1 block">
                {Math.round(guides.reduce((acc, g) => acc + (g.seoScore || 85), 0) / (guides.length || 1))}/100
              </span>
              <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">High Optimization</span>
            </div>
          </div>

          {/* Main Content: Guides List Table */}
          <section className="bg-white border border-[#EDE9FE] rounded-2xl shadow-xs overflow-hidden">
            {/* Table Search & Filter Bar */}
            <div className="p-4 border-b border-[#EDE9FE] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAF9FE]/50">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#9D95B3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter articles by title or keyword..."
                  className="w-full bg-white border border-[#DDD6FE] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-[#1E1035] outline-none focus:outline-none focus:border-[#7C3AED] font-sans"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-[#DDD6FE] text-xs font-heading font-semibold text-[#1E1035] rounded-xl px-3 py-1.5 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Categories ({guides.length})</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                  className="p-1.5 text-[#9D95B3] hover:text-[#1E1035] hover:bg-[#F5F3FF] rounded-lg transition-colors"
                  title="Reset filter"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Guides Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDE9FE] bg-[#FAF9FE] text-[#6D6582] font-heading font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Article Title &amp; Slug</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Focus Keyword</th>
                    <th className="py-3 px-4">RankMath SEO</th>
                    <th className="py-3 px-4">Reading Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE9FE]">
                  {filteredGuides.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#6D6582]">
                        <BookOpen className="w-8 h-8 text-[#DDD6FE] mx-auto mb-2" />
                        <p className="font-heading font-semibold">No guides match your search.</p>
                        <p className="text-[11px] mt-0.5">Click &apos;Write / Add New Guide&apos; to create one.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGuides.map((g) => {
                      const score = g.seoScore || 85;
                      const scoreBadge =
                        score >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : score >= 60
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200';

                      return (
                        <tr key={g.slug} className="hover:bg-[#FAF9FE]/60 transition-colors">
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-heading font-bold text-xs text-[#1E1035] line-clamp-1">
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
                          <td className="py-3 px-4 font-mono text-[11px] text-[#6D6582]">
                            {g.targetKeyword || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-heading font-bold border ${scoreBadge}`}>
                              <Sparkles className="w-3 h-3" />
                              <span>{score}/100</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#6D6582] text-[11px]">
                            {g.readingTime || '5 min read'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/guides/${g.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] rounded-lg transition-colors"
                                title="View Live Article"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEditGuide(g)}
                                className="p-1.5 text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] rounded-lg transition-colors cursor-pointer"
                                title="Edit Article"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGuide(g)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Article"
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
          </section>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* FULLSCREEN / RICH MODAL: ARTICLE CREATOR & EDITOR WITH LIVE RANKMATH PANEL */}
      {/* ========================================================================= */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#EDE9FE] rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#EDE9FE] flex items-center justify-between bg-[#FAF9FE] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#1E1035]">
                    {slug ? `Editing: ${title || slug}` : 'Write & Publish New Guide / Blog Post'}
                  </h3>
                  <p className="text-[11px] text-[#6D6582]">
                    Two modes: Auto-parse pasted Markdown/AI drafts or build structured sections manually.
                  </p>
                </div>
              </div>

              {/* Mode Toggle Pills & Close */}
              <div className="flex items-center gap-2">
                <div className="bg-white border border-[#DDD6FE] p-0.5 rounded-xl flex items-center text-xs font-heading font-semibold">
                  <button
                    type="button"
                    onClick={() => setCreationMode('smart_paste')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      creationMode === 'smart_paste'
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'text-[#6D6582] hover:text-[#1E1035]'
                    }`}
                  >
                    Smart Paste Article
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('manual')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      creationMode === 'manual'
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'text-[#6D6582] hover:text-[#1E1035]'
                    }`}
                  >
                    Structured Fields
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split into Form (Left) & RankMath Panel (Right) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#EDE9FE]">
              {/* LEFT COLUMN: Article Input Fields */}
              <div className="lg:col-span-8 p-5 sm:p-6 space-y-6">
                {/* Mode A: Smart Paste Article Box */}
                {creationMode === 'smart_paste' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                        <h4 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
                          Smart Paste / Upload Complete Draft
                        </h4>
                      </div>
                      <span className="text-[11px] text-[#6D6582]">ChatGPT / Claude / Markdown friendly</span>
                    </div>

                    <p className="text-xs text-[#6D6582] leading-relaxed">
                      Paste your entire written article or AI output here. Our system will automatically detect the <strong>Title (#)</strong>, <strong>Headings (##)</strong>, <strong>Formula</strong>, <strong>Key Takeaway</strong>, and <strong>FAQs</strong> and fill all fields for you.
                    </p>

                    <textarea
                      value={pastedArticleText}
                      onChange={(e) => setPastedArticleText(e.target.value)}
                      rows={9}
                      placeholder={`# How to Calculate Percentage: The Complete Mathematical Guide\n\n**Formula:** Percentage (%) = (Part / Whole) × 100\n\n**Quick Answer:** Divide the part by total whole and multiply by 100.\n\n## 1. Understanding What a Percentage Means\nA percentage is a dimensionless ratio...\n\n## 2. Practical Worked Example\nIf you score 45 out of 60 on a test...\n\n## Frequently Asked Questions\nQ: Can a percentage be greater than 100%?\nA: Yes, when a quantity more than doubles...`}
                      className="w-full text-xs font-mono p-3.5 bg-white border border-[#DDD6FE] rounded-xl focus:border-[#7C3AED] text-[#1E1035] placeholder-[#9D95B3]"
                    />

                    {parsingNotice && (
                      <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        {parsingNotice}
                      </p>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".txt,.md,.markdown"
                      className="hidden"
                    />

                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#1E1035] rounded-xl text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>Upload Draft File (.txt, .md)</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCreationMode('manual')}
                          className="px-3 py-2 text-xs font-heading font-semibold text-[#6D6582] hover:text-[#1E1035]"
                        >
                          Skip to Manual Fields
                        </button>
                        <button
                          type="button"
                          onClick={handleAutoParsePastedText}
                          className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Extract &amp; Auto-Fill Form Fields</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Core Article Fields */}
                <div className="space-y-4">
                  {/* Mode Banner & Quick Action Buttons */}
                  <div className="p-3 rounded-xl bg-white border border-[#EDE9FE] shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-heading font-bold text-[#1E1035]">
                        {creationMode === 'manual' ? 'Structured Form Mode' : 'AI / Smart Draft Form'}
                      </span>
                      <span className="text-[11px] text-[#6D6582]">
                        Fill inputs below or paste article above
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCreationMode(creationMode === 'smart_paste' ? 'manual' : 'smart_paste')}
                        className="px-3 py-1.5 bg-[#FAF9FE] hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#1E1035] rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer"
                      >
                        {creationMode === 'smart_paste' ? 'Switch to Manual Form' : 'Paste Article Text'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRankMathPanel(!showRankMathPanel)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Test Rank Math: {rankMathAnalysis.overallScore}/100</span>
                      </button>
                    </div>
                  </div>

                  {/* Article Title */}
                  <div>
                    <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                      Article Title (H1) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (!slug) {
                          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                        }
                      }}
                      placeholder="e.g. How Compound Interest Works: Mathematical Mechanics of Wealth Accumulation"
                      className="w-full text-xs sm:text-sm font-heading font-bold p-2.5 bg-white border border-[#DDD6FE] rounded-xl text-[#1E1035] focus:border-[#7C3AED]"
                    />
                  </div>

                  {/* Slug & Category & Keyword row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-semibold text-[#1E1035] mb-1">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="how-compound-interest-works"
                        className="w-full text-xs font-mono p-2 bg-white border border-[#DDD6FE] rounded-xl text-[#1E1035]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-semibold text-[#1E1035] mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full text-xs font-heading font-semibold p-2 bg-white border border-[#DDD6FE] rounded-xl text-[#1E1035]"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-semibold text-[#1E1035] mb-1">
                        Focus Target Keyword (RankMath)
                      </label>
                      <input
                        type="text"
                        value={targetKeyword}
                        onChange={(e) => setTargetKeyword(e.target.value)}
                        placeholder="e.g. compound interest formula"
                        className="w-full text-xs font-sans font-semibold p-2 bg-white border border-[#DDD6FE] rounded-xl text-[#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <label className="font-heading font-semibold text-[#1E1035]">
                        SEO Meta Description (Snippet)
                      </label>
                      <span className={`font-mono text-[10px] ${
                        description.length >= 120 && description.length <= 160 ? 'text-emerald-600 font-bold' : 'text-[#9D95B3]'
                      }`}>
                        {description.length} / 160 chars (optimal: 120-160)
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Clear 120-160 character summary including your primary focus keyword..."
                      className="w-full text-xs p-2.5 bg-white border border-[#DDD6FE] rounded-xl text-[#1E1035]"
                    />
                  </div>

                  {/* Formula & Quick Answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-semibold text-[#1E1035] mb-1">
                        Primary Formula (Optional)
                      </label>
                      <input
                        type="text"
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        placeholder="e.g. A = P(1 + r/n)^(nt)"
                        className="w-full text-xs font-mono font-bold p-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-[#7C3AED]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-semibold text-[#1E1035] mb-1">
                        Reading Time (Minutes)
                      </label>
                      <input
                        type="text"
                        value={readingTime}
                        onChange={(e) => setReadingTime(e.target.value)}
                        placeholder="e.g. 6 min read"
                        className="w-full text-xs p-2 bg-white border border-[#DDD6FE] rounded-xl text-[#1E1035]"
                      />
                    </div>
                  </div>

                  {/* Quick Answer / Key Takeaways Box */}
                  <div>
                    <label className="block text-[11px] font-heading font-semibold text-[#1E1035] mb-1">
                      Quick Answer / Core Takeaway Box (Featured in Google snippets)
                    </label>
                    <textarea
                      value={quickAnswer}
                      onChange={(e) => setQuickAnswer(e.target.value)}
                      rows={2}
                      placeholder="To calculate X, simply do Y. Here is the direct answer at a glance..."
                      className="w-full text-xs p-2.5 bg-white border border-[#DDD6FE] rounded-xl text-[#1E1035]"
                    />
                  </div>

                  {/* Dynamic Sections Builder */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-[#EDE9FE]">
                      <h4 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
                        Article Content Sections (H2 Headings &amp; Text)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="text-xs font-heading font-bold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Section</span>
                      </button>
                    </div>

                    {sections.map((sec, secIdx) => (
                      <div key={secIdx} className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE]/60 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-heading font-bold text-[#7C3AED] uppercase">
                            Section {secIdx + 1}
                          </span>
                          {sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(secIdx)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-heading"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleSectionTitleChange(secIdx, e.target.value)}
                          placeholder="H2 Subheading Title..."
                          className="w-full text-xs font-heading font-bold p-2 bg-white border border-[#DDD6FE] rounded-lg text-[#1E1035]"
                        />

                        {sec.paragraphs.map((p, pIdx) => (
                          <textarea
                            key={pIdx}
                            value={p}
                            onChange={(e) => handleSectionParagraphChange(secIdx, pIdx, e.target.value)}
                            rows={3}
                            placeholder="Paragraph content..."
                            className="w-full text-xs p-2 bg-white border border-[#DDD6FE] rounded-lg text-[#1E1035]"
                          />
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddParagraph(secIdx)}
                          className="text-[11px] font-sans font-medium text-[#7C3AED] hover:underline"
                        >
                          + Add another paragraph to this section
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* FAQ Items Builder */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-[#EDE9FE]">
                      <h4 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
                        Frequently Asked Questions (FAQ Accordion &amp; Schema)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="text-xs font-heading font-bold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add FAQ</span>
                      </button>
                    </div>

                    {faqItems.map((f, fIdx) => (
                      <div key={fIdx} className="p-3 rounded-xl border border-[#EDE9FE] bg-white space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-heading font-bold text-[#6D6582]">
                            FAQ #{fIdx + 1}
                          </span>
                          {faqItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(fIdx)}
                              className="text-rose-500 hover:text-rose-700 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={f.question}
                          onChange={(e) => handleFaqChange(fIdx, 'question', e.target.value)}
                          placeholder="Question: e.g. How does frequency impact compound growth?"
                          className="w-full text-xs font-semibold p-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-lg text-[#1E1035]"
                        />

                        <textarea
                          value={f.answer}
                          onChange={(e) => handleFaqChange(fIdx, 'answer', e.target.value)}
                          rows={2}
                          placeholder="Answer: e.g. Compounding more frequently produces slightly higher effective yields..."
                          className="w-full text-xs p-2 bg-white border border-[#DDD6FE] rounded-lg text-[#1E1035]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Live RankMath SEO Optimizer Sidebar */}
              <div className="lg:col-span-4 p-5 sm:p-6 bg-[#FAF9FE] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <h4 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
                      RankMath SEO Analyzer
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#6D6582]">Live 10-Point Audit</span>
                </div>

                {/* Score Dial Banner */}
                <div className="p-4 rounded-2xl bg-white border border-[#EDE9FE] shadow-2xs flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#6D6582]">
                      SEO Health Score
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-heading font-extrabold" style={{ color: rankMathAnalysis.gradeColor }}>
                        {rankMathAnalysis.overallScore}
                      </span>
                      <span className="text-xs text-[#9D95B3] font-bold">/ 100</span>
                    </div>
                    <span className="text-[11px] font-semibold capitalize" style={{ color: rankMathAnalysis.gradeColor }}>
                      {rankMathAnalysis.grade} Optimization
                    </span>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-medium text-[#1E1035]">
                      <strong>{rankMathAnalysis.passedCount}</strong> / {rankMathAnalysis.totalCount} Passed
                    </p>
                    <p className="text-[11px] text-[#6D6582]">{rankMathAnalysis.wordCount} Words</p>
                    <p className="text-[11px] text-[#6D6582]">Density: {rankMathAnalysis.keywordDensity.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Keyword Advice */}
                {!targetKeyword && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <strong>Tip:</strong> Set a <em>Focus Target Keyword</em> above to run full RankMath keyword tests!
                  </div>
                )}

                {/* RankMath Checklist Items */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {rankMathAnalysis.tests.map((t) => (
                    <div
                      key={t.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        t.passed
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-white border-[#EDE9FE] text-[#1E1035]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {t.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-heading font-bold text-[11px] truncate">{t.title}</span>
                            <span className="text-[10px] font-mono text-[#6D6582]">+{t.score}/{t.maxScore}</span>
                          </div>
                          <p className="text-[11px] text-[#6D6582] mt-0.5">{t.message}</p>
                          {!t.passed && (
                            <p className="text-[10px] text-[#7C3AED] font-medium mt-1">
                              Fix: {t.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 sm:p-5 border-t border-[#EDE9FE] flex items-center justify-between bg-white shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-[#DDD6FE] text-[#6D6582] hover:text-[#1E1035] rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveArticle(true)}
                  className="px-4 py-2 bg-[#FAF9FE] hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#6D6582] hover:text-[#1E1035] rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveArticle(false)}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Publishing...' : 'Publish Guide Article'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* SUPABASE SQL SCHEMA MODAL */}
      {/* ========================================================================= */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#EDE9FE] rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-[#EDE9FE] flex items-center justify-between bg-[#FAF9FE] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#1E1035]">
                    Supabase PostgreSQL Schema for Guides &amp; Blog Posts
                  </h3>
                  <p className="text-[11px] text-[#6D6582]">
                    Run this SQL script in your Supabase SQL Editor to persist articles in PostgreSQL.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
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
                    onClick={copySql}
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
    </div>
  );
}
