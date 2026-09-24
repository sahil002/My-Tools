import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  FileCode,
  Eye,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  ArrowRight,
} from 'lucide-react';
import { ToolCategory } from '../../types';
import {
  validateAndExtractZip,
  generateSampleToolZip,
  saveCustomTool,
  ZipValidationResult,
  ToolListItem,
} from '../../services/customToolsService';
import { DBToolRecord } from '../../services/toolStorageDB';

interface ToolUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSaved: () => void;
  initialTool?: ToolListItem | null;
}

const CATEGORIES: { id: ToolCategory; name: string }[] = [
  { id: 'calculators', name: 'Calculators' },
  { id: 'text-tools', name: 'Text Tools' },
  { id: 'converters', name: 'Converters' },
  { id: 'date-time', name: 'Date & Time' },
  { id: 'education', name: 'Education' },
  { id: 'developer-tools', name: 'Developer Tools' },
];

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
];

export function ToolUploadModal({
  isOpen,
  onClose,
  onToolSaved,
  initialTool,
}: ToolUploadModalProps) {
  const isEditing = Boolean(initialTool);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'info' | 'zip' | 'seo' | 'preview'>('info');

  // Form states
  const [name, setName] = useState(initialTool?.name || '');
  const [slug, setSlug] = useState(initialTool?.slug || '');
  const [category, setCategory] = useState<ToolCategory>(initialTool?.category || 'calculators');
  const [description, setDescription] = useState(initialTool?.description || '');
  const [longDescription, setLongDescription] = useState(initialTool?.longDescription || '');
  const [seoTitle, setSeoTitle] = useState(initialTool?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialTool?.seoDescription || '');
  const [iconName, setIconName] = useState(initialTool?.iconName || 'Calculator');
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

  // Auto-generate slug and SEO title if not manually touched
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleZipFile(e.dataTransfer.files[0]);
    }
  };

  const handleDemoZip = async (type: 'tip-calculator' | 'contrast-checker') => {
    try {
      setIsProcessingZip(true);
      setProgressPercent(15);
      setProgressStep('Generating isolated demo zip package...');
      const demoFile = await generateSampleToolZip(type);
      await handleZipFile(demoFile);

      if (!name) {
        if (type === 'tip-calculator') {
          setName('Tip & Bill Split Calculator');
          setSlug('tip-and-bill-split-calculator');
          setDescription('Compute tip amounts, split checks evenly, and calculate total dinner charges.');
          setSeoTitle('Tip & Bill Split Calculator – Free Restaurant Gratuity Tool');
          setSeoDescription('Instant tip calculator and bill splitter with customizable tip rates.');
          setIconName('Percent');
          setKeywords('tip calculator, bill split, gratuity, restaurant tip');
        } else {
          setName('Color Contrast Checker');
          setSlug('color-contrast-checker');
          setDescription('Validate color combinations against WCAG 2.1 AA and AAA accessibility contrast standards.');
          setSeoTitle('Color Contrast Ratio Checker – WCAG Accessibility Validator');
          setSeoDescription('Check foreground and background color contrast ratios for digital compliance.');
          setIconName('Sparkles');
          setKeywords('contrast checker, wcag contrast, accessibility, color ratio');
        }
      }
    } catch (err) {
      setErrorMsg(`Failed to generate demo zip: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessingZip(false);
    }
  };

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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="tool-upload-modal"
        className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl w-full max-w-3xl my-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150"
      >
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between shrink-0 bg-[#F8FAFC] dark:bg-[#131B2E]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {isEditing && initialTool ? `Edit Tool: ${initialTool.name}` : 'Deploy New Embedded Tool'}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Zip Upload & Sandboxed Auto-Embedding Engine
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-upload-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#0F172A] text-xs font-semibold overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-[#60A5FA]'
                : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
          >
            1. Basic Metadata
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('zip')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'zip'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-[#60A5FA]'
                : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <span>2. Zip Upload & Auto-Embed</span>
            {zipResult && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'seo'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-[#60A5FA]'
                : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
            }`}
          >
            3. SEO & Discovery
          </button>

          {zipResult && (
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'border-[#2563EB] text-[#2563EB] dark:text-[#60A5FA]'
                  : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>4. Sandbox Test Run</span>
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg text-xs bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-lg text-xs bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
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
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    Tool Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Tip & Split Calculator"
                    className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 text-xs bg-[#F1F5F9] dark:bg-[#1E293B] border border-r-0 border-[#CBD5E1] dark:border-[#334155] rounded-l-lg text-[#64748B] dark:text-[#94A3B8]">
                      /tools/
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="tip-and-split-calculator"
                      className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-r-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ToolCategory)}
                    className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="active">Active (Visible to public & directory)</option>
                    <option value="inactive">Inactive (Offline / Maintenance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Concise 1-2 sentence description for cards and search snippets."
                  className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  Long Description / Overview
                </label>
                <textarea
                  rows={4}
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Detailed breakdown of how the tool operates, principles, and guidelines."
                  className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    Select Icon
                  </label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {AVAILABLE_ICONS.map((ico) => (
                      <option key={ico} value={ico}>
                        {ico}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    Optional Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://.../preview.png"
                    className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ZIP UPLOAD & AUTO-EMBED */}
          {activeTab === 'zip' && (
            <div className="space-y-5">
              {/* Guidance Notice */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-[#0F172A] dark:text-[#F8FAFC]">
                <div className="flex items-center gap-2 font-bold text-[#1D4ED8] dark:text-[#60A5FA]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Isolated Sandboxed Auto-Embed Specifications</span>
                </div>
                <ul className="mt-1.5 space-y-1 text-[#475569] dark:text-[#94A3B8] text-[11px] list-disc list-inside">
                  <li>Archive must contain an entry <code>index.html</code> (at root or top folder).</li>
                  <li>Linked stylesheets (<code>.css</code>) and scripts (<code>.js</code>) are auto-resolved.</li>
                  <li>Server-side executables (e.g. <code>.php</code>, <code>.sh</code>, <code>.exe</code>) are strictly blocked.</li>
                  <li>Runs in a sandboxed iframe with strict permission controls. Max size: 25 MB.</li>
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
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-[#CBD5E1] dark:border-[#334155] hover:border-[#2563EB] bg-[#F8FAFC] dark:bg-[#1E293B]/40'
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

                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Drop tool .zip package here, or browse files
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Supports client-side HTML/CSS/JS bundles up to 25 MB
                </p>
              </div>

              {/* 1-Click Demo Buttons for Fast Testing */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                <div className="text-xs">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Need a test archive?</span>
                  <span className="text-[#64748B] dark:text-[#94A3B8] ml-1">Generate a working demo bundle in 1 click:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoZip('tip-calculator')}
                    disabled={isProcessingZip}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-md text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#2563EB] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Tip Calculator (.zip)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoZip('contrast-checker')}
                    disabled={isProcessingZip}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-md text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#2563EB] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Contrast Checker (.zip)
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              {isProcessingZip && (
                <div className="space-y-2 p-4 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#0F172A]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                      <span>{progressStep}</span>
                    </span>
                    <span className="font-mono text-[#64748B]">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#F1F5F9] dark:bg-[#1E293B] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] transition-all duration-200 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Successful Validation Details & Manifest */}
              {zipResult && (
                <div className="space-y-4 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-900/40 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          Package Validated: {zipResult.zipFileName}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          {zipResult.filesCount} files • Entry: <code>{zipResult.entryHtmlPath}</code> • {(zipResult.totalSize / 1024).toFixed(1)} KB uncompressed
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#2563EB] text-[#FFFFFF] rounded-md hover:bg-[#1D4ED8] transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Test Live Preview</span>
                    </button>
                  </div>

                  {/* File Manifest List */}
                  <div>
                    <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2 flex items-center justify-between">
                      <span>Archive File Manifest</span>
                      <span className="text-[11px] text-[#64748B] font-normal">All assets verified clean</span>
                    </div>

                    <div className="max-h-40 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#1E293B] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg bg-[#FFFFFF] dark:bg-[#0F172A] text-xs">
                      {zipResult.fileManifest.map((item) => (
                        <div key={item.path} className="px-3 py-1.5 flex items-center justify-between font-mono text-[11px]">
                          <div className="flex items-center gap-2 truncate">
                            <FileCode className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                            <span className="text-[#0F172A] dark:text-[#F8FAFC] truncate">{item.path}</span>
                          </div>
                          <div className="text-[#64748B] dark:text-[#94A3B8] shrink-0 ml-3">
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
                  <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    SEO Meta Title
                  </label>
                  <span className={`text-[11px] font-mono ${seoTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-[#64748B]'}`}>
                    {seoTitle.length}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="e.g. Tip & Split Calculator – Free Online Gratuity Tool"
                  className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    SEO Meta Description
                  </label>
                  <span className={`text-[11px] font-mono ${seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-[#64748B]'}`}>
                    {seoDescription.length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Primary meta description for search engines and social share previews."
                  className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="calculator, tip, bill split, dining math"
                  className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Google Search Result Preview */}
              <div className="mt-4 p-4 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E]">
                <div className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                  Google Search Snippet Preview
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                    https://onlinetools.app › tools › {slug || 'tool-slug'}
                  </div>
                  <div className="text-sm font-semibold text-[#1A0DAB] dark:text-[#8AB4F8] hover:underline cursor-pointer truncate">
                    {seoTitle || 'Tool Name – Free Online Tool'}
                  </div>
                  <div className="text-xs text-[#4D5156] dark:text-[#BDC1C6] line-clamp-2">
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
                  <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    Sandboxed Preview Session
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    (Strictly isolated via <code>sandbox="allow-scripts allow-forms"</code>)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#64748B]">
                  /tools/{slug || 'preview'}
                </span>
              </div>

              <div className="border border-[#CBD5E1] dark:border-[#334155] rounded-xl overflow-hidden bg-white shadow-xs">
                <iframe
                  id="sandbox-modal-iframe-preview"
                  title="Tool Sandbox Preview"
                  srcDoc={zipResult.extractedHtml}
                  sandbox="allow-scripts allow-forms"
                  referrerPolicy="no-referrer"
                  className="w-full h-96 border-0"
                />
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="h-16 px-6 border-t border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between shrink-0 bg-[#F8FAFC] dark:bg-[#131B2E]">
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
            {activeTab !== 'info' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'preview') setActiveTab('seo');
                  else if (activeTab === 'seo') setActiveTab('zip');
                  else if (activeTab === 'zip') setActiveTab('info');
                }}
                className="px-3 py-1.5 rounded-md hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-medium"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-[#FFFFFF] rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || (!isEditing && !zipResult)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#2563EB] text-[#FFFFFF] rounded-lg text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Deploying...' : isEditing ? 'Save Changes' : 'Deploy Tool'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
