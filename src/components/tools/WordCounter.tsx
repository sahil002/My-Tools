import { useState, useMemo } from 'react';
import { FileText, Copy, Check, RotateCcw, Type, Sparkles } from 'lucide-react';

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'is', 'are', 'was', 'were'
]);

export function WordCounter() {
  const [text, setText] = useState<string>(
    'The percentage calculator and word counter are essential utilities for writers, students, and professionals. Clean tools save time and ensure accurate results.'
  );
  const [copied, setCopied] = useState(false);

  // Text Statistics Calculation
  const stats = useMemo(() => {
    const raw = text;
    const charWithSpaces = raw.length;
    const charNoSpaces = raw.replace(/\s/g, '').length;

    // Word tokens
    const wordsArray = raw
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const wordCount = wordsArray.length;

    // Sentences
    const sentences = raw
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const sentenceCount = sentences.length;

    // Paragraphs
    const paragraphs = raw
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const paragraphCount = paragraphs.length;

    // Reading & Speaking times
    const readingTimeMinutes = wordCount > 0 ? (wordCount / 225) : 0;
    const speakingTimeMinutes = wordCount > 0 ? (wordCount / 130) : 0;

    const formatTime = (mins: number) => {
      if (mins === 0) return '0 sec';
      if (mins < 1) {
        const secs = Math.ceil(mins * 60);
        return `${secs} sec`;
      }
      const m = Math.floor(mins);
      const s = Math.round((mins - m) * 60);
      return s > 0 ? `${m}m ${s}s` : `${m} min`;
    };

    // Keyword density
    const wordFrequency: Record<string, number> = {};
    wordsArray.forEach((rawWord) => {
      const clean = rawWord.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 2 && !STOP_WORDS.has(clean)) {
        wordFrequency[clean] = (wordFrequency[clean] || 0) + 1;
      }
    });

    const topKeywords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({
        word,
        count,
        density: wordCount > 0 ? ((count / wordCount) * 100).toFixed(1) : '0',
      }));

    return {
      wordCount,
      charWithSpaces,
      charNoSpaces,
      sentenceCount,
      paragraphCount,
      readingTime: formatTime(readingTimeMinutes),
      speakingTime: formatTime(speakingTimeMinutes),
      topKeywords,
    };
  }, [text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transformCase = (type: 'upper' | 'lower' | 'title' | 'sentence') => {
    if (!text) return;
    if (type === 'upper') {
      setText(text.toUpperCase());
    } else if (type === 'lower') {
      setText(text.toLowerCase());
    } else if (type === 'title') {
      setText(
        text
          .toLowerCase()
          .split(' ')
          .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
          .join(' ')
      );
    } else if (type === 'sentence') {
      setText(
        text
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
      );
    }
  };

  return (
    <div id="word-counter-tool" className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-5 sm:p-7 shadow-xs transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E4E8EF]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F1EEFF] text-[#7C5CFF] flex items-center justify-center font-heading font-bold text-sm shadow-2xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-[#131A2B]">Real-time Text Metrics</h2>
            <p className="font-sans text-xs text-[#5B6577]">Immediate statistics, reading times, and keyword density</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E4E8EF] rounded-lg text-xs font-heading font-semibold text-[#131A2B] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={() => setText('')}
            className="p-2 text-[#5B6577] hover:text-[#131A2B] rounded-lg hover:bg-white border border-[#E4E8EF] text-xs font-medium cursor-pointer transition-colors"
            title="Clear text"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Metrics Dashboard with Developer Result Panel Tint */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#F1EEFF] border border-[#7C5CFF]/30 rounded-xl">
          <div className="text-xs font-heading font-semibold text-[#7C5CFF] uppercase tracking-wider">Words</div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#7C5CFF] mt-1 tracking-tight">
            {stats.wordCount.toLocaleString()}
          </div>
          <div className="text-[11px] font-sans text-[#7C5CFF]/80 mt-0.5">lexical tokens</div>
        </div>

        <div className="p-3.5 bg-[#F4F6F9] border border-[#E4E8EF] rounded-xl">
          <div className="text-xs font-heading font-semibold text-[#5B6577] uppercase tracking-wider">Characters</div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#131A2B] mt-1 tracking-tight">
            {stats.charWithSpaces.toLocaleString()}
          </div>
          <div className="text-[11px] font-sans text-[#9AA5B8] mt-0.5">
            {stats.charNoSpaces.toLocaleString()} without spaces
          </div>
        </div>

        <div className="p-3.5 bg-[#F4F6F9] border border-[#E4E8EF] rounded-xl">
          <div className="text-xs font-heading font-semibold text-[#5B6577] uppercase tracking-wider">Sentences</div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#131A2B] mt-1 tracking-tight">
            {stats.sentenceCount.toLocaleString()}
          </div>
          <div className="text-[11px] font-sans text-[#9AA5B8] mt-0.5">
            {stats.paragraphCount} {stats.paragraphCount === 1 ? 'paragraph' : 'paragraphs'}
          </div>
        </div>

        <div className="p-3.5 bg-[#F1EEFF] border border-[#7C5CFF]/30 rounded-xl">
          <div className="text-xs font-heading font-semibold text-[#7C5CFF] uppercase tracking-wider">Reading Time</div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#7C5CFF] mt-1 tracking-tight">
            {stats.readingTime}
          </div>
          <div className="text-[11px] font-sans text-[#7C5CFF]/80 mt-0.5">
            Speech: {stats.speakingTime}
          </div>
        </div>
      </div>

      {/* Main Text Input Area */}
      <div className="mt-5">
        <label htmlFor="word-counter-textarea" className="sr-only">
          Text to analyze
        </label>
        <textarea
          id="word-counter-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here to analyze words, characters, and reading time in real time..."
          rows={7}
          className="w-full bg-[#FFFFFF] border border-[#E4E8EF] rounded-xl p-4 text-sm sm:text-base text-[#131A2B] placeholder-[#9AA5B8] focus:outline-hidden focus:ring-2 focus:ring-[#7C5CFF] focus:border-transparent transition-all resize-y leading-relaxed font-sans"
        />
      </div>

      {/* Quick Formatting Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#5B6577] font-heading font-medium flex items-center gap-1">
            <Type className="w-3.5 h-3.5" />
            Transform:
          </span>
          <button
            type="button"
            onClick={() => transformCase('upper')}
            className="px-2.5 py-1 bg-[#F4F6F9] border border-[#E4E8EF] rounded-md text-[#131A2B] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-colors cursor-pointer font-sans"
          >
            UPPERCASE
          </button>
          <button
            type="button"
            onClick={() => transformCase('lower')}
            className="px-2.5 py-1 bg-[#F4F6F9] border border-[#E4E8EF] rounded-md text-[#131A2B] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-colors cursor-pointer font-sans"
          >
            lowercase
          </button>
          <button
            type="button"
            onClick={() => transformCase('title')}
            className="px-2.5 py-1 bg-[#F4F6F9] border border-[#E4E8EF] rounded-md text-[#131A2B] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-colors cursor-pointer font-sans"
          >
            Title Case
          </button>
          <button
            type="button"
            onClick={() => transformCase('sentence')}
            className="px-2.5 py-1 bg-[#F4F6F9] border border-[#E4E8EF] rounded-md text-[#131A2B] hover:border-[#7C5CFF] hover:text-[#7C5CFF] transition-colors cursor-pointer font-sans"
          >
            Sentence case
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            setText(
              'Online Tools is engineered for high-speed, privacy-first everyday utility. Calculate percentages, analyze text length, compute chronological age, and reference educational formulas without tracking, delays, or intrusive ads.'
            )
          }
          className="text-[#2563EB] hover:underline font-heading font-medium cursor-pointer"
        >
          Load sample text
        </button>
      </div>

      {/* Keyword Density Breakdown */}
      {stats.topKeywords.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#E4E8EF]">
          <div className="text-xs font-heading font-semibold uppercase tracking-wider text-[#5B6577] mb-3">
            Top Keyword Frequency & Density
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stats.topKeywords.map((k, i) => (
              <div key={i} className="p-2.5 bg-[#F4F6F9] border border-[#E4E8EF] rounded-xl text-xs">
                <div className="font-heading font-semibold text-[#131A2B] truncate capitalize">{k.word}</div>
                <div className="text-[#5B6577] mt-0.5 flex items-center justify-between font-sans">
                  <span>{k.count}x</span>
                  <span className="font-heading font-semibold text-[#7C5CFF]">{k.density}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[#E4E8EF] flex items-center justify-between text-xs text-[#5B6577]">
        <span className="flex items-center gap-1 font-sans">
          <FileText className="w-3.5 h-3.5 text-[#7C5CFF]" />
          Zero upload • Processed locally in browser
        </span>
        <span className="font-sans">Standard Unicode compliance</span>
      </div>
    </div>
  );
}
