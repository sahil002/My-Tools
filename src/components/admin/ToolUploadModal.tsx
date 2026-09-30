import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  FileCode,
  Eye,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  validateAndExtractZip,
  generateSampleToolZip,
  saveCustomTool,
  ZipValidationResult,
  ToolListItem,
} from '../../services/customToolsService';
import { DBToolRecord } from '../../services/toolStorageDB';
import { getAllCategoriesFromStorage, DEFAULT_TEMPLATE_CATEGORIES } from '../../services/categoryStorageDB';

interface ToolUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSaved: () => void;
  initialTool?: ToolListItem | null;
}

const AVAILABLE_ICONS = [
  'Calculator',
  'Type',
  'RefreshCw',
  'Calendar',
  'GraduationCap',
  'Code',
  'Percent',
  'FileText',
  'Binary',
  'Sparkles',
  'Sliders',
  'ShieldCheck',
  'Hash',
  'Wrench',
  'Zap',
  'Layers',
];

export function ToolUploadModal({
  isOpen,
  onClose,
  onToolSaved,
  initialTool,
}: ToolUploadModalProps) {
  const isEditing = Boolean(initialTool);

  // Dynamic Categories from storage
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(() => {
    const fromStorage = getAllCategoriesFromStorage();
    if (fromStorage && fromStorage.length > 0) {
      return fromStorage.map((c) => ({ id: c.slug, name: c.name }));
    }
    return DEFAULT_TEMPLATE_CATEGORIES.map((c) => ({ id: c.slug, name: c.name }));
  });

  useEffect(() => {
    const fromStorage = getAllCategoriesFromStorage();
    if (fromStorage && fromStorage.length > 0) {
      setCategories(fromStorage.map((c) => ({ id: c.slug, name: c.name })));
    }
  }, [isOpen]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'info' | 'zip' | 'seo' | 'preview'>('info');

  // Form states
  const [name, setName] = useState(initialTool?.name || '');
  const [slug, setSlug] = useState(initialTool?.slug || '');
  const [category, setCategory] = useState<string>(
    initialTool?.category || (categories[0]?.id ?? 'calculators')
  );
  const [description, setDescription] = useState(initialTool?.description || '');
  const [longDescription, setLongDescription] = useState(initialTool?.longDescription || '');
  const [seoTitle, setSeoTitle] = useState(initialTool?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialTool?.seoDescription || '');
  const [iconName, setIconName] = useState(initialTool?.iconName || 'Wrench');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialTool?.thumbnailUrl || '');
  const [keywords, setKeywords] = useState(initialTool?.keywords.join(', ') || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(initialTool?.status || 'active');

  // Zip upload states
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [zipResult, setZipResult] = useState<ZipValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && (!slug || slug === slugify(name))) {
      const newSlug = slugify(val);
      setSlug(newSlug);
      if (!seoTitle || seoTitle.includes('–')) {
        setSeoTitle(`${val} – Free Online Tool`);
      }
    }
  };

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Handle direct image file upload for thumbnail
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnailUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Zip file selection
  const handleZipFile = async (file: File) => {
    setErrorMsg(null);
    setIsProcessingZip(true);
    setProgressPercent(10);
    setProgressStep('Verifying file format and signature...');

    try {
      const result = await validateAndExtractZip(file, (percent, step) => {
        setProgressPercent(percent);
        setProgressStep(step);
      });

      if (!result.valid) {
        setErrorMsg(result.error || 'Failed to process zip file.');
        setZipResult(null);
      } else {
        setZipResult(result);
        setErrorMsg(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown extraction error.');
      setZipResult(null);
    } finally {
      setIsProcessingZip(false);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleZipFile(e.dataTransfer.files[0]);
    }
  };

  // 1-Click demo zip generator for instant testing
  const handleDemoZip = async (preset: 'tip-calculator' | 'contrast-checker') => {
    setErrorMsg(null);
    setIsProcessingZip(true);
    setProgressPercent(20);
    setProgressStep(`Generating sample ${preset} package...`);

    try {
      const zipBlob = await generateSampleToolZip(preset);
      const sampleFile = new File([zipBlob], `${preset}.zip`, { type: 'application/zip' });
      await handleZipFile(sampleFile);

      if (!name) {
        if (preset === 'tip-calculator') {
          handleNameChange('Tip & Split Calculator');
          setDescription('Quickly compute gratuity tips and split bills evenly with dining companions.');
          setKeywords('tip, calculator, dining, gratuity, bill split');
          setCategory('calculators');
        } else {
          handleNameChange('WCAG Color Contrast Checker');
          setDescription('Test foreground and background color combinations against WCAG 2.1 AA/AAA accessibility standards.');
          setKeywords('contrast, accessibility, wcag, color, developer');
          setCategory('developer-tools');
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate demo zip.');
    } finally {
      setIsProcessingZip(false);
    }
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Tool name is required.');
      setActiveTab('info');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('Tool slug is required.');
      setActiveTab('info');
      return;
    }

    // Require zip if adding a new tool
    if (!isEditing && !zipResult) {
      setErrorMsg('A validated .zip package with index.html is required for new tools.');
      setActiveTab('zip');
      return;
    }

    setIsSaving(true);

    try {
      const toolRecord: DBToolRecord = {
        id: initialTool?.id || slug,
        name: name.trim(),
        slug: slug.trim(),
        category,
        description: description.trim(),
        longDescription: longDescription.trim() || undefined,
        seoTitle: seoTitle.trim() || `${name} – Free Online Tool`,
        seoDescription: seoDescription.trim() || description.trim(),
        iconName,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        featured: initialTool?.featured || false,
        popular: initialTool?.popular || false,
        status,
        isCustom: true,
        createdAt: initialTool?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        zipFileName: zipResult?.zipFileName || initialTool?.zipFileName || 'package.zip',
        zipFileSize: zipResult?.totalSize || initialTool?.zipFileSize || 0,
        filesCount: zipResult?.filesCount || initialTool?.filesCount || 1,
        entryHtmlPath: zipResult?.entryHtmlPath || initialTool?.entryHtmlPath || 'index.html',
        extractedHtml: zipResult?.extractedHtml || '',
        performance: initialTool?.performance || {
          views: 120,
          invocations: 85,
          avgDurationSec: 45,
          rating: 5.0,
        },
      };

      await saveCustomTool(toolRecord);
      setSaveSuccess(true);
      setTimeout(() => {
        onToolSaved();
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(`Failed to save tool: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="tool-upload-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#1E1035]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
    >
      <div
        id="tool-upload-modal"
        className="bg-white border border-[#EDE9FE] rounded-2xl w-full max-w-3xl my-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150"
      >
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-[#EDE9FE] flex items-center justify-between shrink-0 bg-[#FAF9FE]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-extrabold text-[#1E1035]">
                {isEditing && initialTool ? `Edit Tool: ${initialTool.name}` : 'Deploy New Embedded Tool'}
              </h2>
              <p className="text-xs text-[#6D6582]">
                ZIP Upload &amp; Sandboxed Auto-Embedding Engine
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-upload-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#EDE9FE] bg-white text-xs font-heading font-semibold overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            1. Basic Metadata
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('zip')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'zip'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            <span>2. ZIP Upload &amp; Auto-Embed</span>
            {zipResult && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'seo'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            3. SEO &amp; Discovery
          </button>

          {zipResult && (
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'border-[#7C3AED] text-[#7C3AED]'
                  : 'border-transparent text-[#6D6582] hover:text-[#1E1035]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>4. Sandbox Test Run</span>
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl text-xs bg-red-50 text-red-800 border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Tool saved successfully! Registered at /tools/{slug}</span>
          </div>
        )}

        {/* Tab Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC METADATA */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                    Tool Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Tip & Split Calculator"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 text-xs bg-[#FAF9FE] border border-r-0 border-[#DDD6FE] rounded-l-xl text-[#6D6582]">
                      /tools/
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="tip-and-split-calculator"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-r-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    <option value="active">Active (Visible on Website)</option>
                    <option value="inactive">Inactive / Draft (Hidden from Public)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Quick 1-2 sentence overview of what the tool accomplishes..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                  Detailed Concept / Methodology Explanation
                </label>
                <textarea
                  rows={3}
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="In-depth educational breakdown of how the math, algorithms, or formulas operate..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                    Visual Icon
                  </label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-heading font-semibold text-[#1E1035]">
                      Thumbnail Image URL (Optional)
                    </label>
                    {thumbnailUrl && (
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        className="text-[11px] font-medium text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Paste image URL (https://...) or upload image"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] rounded-xl text-xs font-heading font-semibold cursor-pointer shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Img</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {thumbnailUrl && (
                    <div className="flex items-center gap-2.5 p-2 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl">
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail Preview"
                        className="w-10 h-10 object-cover rounded-lg border border-[#DDD6FE]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="text-[11px] text-[#6D6582] truncate min-w-0">
                        <span className="font-semibold text-[#1E1035] block truncate">
                          Thumbnail Loaded
                        </span>
                        <span className="text-[10px] text-[#9D95B3] truncate block">
                          {thumbnailUrl.startsWith('data:') ? 'Custom uploaded image (Ready to save)' : thumbnailUrl}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ZIP UPLOAD & AUTO-EMBED */}
          {activeTab === 'zip' && (
            <div className="space-y-5">
              {/* Guidance Notice */}
              <div className="p-3.5 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-xs text-[#1E1035]">
                <div className="flex items-center gap-2 font-heading font-bold text-[#7C3AED]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Isolated Sandboxed Auto-Embed Specifications</span>
                </div>
                <ul className="mt-1.5 space-y-1 text-[#6D6582] text-[11px] list-disc list-inside">
                  <li>Archive must contain an entry <code>index.html</code> (at root or top folder).</li>
                  <li>Linked stylesheets (<code>.css</code>) and scripts (<code>.js</code>) are auto-resolved into an isolated bundle.</li>
                  <li>Server-side executables (e.g. <code>.php</code>, <code>.sh</code>, <code>.exe</code>) are blocked.</li>
                  <li>Runs in a sandboxed iframe with complete client privacy. Max size: 25 MB.</li>
                </ul>
              </div>

              {/* Drag and Drop Zone */}
              <div
                id="zip-dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#7C3AED] bg-[#F5F3FF]'
                    : 'border-[#DDD6FE] hover:border-[#7C3AED] bg-[#FAF9FE]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleZipFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="text-sm font-heading font-bold text-[#1E1035]">
                  Drop tool .zip package here, or browse files
                </div>
                <p className="text-xs text-[#6D6582] mt-1">
                  Supports client-side HTML/CSS/JS bundles up to 25 MB
                </p>
              </div>

              {/* 1-Click Demo Buttons for Fast Testing */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                <div className="text-xs">
                  <span className="font-heading font-semibold text-[#1E1035]">Need a test archive?</span>
                  <span className="text-[#6D6582] ml-1">Generate a working demo bundle in 1 click:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoZip('tip-calculator')}
                    disabled={isProcessingZip}
                    className="px-3 py-1.5 text-xs font-heading font-semibold bg-white border border-[#DDD6FE] rounded-lg text-[#1E1035] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    Tip Calculator (.zip)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoZip('contrast-checker')}
                    disabled={isProcessingZip}
                    className="px-3 py-1.5 text-xs font-heading font-semibold bg-white border border-[#DDD6FE] rounded-lg text-[#1E1035] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    Contrast Checker (.zip)
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              {isProcessingZip && (
                <div className="space-y-2 p-4 rounded-xl border border-[#EDE9FE] bg-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-semibold text-[#1E1035] flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                      <span>{progressStep}</span>
                    </span>
                    <span className="font-mono text-[#6D6582]">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#FAF9FE] border border-[#EDE9FE] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7C3AED] transition-all duration-200 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Successful Validation Details & Manifest */}
              {zipResult && (
                <div className="space-y-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-heading font-bold text-emerald-950">
                          Package Validated: {zipResult.zipFileName}
                        </div>
                        <div className="text-[11px] text-emerald-800">
                          {zipResult.filesCount} files • Entry: <code>{zipResult.entryHtmlPath}</code> • {(zipResult.totalSize / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Test Live Preview</span>
                    </button>
                  </div>

                  {/* File Manifest List */}
                  <div>
                    <div className="text-xs font-heading font-bold text-[#1E1035] mb-2 flex items-center justify-between">
                      <span>Archive File Manifest</span>
                      <span className="text-[11px] text-[#6D6582] font-normal font-sans">All assets verified clean</span>
                    </div>

                    <div className="max-h-40 overflow-y-auto divide-y divide-[#EDE9FE] border border-[#EDE9FE] rounded-xl bg-white text-xs">
                      {zipResult.fileManifest.map((item) => (
                        <div key={item.path} className="px-3 py-1.5 flex items-center justify-between font-mono text-[11px]">
                          <div className="flex items-center gap-2 truncate">
                            <FileCode className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                            <span className="text-[#1E1035] truncate">{item.path}</span>
                          </div>
                          <div className="text-[#6D6582] shrink-0 ml-3">
                            {(item.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEO & DISCOVERY */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-heading font-semibold text-[#1E1035]">
                    SEO Meta Title
                  </label>
                  <span className={`text-[11px] font-mono ${seoTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-[#6D6582]'}`}>
                    {seoTitle.length}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="e.g. Tip & Split Calculator – Free Online Gratuity Tool"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-heading font-semibold text-[#1E1035]">
                    SEO Meta Description
                  </label>
                  <span className={`text-[11px] font-mono ${seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-[#6D6582]'}`}>
                    {seoDescription.length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Primary meta description for search engines and social share previews."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="calculator, tip, bill split, dining math"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              {/* Google Search Result Preview */}
              <div className="mt-4 p-4 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE]">
                <div className="text-[11px] font-heading font-bold text-[#6D6582] uppercase tracking-wider mb-2">
                  Google Search Snippet Preview
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-[#6D6582] truncate">
                    https://onlinetools.app › tools › {slug || 'tool-slug'}
                  </div>
                  <div className="text-sm font-semibold text-[#7C3AED] hover:underline cursor-pointer truncate">
                    {seoTitle || 'Tool Name – Free Online Tool'}
                  </div>
                  <div className="text-xs text-[#6D6582] line-clamp-2">
                    {seoDescription || description || 'Tool description will appear here in Google search engine result pages.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SANDBOX TEST RUN PREVIEW */}
          {activeTab === 'preview' && zipResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-heading font-bold text-[#1E1035]">
                    Sandboxed Preview Session
                  </span>
                  <span className="text-[10px] text-[#6D6582]">
                    (Strictly isolated via <code>sandbox=&quot;allow-scripts allow-forms&quot;</code>)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#6D6582]">
                  /tools/{slug || 'preview'}
                </span>
              </div>

              <div className="border border-[#EDE9FE] rounded-xl overflow-hidden bg-white shadow-xs">
                <iframe
                  id="sandbox-modal-iframe-preview"
                  title="Tool Sandbox Preview"
                  srcDoc={zipResult.extractedHtml}
                  sandbox="allow-scripts allow-forms"
                  referrerPolicy="no-referrer"
                  className="w-full min-h-[460px] border-0 bg-white"
                />
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer Controls */}
        <div className="h-16 px-6 border-t border-[#EDE9FE] flex items-center justify-between shrink-0 bg-[#FAF9FE]">
          <div className="flex items-center gap-2 text-xs text-[#6D6582]">
            <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
            <span>Strict sandboxed environment</span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'info' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'preview') setActiveTab('seo');
                  else if (activeTab === 'seo') setActiveTab('zip');
                  else if (activeTab === 'zip') setActiveTab('info');
                }}
                className="px-3 py-1.5 rounded-lg border border-[#EDE9FE] hover:bg-[#F5F3FF] text-[#1E1035] text-xs font-heading font-medium transition-colors cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-heading font-semibold text-[#6D6582] hover:text-[#1E1035] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab !== 'seo' && activeTab !== 'preview' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'info') setActiveTab('zip');
                  else if (activeTab === 'zip') setActiveTab('seo');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#7C3AED] text-white rounded-lg text-xs font-heading font-bold hover:bg-[#6D28D9] transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Tool...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Save Changes' : 'Deploy Tool'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
