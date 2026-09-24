import React from 'react';
import {
  AutoOptimizationSuggestions,
  SeoAnalysisResult,
} from '../../services/seoOptimizerService';
import {
  Sparkles,
  X,
  Check,
  ArrowRight,
  AlertCircle,
  FileEdit,
  Lightbulb,
} from 'lucide-react';

interface AutoOptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AutoOptimizationSuggestions;
  analysis: SeoAnalysisResult;
  currentTitle: string;
  currentMetaDescription: string;
  onApplyTitle: (newTitle: string) => void;
  onApplyDescription: (newDesc: string) => void;
  onApplyLineImprovement: (recommended: string) => void;
}

export function AutoOptimizeModal({
  isOpen,
  onClose,
  suggestions,
  analysis,
  currentTitle,
  currentMetaDescription,
  onApplyTitle,
  onApplyDescription,
  onApplyLineImprovement,
}: AutoOptimizeModalProps) {
  if (!isOpen) return null;

  const { suggestedTitle, suggestedMetaDescription, lineImprovements } = suggestions;
  const { flaggedLines } = analysis;

  return (
    <div
      id="auto-optimize-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E4E8EF] dark:border-[#1B233A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                Auto-Optimize Assistant
              </h3>
              <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8]">
                Review targeted suggestions. Apply recommendations with 1-click without silent rewrites.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5B6577] hover:text-[#131A2B] dark:text-[#9AA5B8] dark:hover:text-[#F4F6F9] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* 1. Meta Title Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Meta Title Recommendation</span>
              </label>
              {suggestedTitle && suggestedTitle !== currentTitle && (
                <button
                  type="button"
                  onClick={() => onApplyTitle(suggestedTitle)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Title</span>
                </button>
              )}
            </div>

            <div className="p-3 rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] space-y-2">
              <div className="text-[#5B6577] dark:text-[#9AA5B8]">
                <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9]">Current:</span>{' '}
                {currentTitle} ({currentTitle.length} chars)
              </div>
              {suggestedTitle ? (
                <div className="text-[#131A2B] dark:text-[#F4F6F9] pt-1 border-t border-[#E4E8EF] dark:border-[#1B233A]">
                  <span className="font-semibold text-[#16A34A] dark:text-[#16A34A]">Suggested:</span>{' '}
                  <span className="font-medium">{suggestedTitle}</span> ({suggestedTitle.length} chars)
                </div>
              ) : (
                <div className="text-[#16A34A] dark:text-[#16A34A] font-medium">
                  Current title already meets SEO keyword and character length standards.
                </div>
              )}
            </div>
          </div>

          {/* 2. Meta Description Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Meta Description Recommendation</span>
              </label>
              {suggestedMetaDescription && suggestedMetaDescription !== currentMetaDescription && (
                <button
                  type="button"
                  onClick={() => onApplyDescription(suggestedMetaDescription)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Description</span>
                </button>
              )}
            </div>

            <div className="p-3 rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] space-y-2">
              <div className="text-[#5B6577] dark:text-[#9AA5B8]">
                <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9]">Current:</span>{' '}
                {currentMetaDescription || '(Empty)'} ({currentMetaDescription.length} chars)
              </div>
              {suggestedMetaDescription ? (
                <div className="text-[#131A2B] dark:text-[#F4F6F9] pt-1 border-t border-[#E4E8EF] dark:border-[#1B233A]">
                  <span className="font-semibold text-[#16A34A] dark:text-[#16A34A]">Suggested:</span>{' '}
                  <span className="font-medium">{suggestedMetaDescription}</span> ({suggestedMetaDescription.length} chars)
                </div>
              ) : (
                <div className="text-[#16A34A] dark:text-[#16A34A] font-medium">
                  Current description is already optimized.
                </div>
              )}
            </div>
          </div>

          {/* 3. Flagged Content Lines & Readability Issues */}
          <div className="space-y-3">
            <label className="font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Flagged Content Lines & Readability Enhancements</span>
            </label>

            {flaggedLines.length > 0 || lineImprovements.length > 0 ? (
              <div className="space-y-2.5">
                {lineImprovements.map((item, idx) => (
                  <div
                    key={`line-imp-${idx}`}
                    className="p-3.5 rounded-xl border border-[#F59E0B]/30 dark:border-amber-950/50 bg-[#FFFBEB]/40 dark:bg-[#1B233A] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900 dark:text-amber-200">
                        Opening Paragraph Recommendation
                      </span>
                      <button
                        type="button"
                        onClick={() => onApplyLineImprovement(item.recommended)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Paragraph</span>
                      </button>
                    </div>
                    <p className="text-[#F59E0B] dark:text-[#F59E0B]">{item.reason}</p>
                    <div className="p-2 rounded bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[11px] font-mono text-[#131A2B] dark:text-[#F4F6F9]">
                      {item.recommended}
                    </div>
                  </div>
                ))}

                {flaggedLines.map((flag, idx) => (
                  <div
                    key={`flag-${idx}`}
                    className="p-3 rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                        Sentence {flag.lineNumber}: {flag.issue}
                      </span>
                    </div>
                    <p className="text-[#5B6577] dark:text-[#9AA5B8] italic">
                      "{flag.snippet}"
                    </p>
                    <p className="text-[#16A34A] dark:text-[#16A34A] font-medium">
                      Suggestion: {flag.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#16A34A]/30 dark:border-emerald-950 bg-[#E9F8EF]/50 dark:bg-[#1B233A] text-[#16A34A] dark:text-[#16A34A]">
                No problematic lines detected! Sentence structures and keyword placements are clean.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
