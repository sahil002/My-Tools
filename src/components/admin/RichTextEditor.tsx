import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Eye,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write or paste your article content here...',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Sync external value to contentEditable when not focused or on initial load
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isHtmlMode]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, val);
    handleInput();
  };

  const applyHeading = (tag: 'H1' | 'H2' | 'H3' | 'P') => {
    if (isHtmlMode) return;
    document.execCommand('formatBlock', false, tag);
    handleInput();
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    exec('createLink', linkUrl.trim());
    setLinkUrl('');
    setShowLinkModal(false);
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    const cleanUrl = imageUrl.trim();
    const cleanAlt = imageAlt.trim().replace(/"/g, '&quot;');
    const imgHtml = `<img src="${cleanUrl}" alt="${cleanAlt}" loading="lazy" decoding="async" class="max-w-full rounded-lg my-3" />`;
    exec('insertHTML', imgHtml);
    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  return (
    <div
      id="seo-rich-text-editor-container"
      className={`border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl overflow-hidden bg-[#FFFFFF] dark:bg-[#131A2B] flex flex-col ${className}`}
    >
      {/* Formatting Toolbar */}
      <div
        role="toolbar"
        aria-label="Formatting Toolbar"
        className="px-3 py-2 bg-[#F4F6F9] dark:bg-[#131A2B] border-b border-[#E4E8EF] dark:border-[#1B233A] flex flex-wrap items-center gap-1 text-xs select-none"
      >
        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-[#E4E8EF] dark:border-[#1B233A]">
          <button
            type="button"
            onClick={() => applyHeading('H1')}
            title="Heading 1"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyHeading('H2')}
            title="Heading 2"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyHeading('H3')}
            title="Heading 3"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyHeading('P')}
            title="Paragraph Text"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <Pilcrow className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Styling */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#E4E8EF] dark:border-[#1B233A]">
          <button
            type="button"
            onClick={() => exec('bold')}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] font-bold text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] italic text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#E4E8EF] dark:border-[#1B233A]">
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            title="Bullet List"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Media & Links */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#E4E8EF] dark:border-[#1B233A]">
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            title="Insert Hyperlink"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            title="Insert Image with Alt Text"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 px-2 border-r border-[#E4E8EF] dark:border-[#1B233A]">
          <button
            type="button"
            onClick={() => exec('undo')}
            title="Undo"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8]"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('redo')}
            title="Redo"
            className="p-1.5 rounded hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8]"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Switch: Visual vs HTML Source */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              isHtmlMode
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#E4E8EF] dark:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]'
            }`}
          >
            {isHtmlMode ? (
              <>
                <Eye className="w-3 h-3" />
                <span>Visual View</span>
              </>
            ) : (
              <>
                <Code className="w-3 h-3" />
                <span>HTML Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 min-h-[360px] p-4 text-[#131A2B] dark:text-[#F4F6F9] text-sm overflow-y-auto">
        {isHtmlMode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label="HTML Source Code Editor"
            className="w-full h-full min-h-[340px] font-mono text-xs p-3 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB] resize-y"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            role="textbox"
            aria-multiline="true"
            aria-label="Rich text content area"
            data-placeholder={placeholder}
            className="outline-none min-h-[340px] prose prose-slate dark:prose-invert max-w-none focus:ring-0 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#2563EB] [&_a]:underline"
          />
        )}
      </div>

      {/* Link Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Insert Link</span>
            </h4>
            <form onSubmit={handleInsertLink} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5B6577] dark:text-[#9AA5B8] mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com or /tools/word-counter"
                  required
                  autoFocus
                  className="w-full p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 rounded-lg text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Insertion Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Insert Image with Alt Text</span>
            </h4>
            <form onSubmit={handleInsertImage} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5B6577] dark:text-[#9AA5B8] mb-1">
                  Image Source URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or /assets/diagram.svg"
                  required
                  autoFocus
                  className="w-full p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
                />
              </div>
              <div>
                <label className="block text-[#5B6577] dark:text-[#9AA5B8] mb-1">
                  Alt Text (for SEO & Accessibility)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe image including focus keyword..."
                  className="w-full p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-3 py-1.5 rounded-lg text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
