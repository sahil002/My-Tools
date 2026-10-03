import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Code,
  Eye,
  Undo,
  Redo,
  Palette,
  Highlighter,
  RemoveFormatting,
  Upload,
  Minus,
  Check,
  X,
  Indent,
  Outdent,
  HelpCircle,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const COLOR_SWATCHES = [
  { name: 'Dark Ink', hex: '#1E1035' },
  { name: 'Primary Purple', hex: '#7C3AED' },
  { name: 'Accent Indigo', hex: '#4F46E5' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Rose Red', hex: '#E11D48' },
  { name: 'Muted Gray', hex: '#6D6582' },
];

const HIGHLIGHT_SWATCHES = [
  { name: 'None', hex: 'transparent' },
  { name: 'Yellow', hex: '#FEF08A' },
  { name: 'Green', hex: '#BBF7D0' },
  { name: 'Purple', hex: '#E9D5FF' },
  { name: 'Blue', hex: '#BAE6FD' },
  { name: 'Rose', hex: '#FECDD3' },
  { name: 'Orange', hex: '#FED7AA' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write or paste your article content here. Format headings, insert images, tables, formulas, and links just like in WordPress...',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  // Image Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Table Modal State
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Dropdown Popovers
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('P');
  const [selectedFont, setSelectedFont] = useState('sans');
  const [selectedSize, setSelectedSize] = useState('3');

  // Stats
  const [stats, setStats] = useState({ words: 0, chars: 0, headings: 0, readTime: '1m' });

  // Sync external value to contentEditable
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
        updateStats(value || '');
      }
    }
  }, [value, isHtmlMode]);

  const updateStats = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const headings = temp.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    const mins = Math.max(1, Math.ceil(words / 200));
    setStats({
      words,
      chars,
      headings,
      readTime: `~${mins}m`,
    });
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      updateStats(html);
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (isHtmlMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    handleInput();
  };

  const applyHeading = (tag: string) => {
    setSelectedFormat(tag);
    if (tag === 'P') {
      exec('formatBlock', '<p>');
    } else if (tag === 'BLOCKQUOTE') {
      exec('formatBlock', '<blockquote>');
    } else if (tag === 'PRE') {
      exec('formatBlock', '<pre>');
    } else {
      exec('formatBlock', `<${tag}>`);
    }
  };

  const applyFontFamily = (family: string) => {
    setSelectedFont(family);
    if (family === 'serif') {
      exec('fontName', 'Georgia, Cambria, serif');
    } else if (family === 'mono') {
      exec('fontName', 'Menlo, Monaco, Consolas, monospace');
    } else {
      exec('fontName', 'Inter, system-ui, sans-serif');
    }
  };

  const applyFontSize = (size: string) => {
    setSelectedSize(size);
    exec('fontSize', size); // 1 to 7
  };

  const applyTextColor = (hex: string) => {
    exec('foreColor', hex);
    setShowColorPicker(false);
  };

  const applyHighlight = (hex: string) => {
    exec('hiliteColor', hex);
    setShowHighlightPicker(false);
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim();
    const text = linkText.trim() || url;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const linkHtml = `<a href="${url}"${targetAttr} class="text-[#7C3AED] underline hover:text-[#6D28D9] font-medium">${text}</a>`;
    exec('insertHTML', linkHtml);
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          if (!imageAlt) {
            setImageAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    const cleanUrl = imageUrl.trim();
    const cleanAlt = (imageAlt.trim() || 'Guide illustration').replace(/"/g, '&quot;');
    const cleanCaption = imageCaption.trim();

    let imgHtml = '';
    if (cleanCaption) {
      imgHtml = `<figure class="my-5 text-center"><img src="${cleanUrl}" alt="${cleanAlt}" loading="lazy" class="max-w-full rounded-2xl mx-auto shadow-md border border-[#EDE9FE]" /><figcaption class="text-xs text-[#6D6582] mt-2 italic">${cleanCaption}</figcaption></figure><p></p>`;
    } else {
      imgHtml = `<img src="${cleanUrl}" alt="${cleanAlt}" loading="lazy" class="max-w-full rounded-2xl my-4 mx-auto shadow-md border border-[#EDE9FE]" /><p></p>`;
    }

    exec('insertHTML', imgHtml);
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
    setShowImageModal(false);
  };

  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = Math.max(1, Math.min(tableRows, 15));
    const cols = Math.max(1, Math.min(tableCols, 8));

    let tableHtml = '<div class="overflow-x-auto my-5"><table class="w-full text-left text-xs border border-[#DDD6FE] rounded-xl overflow-hidden">';
    // Header
    tableHtml += '<thead class="bg-[#FAF9FE] border-b border-[#DDD6FE]"><tr>';
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th class="p-3 font-heading font-bold text-[#1E1035] border-r border-[#EDE9FE]">Header ${c + 1}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';

    // Rows
    for (let r = 0; r < rows; r++) {
      tableHtml += `<tr class="${r % 2 === 0 ? 'bg-white' : 'bg-[#FAF9FE]'} border-b border-[#EDE9FE]">`;
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td class="p-3 border-r border-[#EDE9FE] text-[#1E1035]">Data (${r + 1}, ${c + 1})</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div><p></p>';

    exec('insertHTML', tableHtml);
    setShowTableModal(false);
  };

  return (
    <div
      id="wordpress-rich-editor"
      className={`border border-[#DDD6FE] rounded-2xl overflow-hidden bg-white shadow-2xs flex flex-col ${className}`}
    >
      {/* WordPress Style Toolbar */}
      <div
        role="toolbar"
        aria-label="WordPress Content Editor Toolbar"
        className="px-3 py-2 bg-[#FAF9FE] border-b border-[#EDE9FE] flex flex-wrap items-center gap-1.5 text-xs select-none sticky top-0 z-20"
      >
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          <button
            type="button"
            onClick={() => exec('undo')}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('redo')}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Heading Formats Dropdown */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          <select
            value={selectedFormat}
            onChange={(e) => applyHeading(e.target.value)}
            className="px-2 py-1 bg-white border border-[#DDD6FE] rounded-lg text-xs font-heading font-semibold text-[#1E1035] outline-none cursor-pointer hover:border-[#7C3AED]"
            title="Headings & Formats"
          >
            <option value="P">Paragraph Text</option>
            <option value="H1">Heading 1 (Main Title)</option>
            <option value="H2">Heading 2 (Major Section)</option>
            <option value="H3">Heading 3 (Sub-Section)</option>
            <option value="H4">Heading 4 (Minor Subtitle)</option>
            <option value="BLOCKQUOTE">Blockquote Callout</option>
            <option value="PRE">Code / Preformatted</option>
          </select>
        </div>

        {/* Font Family */}
        <div className="hidden sm:flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          <select
            value={selectedFont}
            onChange={(e) => applyFontFamily(e.target.value)}
            className="px-2 py-1 bg-white border border-[#DDD6FE] rounded-lg text-xs text-[#1E1035] outline-none cursor-pointer hover:border-[#7C3AED]"
            title="Font Family"
          >
            <option value="sans">Default Sans</option>
            <option value="serif">Editorial Serif</option>
            <option value="mono">Technical Monospace</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="hidden md:flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          <select
            value={selectedSize}
            onChange={(e) => applyFontSize(e.target.value)}
            className="px-2 py-1 bg-white border border-[#DDD6FE] rounded-lg text-xs text-[#1E1035] outline-none cursor-pointer hover:border-[#7C3AED]"
            title="Font Size"
          >
            <option value="2">Small (13px)</option>
            <option value="3">Normal (15px)</option>
            <option value="4">Medium (18px)</option>
            <option value="5">Large (22px)</option>
            <option value="6">Huge (28px)</option>
          </select>
        </div>

        {/* Basic Text Styling */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          <button
            type="button"
            onClick={() => exec('bold')}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#1E1035] font-bold cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#1E1035] italic cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            title="Underline (Ctrl+U)"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#1E1035] cursor-pointer"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            title="Strikethrough"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#1E1035] cursor-pointer"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Color & Highlight Palettes */}
        <div className="relative flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          {/* Text Color */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              title="Text Color"
              className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#1E1035] flex items-center gap-0.5 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-[#7C3AED]" />
            </button>

            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1.5 p-2 bg-white border border-[#DDD6FE] rounded-xl shadow-lg z-30 flex flex-wrap gap-1.5 w-44">
                <span className="text-[10px] font-heading font-bold text-[#6D6582] w-full block mb-1">Text Color</span>
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => applyTextColor(swatch.hex)}
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.name}
                    className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight Color */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              title="Highlight Background"
              className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#1E1035] flex items-center gap-0.5 cursor-pointer"
            >
              <Highlighter className="w-3.5 h-3.5 text-[#D97706]" />
            </button>

            {showHighlightPicker && (
              <div className="absolute left-0 top-full mt-1.5 p-2 bg-white border border-[#DDD6FE] rounded-xl shadow-lg z-30 flex flex-wrap gap-1.5 w-44">
                <span className="text-[10px] font-heading font-bold text-[#6D6582] w-full block mb-1">Highlight Color</span>
                {HIGHLIGHT_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => applyHighlight(swatch.hex)}
                    style={{ backgroundColor: swatch.hex === 'transparent' ? '#FFFFFF' : swatch.hex }}
                    title={swatch.name}
                    className="w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer text-[9px] flex items-center justify-center font-bold text-gray-500"
                  >
                    {swatch.hex === 'transparent' ? '✕' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          <button
            type="button"
            onClick={() => exec('justifyLeft')}
            title="Align Left"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyCenter')}
            title="Align Center"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyRight')}
            title="Align Right"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyFull')}
            title="Justify Text"
            className="hidden sm:inline-block p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Indents */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            title="Bullet List"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            title="Numbered List"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Insert Media, Links & Tables */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#EDE9FE]">
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            title="Insert Link"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#7C3AED] hover:text-[#6D28D9] cursor-pointer font-bold"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            title="Insert Image (Upload or URL with Alt text)"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#059669] hover:text-[#047857] cursor-pointer font-bold"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowTableModal(true)}
            title="Insert Structured Table"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => exec('insertHorizontalRule')}
            title="Horizontal Divider"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clear Formatting */}
        <div className="flex items-center gap-0.5 pr-1.5">
          <button
            type="button"
            onClick={() => exec('removeFormat')}
            title="Clear Formatting"
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Switch: Visual vs HTML Code */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all shadow-2xs cursor-pointer ${
              isHtmlMode
                ? 'bg-[#7C3AED] text-white'
                : 'bg-white border border-[#DDD6FE] text-[#1E1035] hover:bg-[#FAF9FE]'
            }`}
          >
            {isHtmlMode ? (
              <>
                <Eye className="w-3.5 h-3.5 text-white" />
                <span>Visual Editor</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>HTML Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="relative flex-1 min-h-[480px] p-5 text-[#1E1035] text-sm overflow-y-auto">
        {isHtmlMode ? (
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              updateStats(e.target.value);
            }}
            placeholder={placeholder}
            aria-label="HTML Source Code Editor"
            className="w-full h-full min-h-[440px] font-mono text-xs p-4 rounded-xl bg-[#0F0A1C] text-[#E9D5FF] border border-[#342456] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-y leading-relaxed"
          />
        ) : (
          <div
            id="wordpress-editable-content"
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            role="textbox"
            aria-multiline="true"
            aria-label="Rich text article content"
            data-placeholder={placeholder}
            className="outline-none min-h-[440px] max-w-none focus:ring-0 leading-relaxed font-sans text-sm sm:text-base text-[#1E1035] 
              [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:font-heading [&_h1]:font-extrabold [&_h1]:text-[#1E1035] [&_h1]:my-4 [&_h1]:leading-tight
              [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-heading [&_h2]:font-bold [&_h2]:text-[#1E1035] [&_h2]:my-3.5 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-[#EDE9FE]
              [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-[#7C3AED] [&_h3]:my-3
              [&_h4]:text-base [&_h4]:font-heading [&_h4]:font-bold [&_h4]:text-[#1E1035] [&_h4]:my-2
              [&_p]:my-2.5 [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul_li]:my-1
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol_li]:my-1
              [&_blockquote]:p-4 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#7C3AED] [&_blockquote]:bg-[#FAF5FF] [&_blockquote]:rounded-r-xl [&_blockquote]:italic [&_blockquote]:text-[#1E1035]
              [&_pre]:p-4 [&_pre]:my-4 [&_pre]:bg-[#0F0A1C] [&_pre]:text-[#E9D5FF] [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto
              [&_code]:bg-[#F5F3FF] [&_code]:text-[#7C3AED] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs
              [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse [&_table]:border [&_table]:border-[#DDD6FE] [&_table]:rounded-xl
              [&_th]:bg-[#FAF9FE] [&_th]:border [&_th]:border-[#DDD6FE] [&_th]:p-2.5 [&_th]:font-heading [&_th]:font-bold
              [&_td]:border [&_td]:border-[#EDE9FE] [&_td]:p-2.5
              [&_hr]:my-6 [&_hr]:border-[#DDD6FE]
              [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:my-4 [&_img]:mx-auto [&_img]:shadow-md
              [&_a]:text-[#7C3AED] [&_a]:underline [&_a]:font-medium hover:[&_a]:text-[#6D28D9]"
          />
        )}
      </div>

      {/* Editor Bottom Status Bar: Word Count & Headings */}
      <div className="px-4 py-2 bg-[#FAF9FE] border-t border-[#EDE9FE] flex items-center justify-between flex-wrap gap-2 text-[11px] text-[#6D6582] font-mono">
        <div className="flex items-center gap-3">
          <span>Words: <strong>{stats.words}</strong> ({stats.readTime} read)</span>
          <span>•</span>
          <span>Chars: <strong>{stats.chars}</strong></span>
          <span>•</span>
          <span>Headings: <strong>{stats.headings}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-[#7C3AED] font-heading font-semibold text-xs">
          <span>WYSIWYG WordPress Mode</span>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      </div>

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE9FE]">
              <h4 className="text-xs font-heading font-bold text-[#1E1035] flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-[#7C3AED]" />
                <span>Insert Hyperlink</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6D6582] font-heading font-semibold mb-1">Destination URL *</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com or /tools/percentage-calculator"
                  required
                  autoFocus
                  className="w-full p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#6D6582] font-heading font-semibold mb-1">Anchor Text (optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Leave empty to use selection or URL"
                  className="w-full p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#1E1035] cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="rounded text-[#7C3AED] focus:ring-0"
                />
                <span>Open in a new tab (target="_blank")</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EDE9FE]">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 rounded-xl text-[#6D6582] hover:bg-gray-100 cursor-pointer font-heading font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-heading font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs cursor-pointer"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-md w-full p-5 space-y-3.5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE9FE]">
              <h4 className="text-xs font-heading font-bold text-[#1E1035] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#7C3AED]" />
                <span>Insert Article Image</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertImage} className="space-y-3 text-xs">
              {/* Option A: Pick Local Image File */}
              <div className="p-3 rounded-xl bg-[#FAF5FF] border border-[#DDD6FE] text-center space-y-2">
                <span className="text-[11px] font-heading font-bold text-[#7C3AED] block">
                  Upload Image from Device
                </span>
                <input
                  type="file"
                  ref={imageFileInputRef}
                  onChange={handleImageFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  className="px-4 py-2 bg-white border border-[#DDD6FE] hover:border-[#7C3AED] text-[#7C3AED] rounded-xl font-heading font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image File...</span>
                </button>
                <p className="text-[10px] text-[#6D6582]">Supports JPG, PNG, WebP, SVG</p>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-[#9D95B3] uppercase">
                <span className="flex-1 border-t border-[#EDE9FE]" />
                <span>or enter URL</span>
                <span className="flex-1 border-t border-[#EDE9FE]" />
              </div>

              <div>
                <label className="block text-[#6D6582] font-heading font-semibold mb-1">Image URL *</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or data:image/png;base64..."
                  required
                  className="w-full p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#6D6582] font-heading font-semibold mb-1">
                  Alt Text (Crucial for RankMath SEO &amp; Accessibility) *
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe graphic including your focus keyword..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#6D6582] font-heading font-semibold mb-1">
                  Image Caption (optional)
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="e.g. Figure 1: Formula diagram breakdown"
                  className="w-full p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EDE9FE]">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-3 py-1.5 rounded-xl text-[#6D6582] hover:bg-gray-100 cursor-pointer font-heading font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-heading font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs cursor-pointer"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insert Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-xs w-full p-5 space-y-3.5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE9FE]">
              <h4 className="text-xs font-heading font-bold text-[#1E1035] flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-[#7C3AED]" />
                <span>Insert Table Grid</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertTable} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#6D6582] font-heading font-semibold mb-1">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#6D6582] font-heading font-semibold mb-1">Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] text-[#1E1035] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EDE9FE]">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-3 py-1.5 rounded-xl text-[#6D6582] hover:bg-gray-100 cursor-pointer font-heading font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-heading font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs cursor-pointer"
                >
                  Insert Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
