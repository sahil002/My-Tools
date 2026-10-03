import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { GuideArticle, GuideSection } from '../../types';
import { CATEGORIES } from '../../data/categories';
import {
  calculateRankMathScore,
  RankMathAnalysis,
  RankMathTest,
} from '../../services/guideStorageDB';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
  Sparkles,
  HelpCircle,
  FileCode,
  Eye,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Check,
  Save,
  Palette,
  Highlighter,
  ExternalLink,
  ChevronDown,
  Clock,
  BookOpen,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';

interface WordPressGuideEditorProps {
  initialGuide?: Partial<GuideArticle>;
  onSave: (article: GuideArticle) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export function WordPressGuideEditor({
  initialGuide,
  onSave,
  onClose,
  isSaving = false,
}: WordPressGuideEditorProps) {
  // Article Core Metadata
  const [title, setTitle] = useState(initialGuide?.title || '');
  const [slug, setSlug] = useState(initialGuide?.slug || '');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [description, setDescription] = useState(initialGuide?.description || '');
  const [category, setCategory] = useState(initialGuide?.category || 'calculators');
  const [author, setAuthor] = useState(initialGuide?.author || 'PRBSolver Editorial Team');
  const [targetKeyword, setTargetKeyword] = useState(initialGuide?.targetKeyword || '');
  const [readingTime, setReadingTime] = useState(initialGuide?.readingTime || '5 min read');
  const [quickAnswer, setQuickAnswer] = useState(initialGuide?.quickAnswer || '');
  const [formula, setFormula] = useState(initialGuide?.formula || '');
  const [isDraft, setIsDraft] = useState(Boolean(initialGuide?.isDraft));

  // FAQ Schema Builder
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>(() => {
    if (initialGuide?.faq && initialGuide.faq.length > 0) return initialGuide.faq;
    return [{ question: '', answer: '' }];
  });

  // Editor View Mode: 'visual' (WYSIWYG) or 'html' (Text/Source)
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');

  // HTML Content
  const [contentHtml, setContentHtml] = useState<string>(() => {
    if (initialGuide?.contentHtml) return initialGuide.contentHtml;
    if (initialGuide?.sections && initialGuide.sections.length > 0) {
      // Convert legacy sections to rich HTML
      return initialGuide.sections
        .map((s) => {
          const titleHtml = s.title ? `<h2 class="text-xl font-bold mt-6 mb-3 text-[#1E1035]">${s.title}</h2>` : '';
          const parasHtml = (s.paragraphs || []).map((p) => `<p class="mb-4 text-[#4B3E65] leading-relaxed">${p}</p>`).join('');
          const listHtml = s.listItems && s.listItems.length > 0
            ? `<ul class="list-disc pl-6 mb-4 space-y-1.5 text-[#4B3E65]">${s.listItems.map((li) => `<li>${li}</li>`).join('')}</ul>`
            : '';
          return `${titleHtml}${parasHtml}${listHtml}`;
        })
        .join('');
    }
    return '<p>Start writing or paste your blog post here...</p>';
  });

  // Editor DOM Ref
  const visualEditorRef = useRef<HTMLDivElement>(null);

  // Highlighting target field when user clicks an issue in RankMath
  const [highlightedFieldId, setHighlightedFieldId] = useState<string | null>(null);

  // Modals inside editor
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlign, setImageAlign] = useState<'center' | 'left' | 'right' | 'full'>('center');

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkTargetBlank, setLinkTargetBlank] = useState(true);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  // File upload ref for importing draft
  const draftFileRef = useRef<HTMLInputElement>(null);

  // RankMath Filter Tab: 'all' | 'issues' | 'passed'
  const [rankMathTab, setRankMathTab] = useState<'all' | 'issues' | 'passed'>('all');

  // Auto-generate slug from title if new article
  useEffect(() => {
    if (!initialGuide?.slug && title && !isEditingSlug) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 70);
      setSlug(generated);
    }
  }, [title, initialGuide?.slug, isEditingSlug]);

  // Keep visual editor in sync when switching back to visual mode
  useEffect(() => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      if (visualEditorRef.current.innerHTML !== contentHtml) {
        visualEditorRef.current.innerHTML = contentHtml;
      }
    }
  }, [editorMode]);

  // Listen to visual editor input changes
  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      setContentHtml(visualEditorRef.current.innerHTML);
    }
  };

  // Execute formatting commands on selection
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (editorMode !== 'visual') return;
    visualEditorRef.current?.focus();
    document.execCommand(command, false, value);
    handleVisualInput();
  };

  // Insert Image into Visual Editor
  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    const alignClass =
      imageAlign === 'center'
        ? 'mx-auto text-center'
        : imageAlign === 'left'
        ? 'float-left mr-4 mb-4'
        : imageAlign === 'right'
        ? 'float-right ml-4 mb-4'
        : 'w-full';

    const figureHtml = `
      <figure class="my-6 ${alignClass} clear-both">
        <img src="${imageUrl}" alt="${imageAlt || targetKeyword || 'Article illustration'}" class="rounded-2xl max-w-full h-auto shadow-md border border-[#EDE9FE]" />
        ${imageCaption ? `<figcaption class="text-xs text-[#6D6582] mt-2 italic text-center">${imageCaption}</figcaption>` : ''}
      </figure>
    `;

    execCmd('insertHTML', figureHtml);
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
  };

  // Handle local image file upload (converts to data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Insert Link
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const targetAttr = linkTargetBlank ? 'target="_blank" rel="noopener noreferrer"' : '';
    const textToInsert = linkText.trim() || linkUrl;
    const linkHtml = `<a href="${linkUrl.trim()}" ${targetAttr} class="text-[#7C3AED] hover:underline font-semibold">${textToInsert}</a>`;
    execCmd('insertHTML', linkHtml);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Insert Table
  const handleInsertTable = () => {
    const tableHtml = `
      <div class="my-6 overflow-x-auto border border-[#DDD6FE] rounded-2xl bg-white shadow-2xs">
        <table class="w-full text-left text-xs divide-y divide-[#EDE9FE]">
          <thead class="bg-[#FAF9FE] text-[#1E1035] font-bold">
            <tr>
              <th class="p-3">Concept / Metric</th>
              <th class="p-3">Standard Formula</th>
              <th class="p-3">Practical Example</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EDE9FE] text-[#4B3E65]">
            <tr>
              <td class="p-3 font-semibold text-[#1E1035]">Sample Value A</td>
              <td class="p-3 font-mono text-[#7C3AED]">(X / Y) × 100</td>
              <td class="p-3">Calculated outcome</td>
            </tr>
            <tr>
              <td class="p-3 font-semibold text-[#1E1035]">Sample Value B</td>
              <td class="p-3 font-mono text-[#7C3AED]">P × (1 + r/n)^(nt)</td>
              <td class="p-3">Compound yield</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    execCmd('insertHTML', tableHtml);
  };

  // Import / Upload Draft file (.txt, .md, .html)
  const handleDraftFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const guideEntry =
          zip.file('guide.json') ||
          Object.values(zip.files).find((entry) => !entry.dir && /(^|\/)guide\.json$/i.test(entry.name));

        if (!guideEntry) throw new Error('Invalid Guide ZIP: guide.json was not found.');
        const imported = JSON.parse(await guideEntry.async('string')) as Partial<GuideArticle>;

        if (!imported.title?.trim() || !imported.slug?.trim()) {
          throw new Error('Invalid Guide ZIP: title and slug are required.');
        }

        setTitle(imported.title || '');
        setSlug(imported.slug || '');
        setDescription(imported.description || '');
        setCategory((imported.category as string) || 'calculators');
        setAuthor(imported.author || 'PRBSolver Editorial Team');
        setTargetKeyword(imported.targetKeyword || '');
        setReadingTime(imported.readingTime || '5 min read');
        setQuickAnswer(imported.quickAnswer || '');
        setFormula(imported.formula || '');
        setIsDraft(Boolean(imported.isDraft));
        setFaqItems(imported.faq?.length ? imported.faq : [{ question: '', answer: '' }]);

        const importedHtml = imported.contentHtml?.trim() || (imported.sections || []).map((s) => {
          const heading = s.title ? '<h2 class="text-xl font-bold mt-6 mb-3 text-[#1E1035]">' + s.title + '</h2>' : '';
          const paragraphs = (s.paragraphs || []).map((p) => '<p class="mb-4 text-[#4B3E65] leading-relaxed">' + p + '</p>').join('');
          const list = s.listItems?.length
            ? '<ul class="list-disc pl-6 mb-4 space-y-1.5 text-[#4B3E65]">' + s.listItems.map((li) => '<li>' + li + '</li>').join('') + '</ul>'
            : '';
          return heading + paragraphs + list;
        }).join('');

        if (!importedHtml) throw new Error('Invalid Guide ZIP: contentHtml or guide sections are required.');
        setContentHtml(importedHtml);
        if (visualEditorRef.current) visualEditorRef.current.innerHTML = importedHtml;
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Unable to import the guide package.');
      } finally {
        if (draftFileRef.current) draftFileRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const raw = (event.target?.result as string) || '';
      // If it's HTML, load directly
      if (file.name.endsWith('.html') || raw.includes('<p>') || raw.includes('<div>')) {
        setContentHtml(raw);
        if (visualEditorRef.current) visualEditorRef.current.innerHTML = raw;
        return;
      }

      // Convert Markdown to clean rich HTML
      const lines = raw.split('\n');
      let html = '';
      let detectedTitle = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (!detectedTitle && trimmed.startsWith('# ')) {
          detectedTitle = trimmed.replace(/^#\s*/, '');
          continue;
        }
        if (trimmed.startsWith('## ')) {
          html += `<h2 class="text-xl font-bold mt-6 mb-3 text-[#1E1035]">${trimmed.replace(/^##\s*/, '')}</h2>`;
        } else if (trimmed.startsWith('### ')) {
          html += `<h3 class="text-lg font-bold mt-4 mb-2 text-[#1E1035]">${trimmed.replace(/^###\s*/, '')}</h3>`;
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          html += `<li class="ml-6 list-disc mb-1 text-[#4B3E65]">${trimmed.replace(/^[-*]\s*/, '')}</li>`;
        } else if (/^\d+\.\s/.test(trimmed)) {
          html += `<li class="ml-6 list-decimal mb-1 text-[#4B3E65]">${trimmed.replace(/^\d+\.\s*/, '')}</li>`;
        } else {
          // Convert bold **text** to <strong>
          const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          html += `<p class="mb-4 text-[#4B3E65] leading-relaxed">${formatted}</p>`;
        }
      }

      if (detectedTitle && !title) {
        setTitle(detectedTitle);
      }
      setContentHtml(html);
      if (visualEditorRef.current) visualEditorRef.current.innerHTML = html;
    };
    reader.readAsText(file);
    if (draftFileRef.current) draftFileRef.current.value = '';
  };

  // Build current guide article for RankMath scoring
  const currentGuidePreview: Partial<GuideArticle> = {
    title,
    slug,
    description,
    category: category as any,
    targetKeyword,
    quickAnswer,
    formula,
    contentHtml,
    faq: faqItems.filter((f) => f.question.trim()),
    sections: [],
  };

  const rankMath = calculateRankMathScore(currentGuidePreview);

  // Jump and highlight field when clicking an issue in RankMath
  const handleJumpToField = (fieldId: string) => {
    setHighlightedFieldId(fieldId);

    // Scroll to the element
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // If it's an input or textarea, focus it
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.focus();
      } else if (fieldId === 'guide-editor-content') {
        visualEditorRef.current?.focus();
      }
    }

    // Clear highlight after 2.5 seconds
    setTimeout(() => {
      setHighlightedFieldId(null);
    }, 2500);
  };

  // Handle Save / Publish
  const handleSaveArticle = async () => {
    const finalSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 70);
    const words = (contentHtml.replace(/<[^>]+>/g, ' ').match(/\S+/g) || []).length;
    const estReadingTime = `${Math.max(2, Math.ceil(words / 200))} min read`;

    const articleToSave: GuideArticle = {
      title: title.trim() || 'Untitled Guide',
      slug: finalSlug,
      description: description.trim() || `Comprehensive guide and calculations for ${title}.`,
      category: category as any,
      author: author.trim() || 'PRBSolver Editorial Team',
      publishedDate: initialGuide?.publishedDate || new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      readingTime: estReadingTime,
      quickAnswer: quickAnswer.trim() || description.trim(),
      formula: formula.trim() || undefined,
      contentHtml: contentHtml.trim(),
      targetKeyword: targetKeyword.trim(),
      seoScore: rankMath.overallScore,
      isDraft,
      sections: [],
      practicalExamples: initialGuide?.practicalExamples || [],
      commonMistakes: initialGuide?.commonMistakes || [],
      relatedTools: initialGuide?.relatedTools || [],
      relatedGuides: initialGuide?.relatedGuides || [],
      faq: faqItems.filter((f) => f.question.trim()),
    };

    await onSave(articleToSave);
  };

  const filteredTests = rankMath.tests.filter((t) => {
    if (rankMathTab === 'issues') return !t.passed;
    if (rankMathTab === 'passed') return t.passed;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#EDE9FE] rounded-3xl shadow-2xl max-w-7xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 font-sans">
        
        {/* ========================================================================= */}
        {/* TOP WORDPRESS HEADER & ACTION BAR */}
        {/* ========================================================================= */}
        <header className="p-4 sm:p-5 border-b border-[#EDE9FE] flex items-center justify-between bg-[#FAF9FE] shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-xs font-bold text-sm">
              WP
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-sm sm:text-base text-[#1E1035] flex items-center gap-2">
                <span>{initialGuide?.slug ? `Editing: ${title || slug}` : 'WordPress Visual Blog & Guide Editor'}</span>
                {isDraft ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Draft
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Ready to Publish
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-[#6D6582]">
                Full WYSIWYG text formatting, real-time RankMath SEO diagnostics, media uploads, and Supabase database sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Draft toggle */}
            <label className="flex items-center gap-2 text-xs font-heading font-semibold text-[#6D6582] cursor-pointer mr-1">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="w-4 h-4 text-[#7C3AED] rounded border-[#DDD6FE] focus:ring-[#7C3AED]"
              />
              <span>Save as Draft</span>
            </label>

            {/* Save / Publish button */}
            <button
              type="button"
              onClick={handleSaveArticle}
              disabled={isSaving || !title.trim()}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : isDraft ? 'Save Draft' : 'Publish Article'}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
              title="Close Editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN SPLIT VIEW: EDITOR (LEFT) + RANKMATH LIVE PANEL (RIGHT) */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#EDE9FE]">
          
          {/* LEFT COLUMN: THE WORDPRESS WORKSPACE (Col 8) */}
          <div className="lg:col-span-8 p-4 sm:p-6 space-y-5 overflow-y-auto">
            
            {/* 1. Article Title (WordPress Massive Header) */}
            <div
              id="guide-field-title"
              className={`p-1 rounded-2xl transition-all ${
                highlightedFieldId === 'guide-field-title' ? 'ring-4 ring-[#7C3AED] ring-offset-2 animate-pulse bg-purple-50/50' : ''
              }`}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add title (e.g. How to Calculate Percentage: The Complete Step-by-Step Guide)"
                className="w-full text-xl sm:text-2xl font-heading font-extrabold text-[#1E1035] placeholder-[#9D95B3] bg-transparent border-b-2 border-[#EDE9FE] focus:border-[#7C3AED] pb-2 outline-none transition-colors"
              />
            </div>

            {/* 2. Permalink / Slug & Category Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#FAF9FE] p-3 rounded-2xl border border-[#EDE9FE]">
              <div
                id="guide-field-slug"
                className={`flex items-center gap-1.5 flex-1 min-w-[280px] p-1 rounded-xl transition-all ${
                  highlightedFieldId === 'guide-field-slug' ? 'ring-4 ring-[#7C3AED] animate-pulse bg-purple-100/50' : ''
                }`}
              >
                <span className="text-[#6D6582] font-semibold">Permalink:</span>
                <span className="text-[#9D95B3] font-mono">prbsolver.com/guides/</span>
                {isEditingSlug ? (
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    onBlur={() => setIsEditingSlug(false)}
                    autoFocus
                    className="px-2 py-0.5 bg-white border border-[#7C3AED] rounded-md text-[#7C3AED] font-mono text-xs outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingSlug(true)}
                    className="font-mono font-bold text-[#7C3AED] hover:underline cursor-pointer flex items-center gap-1"
                    title="Click to edit URL slug"
                  >
                    <span>{slug || 'auto-generated-slug'}</span>
                    <span className="text-[10px] text-[#9D95B3] font-normal underline">edit</span>
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[#6D6582] font-semibold">Category:</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-white border border-[#DDD6FE] text-[#1E1035] font-semibold rounded-xl px-2.5 py-1 outline-none cursor-pointer focus:border-[#7C3AED]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. SEO Meta Description & Focus Keyword */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              {/* Focus Keyword */}
              <div
                id="guide-field-keyword"
                className={`md:col-span-5 p-3 rounded-2xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-1.5 transition-all ${
                  highlightedFieldId === 'guide-field-keyword' ? 'ring-4 ring-[#7C3AED] animate-pulse bg-purple-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="font-heading font-bold text-[#1E1035]">Focus Keyword</label>
                  <span className="text-[10px] text-[#7C3AED] font-semibold">RankMath Target</span>
                </div>
                <input
                  type="text"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  placeholder="e.g. calculate percentage"
                  className="w-full px-3 py-1.5 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] outline-none"
                />
              </div>

              {/* Meta Description / Excerpt */}
              <div
                id="guide-field-description"
                className={`md:col-span-7 p-3 rounded-2xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-1.5 transition-all ${
                  highlightedFieldId === 'guide-field-description' ? 'ring-4 ring-[#7C3AED] animate-pulse bg-purple-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="font-heading font-bold text-[#1E1035]">SEO Meta Description (Snippet)</label>
                  <span className={`text-[10px] font-mono ${description.length >= 120 && description.length <= 160 ? 'text-emerald-600 font-bold' : 'text-[#9D95B3]'}`}>
                    {description.length} / 160 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief 1-2 sentence overview for Google search results and social cards..."
                  className="w-full px-3 py-1.5 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] outline-none"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. THE REAL WORDPRESS WYSIWYG & SOURCE TEXT EDITOR */}
            {/* ========================================================================= */}
            <div
              id="guide-editor-content"
              className={`border border-[#DDD6FE] rounded-2xl bg-white shadow-xs overflow-hidden transition-all ${
                highlightedFieldId === 'guide-editor-content' ? 'ring-4 ring-[#7C3AED] ring-offset-2 animate-pulse' : ''
              }`}
            >
              {/* WordPress Mode Switcher & Draft Import */}
              <div className="p-2 sm:px-3 bg-[#F5F3FF] border-b border-[#DDD6FE] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#DDD6FE] text-xs font-heading font-bold">
                  <button
                    type="button"
                    onClick={() => setEditorMode('visual')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      editorMode === 'visual'
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'text-[#6D6582] hover:text-[#1E1035]'
                    }`}
                  >
                    Visual (WYSIWYG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('html')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      editorMode === 'html'
                        ? 'bg-[#7C3AED] text-white shadow-2xs'
                        : 'text-[#6D6582] hover:text-[#1E1035]'
                    }`}
                  >
                    Text / HTML Source
                  </button>
                </div>

                {/* Import / Upload Draft file */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={draftFileRef}
                    onChange={handleDraftFileUpload}
                    accept=".zip,.txt,.md,.markdown,.html"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => draftFileRef.current?.click()}
                    className="px-3 py-1 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] rounded-xl text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Import a structured Guide ZIP or markdown/text draft"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Import Guide (.zip, .md, .html)</span>
                  </button>
                </div>
              </div>

              {/* WordPress Classic Ribbon / Toolbar (active in Visual mode) */}
              {editorMode === 'visual' && (
                <div className="p-2 border-b border-[#EDE9FE] bg-[#FAF9FE] flex flex-wrap items-center gap-1 text-xs">
                  {/* Headings Selector */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        execCmd('formatBlock', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="px-2 py-1 bg-white border border-[#DDD6FE] rounded-lg text-xs font-semibold text-[#1E1035] outline-none cursor-pointer hover:border-[#7C3AED]"
                    defaultValue=""
                  >
                    <option value="" disabled>Format / Heading</option>
                    <option value="<p>">Paragraph</option>
                    <option value="<h1>">Heading 1 (H1)</option>
                    <option value="<h2>">Heading 2 (H2)</option>
                    <option value="<h3>">Heading 3 (H3)</option>
                    <option value="<h4>">Heading 4 (H4)</option>
                    <option value="<blockquote>">Blockquote</option>
                    <option value="<pre>">Code Block</option>
                  </select>

                  <div className="h-5 w-px bg-[#DDD6FE] mx-1" />

                  {/* Formatting Buttons */}
                  <button
                    type="button"
                    onClick={() => execCmd('bold')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer transition-colors"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('italic')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer transition-colors"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('underline')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer transition-colors"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('strikeThrough')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer transition-colors"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-[#DDD6FE] mx-1" />

                  {/* Alignment */}
                  <button
                    type="button"
                    onClick={() => execCmd('justifyLeft')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('justifyCenter')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('justifyRight')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('justifyFull')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Justify"
                  >
                    <AlignJustify className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-[#DDD6FE] mx-1" />

                  {/* Colors: Text & Background Highlight */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowColorPicker(!showColorPicker);
                        setShowHighlightPicker(false);
                      }}
                      className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer flex items-center gap-0.5"
                      title="Text Color"
                    >
                      <Palette className="w-4 h-4" />
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-[#DDD6FE] rounded-xl shadow-xl z-30 flex gap-1.5 flex-wrap w-44">
                        {['#1E1035', '#7C3AED', '#2563EB', '#16A34A', '#DC2626', '#EA580C', '#6D6582'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              execCmd('foreColor', color);
                              setShowColorPicker(false);
                            }}
                            className="w-5 h-5 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowHighlightPicker(!showHighlightPicker);
                        setShowColorPicker(false);
                      }}
                      className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer flex items-center gap-0.5"
                      title="Highlight Background Color"
                    >
                      <Highlighter className="w-4 h-4" />
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    {showHighlightPicker && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-[#DDD6FE] rounded-xl shadow-xl z-30 flex gap-1.5 flex-wrap w-44">
                        {['#FEF08A', '#EDE9FE', '#DCFCE7', '#DBEAFE', '#FCE7F3', 'transparent'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              execCmd('hiliteColor', color);
                              setShowHighlightPicker(false);
                            }}
                            className="w-5 h-5 rounded-md border border-gray-300 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center text-[10px]"
                            style={{ backgroundColor: color }}
                            title={color === 'transparent' ? 'Clear Highlight' : color}
                          >
                            {color === 'transparent' && '✕'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-5 w-px bg-[#DDD6FE] mx-1" />

                  {/* Lists */}
                  <button
                    type="button"
                    onClick={() => execCmd('insertUnorderedList')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('insertOrderedList')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-[#DDD6FE] mx-1" />

                  {/* Media & Inserts */}
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="p-1.5 hover:bg-[#F5F3FF] hover:text-[#7C3AED] rounded-lg text-[#7C3AED] font-semibold cursor-pointer flex items-center gap-1"
                    title="Insert Image / Media"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Add Media</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkModal(true)}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Insert Link (Ctrl+K)"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertTable}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Insert Table"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => execCmd('insertHorizontalRule')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Horizontal Divider"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-px bg-[#DDD6FE] mx-1" />

                  {/* Undo / Redo */}
                  <button
                    type="button"
                    onClick={() => execCmd('undo')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Undo"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd('redo')}
                    className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                    title="Redo"
                  >
                    <Redo className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Editor Workspace Canvas */}
              {editorMode === 'visual' ? (
                <div
                  ref={visualEditorRef}
                  contentEditable
                  onInput={handleVisualInput}
                  onBlur={handleVisualInput}
                  className="min-h-[420px] max-h-[580px] overflow-y-auto p-6 text-base text-[#1E1035] leading-relaxed outline-none focus:outline-none article-body prose prose-purple max-w-none"
                  style={{ minHeight: '420px' }}
                />
              ) : (
                <textarea
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  rows={20}
                  placeholder="<p>Enter raw HTML content here...</p>"
                  className="w-full min-h-[420px] max-h-[580px] p-5 font-mono text-xs text-[#1E1035] bg-[#FAF9FE] outline-none border-none resize-y leading-relaxed"
                />
              )}
            </div>

            {/* 5. Special Meta Boxes: Quick Answer & Mathematical Formula */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Answer / Key Takeaway */}
              <div
                id="guide-field-quick-answer"
                className={`p-4 rounded-2xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-2 transition-all ${
                  highlightedFieldId === 'guide-field-quick-answer' ? 'ring-4 ring-[#7C3AED] animate-pulse bg-purple-50' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#7C3AED]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Key Takeaway / Quick Answer (Featured Snippet)</span>
                </div>
                <p className="text-[11px] text-[#6D6582]">
                  Direct 1-2 sentence direct solution to win Position Zero on Google.
                </p>
                <textarea
                  value={quickAnswer}
                  onChange={(e) => setQuickAnswer(e.target.value)}
                  rows={3}
                  placeholder="To calculate a percentage of any number, divide the percentage by 100 and multiply by the total whole value..."
                  className="w-full p-2.5 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                />
              </div>

              {/* Formula & Proof Box */}
              <div
                id="guide-field-formula"
                className={`p-4 rounded-2xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-2 transition-all ${
                  highlightedFieldId === 'guide-field-formula' ? 'ring-4 ring-[#7C3AED] animate-pulse bg-purple-50' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#1E1035]">
                  <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Mathematical Formula / Calculation Rule</span>
                </div>
                <p className="text-[11px] text-[#6D6582]">
                  Exact equation displayed in the formula highlight banner.
                </p>
                <textarea
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  rows={3}
                  placeholder="Percentage (%) = (Part / Whole) × 100"
                  className="w-full p-2.5 font-mono bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#7C3AED] font-bold outline-none"
                />
              </div>
            </div>

            {/* 6. FAQ Rich Snippets Builder */}
            <div
              id="guide-field-faq"
              className={`p-4 rounded-2xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-3 transition-all ${
                highlightedFieldId === 'guide-field-faq' ? 'ring-4 ring-[#7C3AED] animate-pulse bg-purple-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-xs font-heading font-bold text-[#1E1035]">
                    Frequently Asked Questions (Google Accordion Schema)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFaqItems([...faqItems, { question: '', answer: '' }])}
                  className="px-2.5 py-1 bg-white hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] rounded-lg text-xs font-heading font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add FAQ</span>
                </button>
              </div>

              <div className="space-y-3">
                {faqItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white border border-[#EDE9FE] rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-heading font-bold text-[#6D6582]">Question #{idx + 1}</span>
                      {faqItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const copy = [...faqItems];
                        copy[idx].question = e.target.value;
                        setFaqItems(copy);
                      }}
                      placeholder="e.g. Can a percentage be greater than 100%?"
                      className="w-full px-3 py-1.5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-lg text-xs text-[#1E1035] outline-none"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const copy = [...faqItems];
                        copy[idx].answer = e.target.value;
                        setFaqItems(copy);
                      }}
                      rows={2}
                      placeholder="Yes, when a quantity exceeds its original baseline..."
                      className="w-full px-3 py-1.5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-lg text-xs text-[#1E1035] outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: REAL-TIME RANKMATH SEO ENGINE (Col 4) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-[#FAF9FE] space-y-4 overflow-y-auto">
            
            {/* RankMath Score Badge Header */}
            <div className="p-4 rounded-2xl bg-white border border-[#EDE9FE] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-bold text-[#6D6582] uppercase tracking-wider">
                  Real-Time RankMath SEO Score
                </span>
                <span className="text-xs font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-full border border-[#DDD6FE]">
                  RankMath v3.2
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-heading font-extrabold shadow-md shrink-0"
                  style={{ backgroundColor: rankMath.gradeColor }}
                >
                  <span className="text-xl leading-none">{rankMath.overallScore}</span>
                  <span className="text-[9px] uppercase tracking-wider opacity-90">/ 100</span>
                </div>
                <div>
                  <div className="font-heading font-bold text-sm text-[#1E1035]">
                    {rankMath.gradeLabel}
                  </div>
                  <div className="text-[11px] text-[#6D6582]">
                    <strong>{rankMath.passedCount} of {rankMath.totalCount}</strong> tests passed for focus keyword:
                    <span className="text-[#7C3AED] font-semibold block truncate max-w-[180px]">
                      &ldquo;{targetKeyword || 'none set'}&rdquo;
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs: All (17) | Issues (X) | Passed (Y) */}
              <div className="grid grid-cols-3 gap-1 bg-[#FAF9FE] p-1 rounded-xl border border-[#EDE9FE] text-center text-xs font-heading font-bold">
                <button
                  type="button"
                  onClick={() => setRankMathTab('all')}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    rankMathTab === 'all'
                      ? 'bg-white text-[#7C3AED] shadow-2xs'
                      : 'text-[#6D6582] hover:text-[#1E1035]'
                  }`}
                >
                  All ({rankMath.totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRankMathTab('issues')}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    rankMathTab === 'issues'
                      ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200'
                      : 'text-rose-600 hover:text-rose-800'
                  }`}
                >
                  Issues ({rankMath.issuesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRankMathTab('passed')}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    rankMathTab === 'passed'
                      ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200'
                      : 'text-emerald-600 hover:text-emerald-800'
                  }`}
                >
                  Passed ({rankMath.passedCount})
                </button>
              </div>

              {/* Exact SEO Vital Metrics Bar */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EDE9FE] text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                  <span className="block text-[10px] text-[#9D95B3] font-sans font-bold uppercase">Word Count</span>
                  <strong className="text-[#1E1035] text-xs">{rankMath.wordCount}</strong>
                  <span className="text-[#6D6582] ml-1">({rankMath.readingTimeText})</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                  <span className="block text-[10px] text-[#9D95B3] font-sans font-bold uppercase">Keyword Density</span>
                  <strong className="text-[#1E1035] text-xs">{rankMath.keywordDensity}%</strong>
                  <span className="text-[#6D6582] ml-1">({rankMath.keywordCount}x)</span>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                  <span className="block text-[10px] text-[#9D95B3] font-sans font-bold uppercase">Headings</span>
                  <strong className="text-[#1E1035] text-xs">{rankMath.headingsSummary}</strong>
                </div>
                <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                  <span className="block text-[10px] text-[#9D95B3] font-sans font-bold uppercase">Links (Int/Ext)</span>
                  <strong className="text-[#1E1035] text-xs">{rankMath.linksSummary}</strong>
                </div>
              </div>
            </div>

            {/* Click-to-Fix RankMath Diagnostics List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-heading font-bold text-[#1E1035]">Checkpoints &amp; Recommendations</span>
                <span className="text-[10px] text-[#7C3AED]">Click to jump to fix</span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredTests.map((test) => (
                  <div
                    key={test.id}
                    onClick={() => handleJumpToField(test.targetFieldId)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] hover:shadow-sm ${
                      test.passed
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}
                    title="Click to jump directly to this section in the editor"
                  >
                    <div className="flex items-start gap-2">
                      {test.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-heading font-bold leading-tight">{test.title}</span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              test.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {test.passed ? `+${test.score}` : '0'}/{test.maxScore}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-0.5">{test.message}</p>
                        {!test.passed && (
                          <div className="mt-1.5 pt-1 border-t border-rose-200 flex items-center justify-between text-[10px] text-rose-800 font-semibold">
                            <span>{test.recommendation}</span>
                            <span className="underline font-bold text-[#7C3AED] hover:text-[#6D28D9] shrink-0 ml-1">
                              {test.fixActionLabel} →
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: INSERT MEDIA / IMAGE DIALOG */}
        {/* ========================================================================= */}
        {showImageModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#EDE9FE] pb-3">
                <h3 className="font-heading font-bold text-sm text-[#1E1035] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#7C3AED]" />
                  <span>Insert Image or Media</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Image Source */}
                <div>
                  <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                    Image URL or Upload from Computer
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs outline-none"
                    />
                    <label className="px-3 py-2 bg-white border border-[#DDD6FE] hover:bg-[#FAF9FE] text-[#7C3AED] font-heading font-bold rounded-xl cursor-pointer shadow-2xs shrink-0 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                    Alt Text (Important for RankMath SEO!)
                  </label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder={`e.g. Formula breakdown for ${targetKeyword || 'percentage calculation'}`}
                    className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs outline-none"
                  />
                </div>

                {/* Caption */}
                <div>
                  <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                    Image Caption (Optional)
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Figure 1: Percentage calculation formula diagram"
                    className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs outline-none"
                  />
                </div>

                {/* Alignment */}
                <div>
                  <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                    Alignment
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['center', 'left', 'right', 'full'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setImageAlign(pos)}
                        className={`py-1.5 rounded-lg capitalize font-heading font-bold text-xs border cursor-pointer ${
                          imageAlign === pos
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                            : 'bg-white text-[#6D6582] border-[#DDD6FE] hover:bg-[#FAF9FE]'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9FE]">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-heading font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-heading font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  Insert Image into Article
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: INSERT LINK DIALOG */}
        {/* ========================================================================= */}
        {showLinkModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#EDE9FE] pb-2.5">
                <h3 className="font-heading font-bold text-sm text-[#1E1035] flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-[#7C3AED]" />
                  <span>Insert Hyperlink</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                    Link Destination URL *
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://prbsolver.com/tools/percentage-calculator"
                    className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#1E1035] mb-1">
                    Link Anchor Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="e.g. Try our Percentage Calculator"
                    className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-xs outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={linkTargetBlank}
                    onChange={(e) => setLinkTargetBlank(e.target.checked)}
                    className="w-4 h-4 text-[#7C3AED] rounded"
                  />
                  <span className="text-[#6D6582]">Open link in new browser tab</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9FE]">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-heading font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-heading font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
