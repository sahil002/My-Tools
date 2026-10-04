import React, { useState, useRef, useEffect } from 'react';
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
  Type,
  Baseline,
  Indent,
  Outdent,
  RemoveFormatting,
  Code,
  Wand2,
  Calculator,
  Grid,
  Columns,
  Rows,
  SlidersHorizontal,
  Copy,
  Lightbulb,
  BarChart3,
} from 'lucide-react';
import {
  ChartConfig,
  serializeChartToHtml,
} from '../common/InteractiveFinanceChart';
import { ChartStudioModal } from './ChartStudioModal';

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

  // Font Family and Font Size states
  const [selectedFont, setSelectedFont] = useState('');
  const [selectedFontSize, setSelectedFontSize] = useState('');

  // Active Formatting Auto-detection (auto fetches what's applied on click/selection)
  const [activeFormatting, setActiveFormatting] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikeThrough: boolean;
    ul: boolean;
    ol: boolean;
    align: 'left' | 'center' | 'right' | 'justify';
    blockFormat: string;
    fontFamily: string;
    fontSize: string;
    isLink: boolean;
    isTable: boolean;
    isChart: boolean;
    activeChartNode: HTMLElement | null;
    activeChartConfig: ChartConfig | null;
  }>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    ul: false,
    ol: false,
    align: 'left',
    blockFormat: 'p',
    fontFamily: '',
    fontSize: '',
    isLink: false,
    isTable: false,
    isChart: false,
    activeChartNode: null,
    activeChartConfig: null,
  });

  // Chart Studio Modal State
  const [showChartModal, setShowChartModal] = useState(false);
  const [editingChartConfig, setEditingChartConfig] = useState<ChartConfig | null>(null);
  const [targetChartElement, setTargetChartElement] = useState<HTMLElement | null>(null);

  // Professional Table Studio & Builder states
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableTab, setTableTab] = useState<'presets' | 'custom'>('presets');
  const [customTableRows, setCustomTableRows] = useState(3);
  const [customTableCols, setCustomTableCols] = useState(3);
  const [customTableHeader, setCustomTableHeader] = useState(true);
  const [customTableStyle, setCustomTableStyle] = useState<'formula' | 'standard' | 'striped'>('formula');

  // Callout Box Dropdown
  const [showCalloutDropdown, setShowCalloutDropdown] = useState(false);

  // Auto-format status message
  const [formatStatus, setFormatStatus] = useState<string | null>(null);

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

  // Auto-detect currently applied formats at cursor / selection
  const updateActiveFormattingState = () => {
    if (editorMode !== 'visual' || !visualEditorRef.current) return;
    try {
      const isBold = document.queryCommandState('bold');
      const isItalic = document.queryCommandState('italic');
      const isUnderline = document.queryCommandState('underline');
      const isStrike = document.queryCommandState('strikeThrough');
      const isUl = document.queryCommandState('insertUnorderedList');
      const isOl = document.queryCommandState('insertOrderedList');

      let align: 'left' | 'center' | 'right' | 'justify' = 'left';
      if (document.queryCommandState('justifyCenter')) align = 'center';
      else if (document.queryCommandState('justifyRight')) align = 'right';
      else if (document.queryCommandState('justifyFull')) align = 'justify';

      let blockFormat = 'p';
      let fontName = '';
      let fontSizeVal = '';
      let isLink = false;
      let isTable = false;
      let isChart = false;
      let chartNode: HTMLElement | null = null;
      let chartConfig: ChartConfig | null = null;

      const sel = window.getSelection();
      if (sel && sel.anchorNode && visualEditorRef.current.contains(sel.anchorNode)) {
        let node: Node | null = sel.anchorNode;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

        if (node && node instanceof HTMLElement) {
          const headingEl = node.closest('h1, h2, h3, h4, blockquote, pre, p');
          if (headingEl) {
            blockFormat = headingEl.tagName.toLowerCase();
          }

          const computed = window.getComputedStyle(node);
          if (computed.fontFamily) fontName = computed.fontFamily;
          if (computed.fontSize) fontSizeVal = computed.fontSize;

          if (node.closest('a')) isLink = true;
          if (node.closest('table')) isTable = true;

          const chartEl = node.closest('.interactive-chart-block') as HTMLElement | null;
          if (chartEl) {
            isChart = true;
            chartNode = chartEl;
            const rawCfg = chartEl.getAttribute('data-chart-config');
            if (rawCfg) {
              try {
                chartConfig = JSON.parse(decodeURIComponent(rawCfg));
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
      }

      setActiveFormatting({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strikeThrough: isStrike,
        ul: isUl,
        ol: isOl,
        align,
        blockFormat,
        fontFamily: fontName,
        fontSize: fontSizeVal,
        isLink,
        isTable,
        isChart,
        activeChartNode: chartNode,
        activeChartConfig: chartConfig,
      });
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    const handleSelChange = () => {
      updateActiveFormattingState();
    };
    document.addEventListener('selectionchange', handleSelChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelChange);
    };
  }, [editorMode]);

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
    setTimeout(updateActiveFormattingState, 50);
  };

  // Save or Update interactive chart in post
  const handleSaveChart = (config: ChartConfig) => {
    if (targetChartElement && targetChartElement.parentNode) {
      const newChartHtml = serializeChartToHtml(config);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newChartHtml;
      const newElement = tempDiv.firstElementChild;
      if (newElement) {
        targetChartElement.parentNode.replaceChild(newElement, targetChartElement);
      }
      setTargetChartElement(null);
      setEditingChartConfig(null);
    } else {
      const chartHtml = serializeChartToHtml(config);
      execCmd('insertHTML', chartHtml);
    }
    handleVisualInput();
    setShowChartModal(false);
  };

  // Apply custom Font Family reliably
  const applyFontFamily = (family: string) => {
    if (!family) return;
    visualEditorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontFamily = family;
      span.appendChild(range.extractContents());
      range.insertNode(span);
      handleVisualInput();
    } else {
      execCmd('fontName', family);
    }
  };

  // Apply custom Font Size reliably
  const applyFontSize = (sizePx: string) => {
    if (!sizePx) return;
    visualEditorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = sizePx;
      span.appendChild(range.extractContents());
      range.insertNode(span);
      handleVisualInput();
    }
  };

  // Intelligent parser: converts pasted unformatted text / markdown into a structured rich blog post
  const parseTextToRichBlogHtml = (rawText: string): string => {
    // If it's already well-structured HTML, return as-is
    if (/<(h[1-6]|p|div|ul|ol|table|blockquote)[^>]*>/i.test(rawText)) {
      return rawText;
    }

    const lines = rawText.split(/\r?\n/);
    let html = '';
    let inUl = false;
    let inOl = false;
    let inTable = false;
    let tableHeaderParsed = false;
    let currentParagraph = '';

    const flushParagraph = () => {
      if (currentParagraph.trim()) {
        html += `<p class="mb-4 text-[#372E4C] leading-relaxed">${currentParagraph.trim()}</p>`;
        currentParagraph = '';
      }
    };

    const closeLists = () => {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
    };

    const closeTable = () => {
      if (inTable) {
        html += '</tbody></table></div>';
        inTable = false;
        tableHeaderParsed = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Markdown Table (| Col 1 | Col 2 |)
      if (line.startsWith('|') && line.endsWith('|')) {
        flushParagraph();
        closeLists();

        if (/^\|[\s\-:|]+\|$/.test(line)) {
          tableHeaderParsed = true;
          continue;
        }

        const cells = line.slice(1, -1).split('|').map((c) => c.trim());

        if (!inTable) {
          inTable = true;
          tableHeaderParsed = false;
          html += '<div class="overflow-x-auto my-6"><table class="formula-table"><thead><tr>';
          cells.forEach((cell) => {
            html += `<th>${cell}</th>`;
          });
          html += '</tr></thead><tbody>';
        } else {
          html += '<tr>';
          cells.forEach((cell) => {
            const isFormula = /[=+\-×÷*/^%]/.test(cell) && (cell.includes('=') || cell.length < 35);
            html += `<td class="${isFormula ? 'formula-cell' : ''}">${cell}</td>`;
          });
          html += '</tr>';
        }
        continue;
      } else {
        closeTable();
      }

      if (!line) {
        flushParagraph();
        closeLists();
        continue;
      }

      // Headings
      if (/^#\s+/.test(line)) {
        flushParagraph();
        closeLists();
        html += `<h1>${line.replace(/^#\s+/, '')}</h1>`;
        continue;
      }
      if (/^##\s+/.test(line)) {
        flushParagraph();
        closeLists();
        html += `<h2>${line.replace(/^##\s+/, '')}</h2>`;
        continue;
      }
      if (/^###\s+/.test(line)) {
        flushParagraph();
        closeLists();
        html += `<h3>${line.replace(/^###\s+/, '')}</h3>`;
        continue;
      }
      if (/^####\s+/.test(line)) {
        flushParagraph();
        closeLists();
        html += `<h4>${line.replace(/^####\s+/, '')}</h4>`;
        continue;
      }

      // Blockquotes
      if (/^>\s+/.test(line)) {
        flushParagraph();
        closeLists();
        html += `<blockquote>${line.replace(/^>\s+/, '')}</blockquote>`;
        continue;
      }

      // Bullet lists (- or * or •)
      if (/^[-*•]\s+/.test(line)) {
        flushParagraph();
        if (inOl) closeLists();
        if (!inUl) {
          html += '<ul class="list-disc pl-6 mb-4 space-y-1.5 text-[#372E4C]">';
          inUl = true;
        }
        const itemText = line
          .replace(/^[-*•]\s+/, '')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += `<li>${itemText}</li>`;
        continue;
      }

      // Numbered lists (1. or 2.)
      if (/^\d+\.\s+/.test(line)) {
        flushParagraph();
        if (inUl) closeLists();
        if (!inOl) {
          html += '<ol class="list-decimal pl-6 mb-4 space-y-1.5 text-[#372E4C]">';
          inOl = true;
        }
        const itemText = line
          .replace(/^\d+\.\s+/, '')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += `<li>${itemText}</li>`;
        continue;
      }

      // Formula Line detection
      if (/^(Formula|Equation|Rule):\s*/i.test(line)) {
        flushParagraph();
        closeLists();
        const formulaText = line.replace(/^(Formula|Equation|Rule):\s*/i, '');
        html += `
          <div class="callout-box callout-formula my-4">
            <div class="text-xs font-bold text-[#7C3AED] uppercase tracking-wider mb-1">Calculation Formula</div>
            <div class="font-mono text-base font-bold text-[#1E1035]">${formulaText}</div>
          </div>
        `;
        continue;
      }

      closeLists();
      const formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

      if (currentParagraph) {
        currentParagraph += ' ' + formattedLine;
      } else {
        currentParagraph = formattedLine;
      }
    }

    flushParagraph();
    closeLists();
    closeTable();

    return html;
  };

  // Smart Paste Handler
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    if (htmlData && htmlData.includes('<') && (htmlData.includes('<p>') || htmlData.includes('<h') || htmlData.includes('<table>') || htmlData.includes('<ul>') || htmlData.includes('<ol>'))) {
      const cleaned = htmlData
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<o:p>[\s\S]*?<\/o:p>/g, '')
        .replace(/class="Mso[a-zA-Z0-9]+"/g, '');
      execCmd('insertHTML', cleaned);
    } else if (textData) {
      const richHtml = parseTextToRichBlogHtml(textData);
      execCmd('insertHTML', richHtml);
    }
  };

  // One-click Auto-Format Current Editor Content as Blog
  const handleAutoFormatEntirePost = () => {
    if (!visualEditorRef.current) return;
    const raw = visualEditorRef.current.innerText || contentHtml;
    const formatted = parseTextToRichBlogHtml(raw);
    setContentHtml(formatted);
    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = formatted;
    }
    setFormatStatus('Successfully auto-formatted into a structured blog article!');
    setTimeout(() => setFormatStatus(null), 3500);
  };

  // Table Presets Insertion
  const handleInsertPresetTable = (type: 'formula' | 'stepbystep' | 'comparison' | 'financial' | 'cheatsheet') => {
    let tableHtml = '';

    if (type === 'formula') {
      tableHtml = `
        <div class="overflow-x-auto my-6">
          <table class="formula-table">
            <thead>
              <tr>
                <th>Parameter / Variable</th>
                <th>Mathematical Formula</th>
                <th>Standard Unit</th>
                <th>Example Calculation</th>
                <th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">Base Value (A)</td>
                <td class="formula-cell">A = B × (1 + r)^t</td>
                <td>Percentage / Currency</td>
                <td>100 × (1 + 0.05)^3 = 115.76</td>
                <td>Compound growth over 3 periods</td>
              </tr>
              <tr>
                <td class="font-bold">Ratio / Fraction (R)</td>
                <td class="formula-cell">R = (Part / Total) × 100</td>
                <td>% (Percent)</td>
                <td>(25 / 200) × 100 = 12.5%</td>
                <td>Proportional share of total whole</td>
              </tr>
              <tr>
                <td class="font-bold">Rate of Change (Δ)</td>
                <td class="formula-cell">Δ% = ((New - Old) / Old) × 100</td>
                <td>% Difference</td>
                <td>((150 - 100) / 100) × 100 = +50%</td>
                <td>Net percentage growth or decline</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (type === 'stepbystep') {
      tableHtml = `
        <div class="overflow-x-auto my-6">
          <table class="formula-table">
            <thead>
              <tr>
                <th style="width: 80px;">Step #</th>
                <th>Operational Stage</th>
                <th>Input Variables</th>
                <th>Formula Applied</th>
                <th>Calculated Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold text-center">01</td>
                <td>Identify Known Values</td>
                <td>Principal = $10,000, Rate = 5%</td>
                <td class="formula-cell">P = 10000, r = 0.05</td>
                <td>Baseline initialized</td>
              </tr>
              <tr>
                <td class="font-bold text-center">02</td>
                <td>Compute Periodic Factor</td>
                <td>Compounding frequency n = 4</td>
                <td class="formula-cell">i = r / n = 0.05 / 4</td>
                <td>0.0125 per quarter</td>
              </tr>
              <tr>
                <td class="font-bold text-center">03</td>
                <td>Calculate Yield Result</td>
                <td>Horizon t = 5 years</td>
                <td class="formula-cell">A = P × (1 + i)^(n×t)</td>
                <td class="font-bold text-[#7C3AED]">$12,820.37</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (type === 'comparison') {
      tableHtml = `
        <div class="overflow-x-auto my-6">
          <table>
            <thead>
              <tr>
                <th>Evaluation Criteria</th>
                <th>Standard Method (Manual)</th>
                <th>PRBSolver Calculator</th>
                <th>Key Advantage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">Computation Speed</td>
                <td>3 - 5 minutes</td>
                <td class="font-bold text-emerald-600">Instant (&lt; 0.1s)</td>
                <td>Zero manual arithmetic errors</td>
              </tr>
              <tr>
                <td class="font-bold">Formula Transparency</td>
                <td>Requires textbook reference</td>
                <td class="font-bold text-[#7C3AED]">Full LaTeX proof shown</td>
                <td>Educational understanding</td>
              </tr>
              <tr>
                <td class="font-bold">Edge Case Handling</td>
                <td>Prone to decimal slips</td>
                <td class="font-bold text-emerald-600">Automated unit validation</td>
                <td>Bank-grade numerical precision</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (type === 'financial') {
      tableHtml = `
        <div class="overflow-x-auto my-6">
          <table class="formula-table">
            <thead>
              <tr>
                <th>Year / Period</th>
                <th>Starting Balance</th>
                <th>Interest Rate (APY)</th>
                <th>Interest Earned</th>
                <th>Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">Year 1</td>
                <td>$5,000.00</td>
                <td class="formula-cell">7.00%</td>
                <td>+$350.00</td>
                <td class="font-bold">$5,350.00</td>
              </tr>
              <tr>
                <td class="font-bold">Year 2</td>
                <td>$5,350.00</td>
                <td class="formula-cell">7.00%</td>
                <td>+$374.50</td>
                <td class="font-bold">$5,724.50</td>
              </tr>
              <tr>
                <td class="font-bold">Year 3</td>
                <td>$5,724.50</td>
                <td class="formula-cell">7.00%</td>
                <td>+$400.72</td>
                <td class="font-bold text-[#7C3AED]">$6,125.22</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else {
      tableHtml = `
        <div class="overflow-x-auto my-6">
          <table class="formula-table">
            <thead>
              <tr>
                <th>Rule / Theorem</th>
                <th>Equation / Formula</th>
                <th>Application Condition</th>
                <th>Quick Memory Trick</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">Percentage of Total</td>
                <td class="formula-cell">P = (X / Y) × 100</td>
                <td>Comparing part to whole</td>
                <td>Move decimal left 2 spots for 1%</td>
              </tr>
              <tr>
                <td class="font-bold">Rule of 72</td>
                <td class="formula-cell">Years ≈ 72 / Rate</td>
                <td>Fixed annual compounding</td>
                <td>Quick estimate of doubling time</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    execCmd('insertHTML', tableHtml);
    setShowTableModal(false);
  };

  // Custom Table Grid Generation
  const handleInsertCustomTable = () => {
    const rows = Math.max(1, Math.min(15, customTableRows));
    const cols = Math.max(1, Math.min(10, customTableCols));
    const tableClass = customTableStyle === 'formula' ? 'formula-table' : '';

    let tableHtml = `<div class="overflow-x-auto my-6"><table class="${tableClass}">`;
    if (customTableHeader) {
      tableHtml += '<thead><tr>';
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<th>Column Header ${c}</th>`;
      }
      tableHtml += '</tr></thead>';
    }

    tableHtml += '<tbody>';
    for (let r = 1; r <= rows; r++) {
      tableHtml += '<tr>';
      for (let c = 1; c <= cols; c++) {
        const isFormulaCell = customTableStyle === 'formula' && c === 2;
        tableHtml += `<td class="${isFormulaCell ? 'formula-cell' : ''}">Row ${r}, Col ${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div>';

    execCmd('insertHTML', tableHtml);
    setShowTableModal(false);
  };

  // In-Editor Table Actions (Add/Remove Row/Col/Table)
  const handleTableAction = (action: 'addRowAbove' | 'addRowBelow' | 'addColLeft' | 'addColRight' | 'deleteRow' | 'deleteCol' | 'deleteTable') => {
    if (editorMode !== 'visual') return;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) {
      alert('Please place your cursor inside a table cell to use table actions.');
      return;
    }

    let node: Node | null = sel.anchorNode;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

    const cell = (node as HTMLElement)?.closest?.('td, th') as HTMLTableCellElement | null;
    const row = (node as HTMLElement)?.closest?.('tr') as HTMLTableRowElement | null;
    const table = (node as HTMLElement)?.closest?.('table') as HTMLTableElement | null;

    if (!table) {
      alert('Please place your cursor inside a table cell to use table tools.');
      return;
    }

    if (action === 'deleteTable') {
      const container = table.closest('.overflow-x-auto') || table;
      container.remove();
      handleVisualInput();
      return;
    }

    if (!row) return;

    if (action === 'addRowAbove' || action === 'addRowBelow') {
      const colCount = row.cells.length;
      const newRow = document.createElement('tr');
      for (let i = 0; i < colCount; i++) {
        const newCell = document.createElement('td');
        newCell.className = 'p-3 border border-[#EDE9FE]';
        newCell.innerHTML = 'Data';
        newRow.appendChild(newCell);
      }
      if (action === 'addRowAbove') {
        row.parentNode?.insertBefore(newRow, row);
      } else {
        row.parentNode?.insertBefore(newRow, row.nextSibling);
      }
    } else if (action === 'deleteRow') {
      row.remove();
    } else if (action === 'addColLeft' || action === 'addColRight') {
      const colIndex = cell ? cell.cellIndex : 0;
      const targetIndex = action === 'addColLeft' ? colIndex : colIndex + 1;

      Array.from(table.rows).forEach((r) => {
        const isHeader = r.parentElement?.tagName === 'THEAD' || r.rowIndex === 0;
        const newCell = document.createElement(isHeader ? 'th' : 'td');
        newCell.className = isHeader ? 'p-3 border border-[#DDD6FE] font-bold' : 'p-3 border border-[#EDE9FE]';
        newCell.innerHTML = isHeader ? 'Header' : 'Cell';
        if (targetIndex >= r.cells.length) {
          r.appendChild(newCell);
        } else {
          r.insertBefore(newCell, r.cells[targetIndex]);
        }
      });
    } else if (action === 'deleteCol') {
      if (!cell) return;
      const colIndex = cell.cellIndex;
      Array.from(table.rows).forEach((r) => {
        if (r.cells[colIndex]) {
          r.cells[colIndex].remove();
        }
      });
    }

    handleVisualInput();
  };

  // Insert Callout Box
  const handleInsertCallout = (type: 'formula' | 'tip' | 'warning' | 'note') => {
    let calloutHtml = '';
    if (type === 'formula') {
      calloutHtml = `
        <div class="callout-box callout-formula my-4">
          <div class="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] uppercase tracking-wider mb-1">
            <span>⚡ Essential Formula</span>
          </div>
          <div class="font-mono text-base font-bold text-[#1E1035]">Formula = (Variable A × Variable B) / Divisor</div>
          <p class="text-xs text-[#6D6582] mt-1 mb-0">Replace Variable A and B with your exact problem values.</p>
        </div>
      `;
    } else if (type === 'tip') {
      calloutHtml = `
        <div class="callout-box callout-tip my-4">
          <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <span>💡 Quick Pro Tip</span>
          </div>
          <p class="text-sm text-[#1E1035] mb-0 font-medium">To mental-math 15%, find 10% by shifting the decimal once left, then add half of that value.</p>
        </div>
      `;
    } else if (type === 'warning') {
      calloutHtml = `
        <div class="callout-box callout-warning my-4">
          <div class="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            <span>⚠️ Common Trap to Avoid</span>
          </div>
          <p class="text-sm text-[#1E1035] mb-0">Do not sum percentages sequentially without accounting for compounding base changes.</p>
        </div>
      `;
    } else {
      calloutHtml = `
        <div class="callout-box callout-note my-4">
          <div class="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <span>📌 Editorial Note</span>
          </div>
          <p class="text-sm text-[#1E1035] mb-0">All mathematical formulas in this article comply with standard ANSI &amp; ISO financial notations.</p>
        </div>
      `;
    }

    execCmd('insertHTML', calloutHtml);
    setShowCalloutDropdown(false);
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

  // Open Table Studio Modal
  const handleInsertTable = () => {
    setShowTableModal(true);
  };

  // Import / Upload Draft file (.txt, .md, .html)
  const handleDraftFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
                    accept=".txt,.md,.markdown,.html"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => draftFileRef.current?.click()}
                    className="px-3 py-1 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] rounded-xl text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Upload markdown or text file into WordPress editor"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Import Draft (.txt, .md, .html)</span>
                  </button>
                </div>
              </div>

              {/* WordPress Classic Ribbon / Toolbar (active in Visual mode) */}
              {editorMode === 'visual' && (
                <div className="border-b border-[#EDE9FE] bg-[#FAF9FE]">
                  {/* Primary Ribbon Row */}
                  <div className="p-2 flex flex-wrap items-center gap-1.5 text-xs">
                    {/* 1. Font Family Selector */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDD6FE] rounded-lg px-1.5 py-0.5 shadow-2xs">
                      <Type className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <select
                        value={selectedFont}
                        onChange={(e) => {
                          setSelectedFont(e.target.value);
                          applyFontFamily(e.target.value);
                        }}
                        className="bg-transparent text-xs font-semibold text-[#1E1035] outline-none cursor-pointer hover:text-[#7C3AED]"
                      >
                        <option value="">Font Family</option>
                        <option value="'Inter', sans-serif">Inter (Default Clean)</option>
                        <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Editorial)</option>
                        <option value="'Merriweather', serif">Merriweather (Classic Serif)</option>
                        <option value="'Georgia', serif">Georgia (Book Style)</option>
                        <option value="'Roboto', sans-serif">Roboto (Clean Tech)</option>
                        <option value="'Poppins', sans-serif">Poppins (Geometric)</option>
                        <option value="'JetBrains Mono', monospace">JetBrains Mono (Math/Code)</option>
                      </select>
                    </div>

                    {/* 2. Font Size Selector */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDD6FE] rounded-lg px-1.5 py-0.5 shadow-2xs">
                      <Baseline className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <select
                        value={selectedFontSize}
                        onChange={(e) => {
                          setSelectedFontSize(e.target.value);
                          applyFontSize(e.target.value);
                        }}
                        className="bg-transparent text-xs font-semibold text-[#1E1035] outline-none cursor-pointer hover:text-[#7C3AED]"
                      >
                        <option value="">Font Size</option>
                        <option value="12px">12px (Small Note)</option>
                        <option value="14px">14px (Compact)</option>
                        <option value="16px">16px (Normal Body)</option>
                        <option value="18px">18px (Medium / Lead)</option>
                        <option value="20px">20px (Heading 4)</option>
                        <option value="24px">24px (Heading 3)</option>
                        <option value="30px">30px (Heading 2)</option>
                        <option value="36px">36px (Title / H1)</option>
                      </select>
                    </div>

                    {/* 3. Format / Headings Selector (Syncs automatically with active heading) */}
                    <select
                      value={['h1', 'h2', 'h3', 'h4', 'blockquote', 'pre'].includes(activeFormatting.blockFormat) ? `<${activeFormatting.blockFormat}>` : '<p>'}
                      onChange={(e) => {
                        if (e.target.value) {
                          execCmd('formatBlock', e.target.value);
                        }
                      }}
                      className="px-2 py-1 bg-white border border-[#DDD6FE] rounded-lg text-xs font-semibold text-[#1E1035] outline-none cursor-pointer hover:border-[#7C3AED] shadow-2xs"
                    >
                      <option value="<p>">Normal Paragraph</option>
                      <option value="<h1>">Heading 1 (H1)</option>
                      <option value="<h2>">Heading 2 (H2)</option>
                      <option value="<h3>">Heading 3 (H3)</option>
                      <option value="<h4>">Heading 4 (H4)</option>
                      <option value="<blockquote>">Blockquote</option>
                      <option value="<pre>">Code Block</option>
                    </select>

                    <div className="h-5 w-px bg-[#DDD6FE] mx-0.5" />

                    {/* Basic Formatting Buttons with Active Highlighting */}
                    <button
                      type="button"
                      onClick={() => execCmd('bold')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.bold
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('italic')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.italic
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('underline')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.underline
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Underline (Ctrl+U)"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('strikeThrough')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.strikeThrough
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Strikethrough"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('removeFormat')}
                      className="p-1.5 hover:bg-white hover:text-rose-600 rounded-lg text-[#4B3E65] cursor-pointer transition-colors"
                      title="Clear Formatting"
                    >
                      <RemoveFormatting className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-[#DDD6FE] mx-0.5" />

                    {/* Alignment */}
                    <button
                      type="button"
                      onClick={() => execCmd('justifyLeft')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.align === 'left'
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('justifyCenter')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.align === 'center'
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('justifyRight')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.align === 'right'
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Align Right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('justifyFull')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.align === 'justify'
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Justify"
                    >
                      <AlignJustify className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-[#DDD6FE] mx-0.5" />

                    {/* Lists & Indentation */}
                    <button
                      type="button"
                      onClick={() => execCmd('insertUnorderedList')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.ul
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Bullet List (Unordered)"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('insertOrderedList')}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.ol
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Numbered List (Ordered)"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('indent')}
                      className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                      title="Increase Indent"
                    >
                      <Indent className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('outdent')}
                      className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                      title="Decrease Indent"
                    >
                      <Outdent className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-[#DDD6FE] mx-0.5" />

                    {/* Colors: Text & Background Highlight */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowColorPicker(!showColorPicker);
                          setShowHighlightPicker(false);
                          setShowCalloutDropdown(false);
                        }}
                        className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer flex items-center gap-0.5"
                        title="Text Color"
                      >
                        <Palette className="w-4 h-4" />
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                      {showColorPicker && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-[#DDD6FE] rounded-xl shadow-xl z-30 flex gap-1.5 flex-wrap w-48">
                          {['#1E1035', '#7C3AED', '#2563EB', '#059669', '#DC2626', '#D97706', '#6D6582'].map((color) => (
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
                          setShowCalloutDropdown(false);
                        }}
                        className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer flex items-center gap-0.5"
                        title="Highlight Background Color"
                      >
                        <Highlighter className="w-4 h-4" />
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                      {showHighlightPicker && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-[#DDD6FE] rounded-xl shadow-xl z-30 flex gap-1.5 flex-wrap w-48">
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

                    <div className="h-5 w-px bg-[#DDD6FE] mx-0.5" />

                    {/* Media, Link & Elements */}
                    <button
                      type="button"
                      onClick={() => setShowImageModal(true)}
                      className="p-1.5 hover:bg-[#F5F3FF] hover:text-[#7C3AED] rounded-lg text-[#7C3AED] font-semibold cursor-pointer flex items-center gap-1"
                      title="Insert Image / Media"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Media</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLinkModal(true)}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        activeFormatting.isLink
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-bold border border-[#DDD6FE] shadow-2xs'
                          : 'text-[#4B3E65] hover:bg-white hover:text-[#7C3AED]'
                      }`}
                      title="Insert Link (Ctrl+K)"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>

                    {/* PROFESSIONAL TABLE STUDIO BUTTON */}
                    <button
                      type="button"
                      onClick={() => setShowTableModal(true)}
                      className={`px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-all ${
                        activeFormatting.isTable
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-extrabold border border-[#C4B5FD] shadow-2xs ring-1 ring-[#7C3AED]'
                          : 'bg-white hover:bg-[#FAF5FF] border border-[#DDD6FE] hover:border-[#7C3AED] text-[#7C3AED] font-bold shadow-2xs'
                      }`}
                      title="Open Table Studio (Formula Tables, Comparisons, Step Guides)"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Table Studio</span>
                    </button>

                    {/* FINANCIAL & CALCULATION CHART STUDIO BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormatting.isChart && activeFormatting.activeChartConfig) {
                          setEditingChartConfig(activeFormatting.activeChartConfig);
                          setTargetChartElement(activeFormatting.activeChartNode);
                        } else {
                          setEditingChartConfig(null);
                          setTargetChartElement(null);
                        }
                        setShowChartModal(true);
                      }}
                      className={`px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-all ${
                        activeFormatting.isChart
                          ? 'bg-[#EDE9FE] text-[#7C3AED] font-extrabold border border-[#C4B5FD] shadow-2xs ring-1 ring-[#7C3AED]'
                          : 'bg-white hover:bg-[#FAF5FF] border border-[#DDD6FE] hover:border-[#7C3AED] text-[#7C3AED] font-bold shadow-2xs'
                      }`}
                      title="Open Excel-Grade Chart Studio (Bar Charts, Donut Allocation, Growth Trends, Dual Comparison)"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{activeFormatting.isChart ? '✏️ Edit Chart' : 'Chart Studio'}</span>
                    </button>

                    {/* CALLOUT BOXES DROPDOWN */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCalloutDropdown(!showCalloutDropdown);
                          setShowColorPicker(false);
                          setShowHighlightPicker(false);
                        }}
                        className="px-2 py-1 bg-white hover:bg-[#FAF5FF] border border-[#DDD6FE] text-[#1E1035] font-semibold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Insert Formula Box or Callout Box"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>Callout</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>

                      {showCalloutDropdown && (
                        <div className="absolute top-full left-0 mt-1 p-1.5 bg-white border border-[#DDD6FE] rounded-xl shadow-xl z-30 w-52 space-y-1">
                          <button
                            type="button"
                            onClick={() => handleInsertCallout('formula')}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-[#FAF5FF] text-[#7C3AED] rounded-lg font-bold flex items-center gap-2 cursor-pointer"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Formula Highlight Box</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertCallout('tip')}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg font-bold flex items-center gap-2 cursor-pointer"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Pro Tip / Shortcut Box</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertCallout('warning')}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-amber-50 text-amber-800 rounded-lg font-bold flex items-center gap-2 cursor-pointer"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Common Mistake Box</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertCallout('note')}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 text-blue-700 rounded-lg font-bold flex items-center gap-2 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Editorial Note Box</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => execCmd('insertHorizontalRule')}
                      className="p-1.5 hover:bg-white hover:text-[#7C3AED] rounded-lg text-[#4B3E65] cursor-pointer"
                      title="Horizontal Divider"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-[#DDD6FE] mx-0.5" />

                    {/* MAGIC WAND: AUTO-FORMAT AS BLOG POST */}
                    <button
                      type="button"
                      onClick={handleAutoFormatEntirePost}
                      className="px-2.5 py-1 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                      title="Instantly convert pasted plain text into a structured, beautiful blog post!"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Auto-Format as Blog</span>
                    </button>

                    <div className="h-5 w-px bg-[#DDD6FE] mx-0.5" />

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

                  {/* Secondary Table Quick-Action Bar */}
                  <div className="px-3 py-1.5 bg-[#F5F3FF] border-t border-[#DDD6FE] flex items-center justify-between gap-2 text-[11px] text-[#6D6582] overflow-x-auto">
                    <div className="flex items-center gap-1 shrink-0 font-medium">
                      <TableIcon className="w-3 h-3 text-[#7C3AED]" />
                      <span className="font-heading font-bold text-[#1E1035]">Table Tools:</span>
                      <span className="hidden sm:inline text-[#9D95B3]">(click inside any table to modify):</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTableAction('addRowAbove')}
                        className="px-2 py-0.5 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] rounded text-[#1E1035] hover:text-[#7C3AED] font-semibold cursor-pointer"
                        title="Add row above cursor"
                      >
                        + Row Above
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTableAction('addRowBelow')}
                        className="px-2 py-0.5 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] rounded text-[#1E1035] hover:text-[#7C3AED] font-semibold cursor-pointer"
                        title="Add row below cursor"
                      >
                        + Row Below
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTableAction('addColLeft')}
                        className="px-2 py-0.5 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] rounded text-[#1E1035] hover:text-[#7C3AED] font-semibold cursor-pointer"
                        title="Add column left of cursor"
                      >
                        + Col Left
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTableAction('addColRight')}
                        className="px-2 py-0.5 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] rounded text-[#1E1035] hover:text-[#7C3AED] font-semibold cursor-pointer"
                        title="Add column right of cursor"
                      >
                        + Col Right
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTableAction('deleteRow')}
                        className="px-2 py-0.5 bg-white hover:bg-rose-50 border border-[#DDD6FE] hover:border-rose-200 rounded text-rose-600 font-semibold cursor-pointer"
                        title="Delete current row"
                      >
                        - Row
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTableAction('deleteCol')}
                        className="px-2 py-0.5 bg-white hover:bg-rose-50 border border-[#DDD6FE] hover:border-rose-200 rounded text-rose-600 font-semibold cursor-pointer"
                        title="Delete current column"
                      >
                        - Col
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTableAction('deleteTable')}
                        className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-rose-700 font-bold cursor-pointer"
                        title="Delete entire table"
                      >
                        ✕ Delete Table
                      </button>
                    </div>
                  </div>

                  {/* Real-Time Live Inspector Banner: Auto-detects and displays what is applied at cursor */}
                  <div className="px-3 py-1.5 bg-white border-t border-[#EDE9FE] flex items-center justify-between text-[11px] text-[#6D6582] flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-[#1E1035] uppercase tracking-wider text-[10px]">
                        Active At Cursor:
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10.5px] font-bold bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE]">
                        {activeFormatting.blockFormat === 'p' ? 'Paragraph' : activeFormatting.blockFormat.toUpperCase()}
                      </span>
                      {activeFormatting.bold && (
                        <span className="px-1.5 py-0.5 rounded font-bold bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">Bold</span>
                      )}
                      {activeFormatting.italic && (
                        <span className="px-1.5 py-0.5 rounded italic bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">Italic</span>
                      )}
                      {activeFormatting.underline && (
                        <span className="px-1.5 py-0.5 rounded underline bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">Underline</span>
                      )}
                      {activeFormatting.strikeThrough && (
                        <span className="px-1.5 py-0.5 rounded line-through bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">Strikethrough</span>
                      )}
                      {activeFormatting.ul && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-semibold">Bullets List</span>
                      )}
                      {activeFormatting.ol && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-semibold">Numbered List</span>
                      )}
                      {activeFormatting.align !== 'left' && (
                        <span className="px-1.5 py-0.5 rounded bg-[#FAF9FE] text-[#6D6582] border border-[#DDD6FE] font-mono capitalize">
                          {activeFormatting.align}
                        </span>
                      )}
                      {activeFormatting.isLink && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">🔗 Link</span>
                      )}
                      {activeFormatting.isTable && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">📊 Table Cell</span>
                      )}
                      {activeFormatting.isChart && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">📈 Chart Block</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] text-[#9D95B3]">
                      <span>Auto-sync enabled</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Banner when auto-format succeeds */}
              {formatStatus && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{formatStatus}</span>
                  </div>
                  <button type="button" onClick={() => setFormatStatus(null)} className="text-emerald-700 hover:text-emerald-900">
                    ✕
                  </button>
                </div>
              )}

              {/* Editor Workspace Canvas with Active Format Sync */}
              {editorMode === 'visual' ? (
                <div
                  ref={visualEditorRef}
                  contentEditable
                  onInput={() => {
                    handleVisualInput();
                    updateActiveFormattingState();
                  }}
                  onClick={updateActiveFormattingState}
                  onKeyUp={updateActiveFormattingState}
                  onMouseUp={updateActiveFormattingState}
                  onBlur={handleVisualInput}
                  onPaste={handlePaste}
                  className="min-h-[420px] max-h-[620px] overflow-y-auto p-6 text-base text-[#1E1035] leading-relaxed outline-none focus:outline-none article-body editor-canvas prose prose-purple max-w-none"
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

        {/* ========================================================================= */}
        {/* MODAL 3: PROFESSIONAL TABLE STUDIO & FORMULA TABLE BUILDER */}
        {/* ========================================================================= */}
        {showTableModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#EDE9FE] flex items-center justify-between bg-[#FAF9FE]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                    <TableIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#1E1035] flex items-center gap-1.5">
                      <span>Professional Table Studio</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE]">
                        Formula &amp; Editorial
                      </span>
                    </h3>
                    <p className="text-xs text-[#6D6582]">
                      Insert formula calculation sheets, step-by-step matrices, or custom tables.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#EDE9FE] bg-white text-xs font-heading font-bold">
                <button
                  type="button"
                  onClick={() => setTableTab('presets')}
                  className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                    tableTab === 'presets'
                      ? 'border-[#7C3AED] text-[#7C3AED]'
                      : 'border-transparent text-[#6D6582] hover:text-[#1E1035]'
                  }`}
                >
                  ⚡ Professional Table Presets
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab('custom')}
                  className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                    tableTab === 'custom'
                      ? 'border-[#7C3AED] text-[#7C3AED]'
                      : 'border-transparent text-[#6D6582] hover:text-[#1E1035]'
                  }`}
                >
                  🛠️ Custom Grid Builder
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {tableTab === 'presets' ? (
                  <div className="space-y-3">
                    {/* Preset 1: Mathematical Formula & Variable Table */}
                    <div className="p-4 rounded-xl border border-[#DDD6FE] bg-[#FAF9FE] hover:border-[#7C3AED] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                            Mathematical Formula &amp; Calculation Sheet
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE]">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-[#6D6582]">
                          5 columns: [Parameter / Variable, Mathematical Formula, Standard Unit, Example Calculation, Interpretation].
                        </p>
                        <div className="font-mono text-[11px] text-[#7C3AED] bg-white p-1.5 rounded-lg border border-[#EDE9FE] inline-block">
                          e.g. A = B × (1 + r)^t • R = (Part / Total) × 100
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertPresetTable('formula')}
                        className="px-3.5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        Insert Formula Table
                      </button>
                    </div>

                    {/* Preset 2: Step-by-Step Calculation Guide */}
                    <div className="p-4 rounded-xl border border-[#EDE9FE] bg-white hover:border-[#7C3AED] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                            Step-by-Step Calculation Matrix
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Tutorials
                          </span>
                        </div>
                        <p className="text-xs text-[#6D6582]">
                          Chronological breakdown: [Step #, Operational Stage, Input Variables, Formula Applied, Calculated Output].
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertPresetTable('stepbystep')}
                        className="px-3.5 py-2 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] text-[#7C3AED] hover:border-[#7C3AED] rounded-xl text-xs font-heading font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Insert Step Matrix
                      </button>
                    </div>

                    {/* Preset 3: Feature / Method Comparison Matrix */}
                    <div className="p-4 rounded-xl border border-[#EDE9FE] bg-white hover:border-[#7C3AED] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                            Method &amp; Calculator Comparison Table
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Comparison
                          </span>
                        </div>
                        <p className="text-xs text-[#6D6582]">
                          Contrast approaches: [Evaluation Criteria, Standard Method, PRBSolver Calculator, Key Advantage].
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertPresetTable('comparison')}
                        className="px-3.5 py-2 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] text-[#7C3AED] hover:border-[#7C3AED] rounded-xl text-xs font-heading font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Insert Comparison
                      </button>
                    </div>

                    {/* Preset 4: Financial Growth Sheet */}
                    <div className="p-4 rounded-xl border border-[#EDE9FE] bg-white hover:border-[#7C3AED] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                            Financial &amp; Compound Growth Sheet
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Finance
                          </span>
                        </div>
                        <p className="text-xs text-[#6D6582]">
                          Year-by-year schedule: [Year / Period, Starting Balance, APY Rate, Interest Earned, Ending Balance].
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertPresetTable('financial')}
                        className="px-3.5 py-2 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] text-[#7C3AED] hover:border-[#7C3AED] rounded-xl text-xs font-heading font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Insert Financial Sheet
                      </button>
                    </div>

                    {/* Preset 5: Quick Reference Cheat Sheet */}
                    <div className="p-4 rounded-xl border border-[#EDE9FE] bg-white hover:border-[#7C3AED] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                            Rules &amp; Formulas Cheat Sheet
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Quick Reference
                          </span>
                        </div>
                        <p className="text-xs text-[#6D6582]">
                          Quick rules: [Rule / Theorem, Equation / Formula, Application Condition, Memory Trick].
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertPresetTable('cheatsheet')}
                        className="px-3.5 py-2 bg-white hover:bg-[#FAF9FE] border border-[#DDD6FE] text-[#7C3AED] hover:border-[#7C3AED] rounded-xl text-xs font-heading font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Insert Cheat Sheet
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-heading font-bold text-[#1E1035] mb-1">
                          Number of Rows (1 - 15)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={customTableRows}
                          onChange={(e) => setCustomTableRows(Number(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-heading font-bold text-[#1E1035] mb-1">
                          Number of Columns (1 - 8)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={customTableCols}
                          onChange={(e) => setCustomTableCols(Number(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-heading font-bold text-[#1E1035] mb-1">
                          Table Theme Style
                        </label>
                        <select
                          value={customTableStyle}
                          onChange={(e: any) => setCustomTableStyle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none cursor-pointer"
                        >
                          <option value="formula">Formula Purple Gradient (with formula column)</option>
                          <option value="standard">Modern Lavender Borders</option>
                          <option value="striped">Financial Striped Rows</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customTableHeader}
                            onChange={(e) => setCustomTableHeader(e.target.checked)}
                            className="w-4 h-4 text-[#7C3AED] rounded cursor-pointer"
                          />
                          <span className="font-heading font-semibold text-[#1E1035]">
                            Include Header Row
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Live Grid Preview Box */}
                    <div className="p-3 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl space-y-2">
                      <span className="font-heading font-bold text-[11px] text-[#6D6582] uppercase tracking-wider block">
                        Live Preview ({customTableRows} rows × {customTableCols} cols):
                      </span>
                      <div className="overflow-x-auto">
                        <table className={`w-full text-xs ${customTableStyle === 'formula' ? 'formula-table' : ''}`}>
                          {customTableHeader && (
                            <thead>
                              <tr>
                                {Array.from({ length: Math.min(customTableCols, 6) }).map((_, i) => (
                                  <th key={i} className="p-2 border border-[#DDD6FE]">Header {i + 1}</th>
                                ))}
                              </tr>
                            </thead>
                          )}
                          <tbody>
                            {Array.from({ length: Math.min(customTableRows, 3) }).map((_, r) => (
                              <tr key={r}>
                                {Array.from({ length: Math.min(customTableCols, 6) }).map((_, c) => (
                                  <td key={c} className={`p-2 border border-[#EDE9FE] ${customTableStyle === 'formula' && c === 1 ? 'formula-cell' : ''}`}>
                                    Cell {r + 1},{c + 1}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#EDE9FE] bg-[#FAF9FE] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-heading font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                {tableTab === 'custom' && (
                  <button
                    type="button"
                    onClick={handleInsertCustomTable}
                    className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-heading font-bold text-xs rounded-xl shadow-xs"
                  >
                    Insert Table into Article
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXCEL-GRADE CHART STUDIO MODAL (Interactive Financial & Calculation Charts) */}
        {/* ========================================================================= */}
        <ChartStudioModal
          isOpen={showChartModal}
          initialConfig={editingChartConfig}
          onClose={() => {
            setShowChartModal(false);
            setEditingChartConfig(null);
            setTargetChartElement(null);
          }}
          onSaveChart={handleSaveChart}
        />
      </div>
    </div>
  );
}
