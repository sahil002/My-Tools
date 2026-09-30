import {
  AutoOptimizationSuggestions,
  SeoAnalysisResult,
} from '../../services/seoOptimizerService';
import {
  Sparkles,
  X,
  Check,
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
      role="dialog"
      aria-modal="true"
      id="auto-optimize-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1035]/50 backdrop-blur-xs animate-in fade-in font-sans"
    >
      <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EDE9FE] flex items-center justify-between bg-[#FAF9FE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-[#1E1035]">
                Auto-Optimize Assistant
              </h3>
              <p className="text-xs text-[#6D6582]">
                Review targeted suggestions. Apply recommendations with 1-click.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* 1. Meta Title Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-heading font-bold text-[#1E1035] flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Meta Title Recommendation</span>
              </label>
              {suggestedTitle && suggestedTitle !== currentTitle && (
                <button
                  type="button"
                  onClick={() => onApplyTitle(suggestedTitle)}
                  className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Title</span>
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] space-y-2">
              <div className="text-[#6D6582]">
                <span className="font-semibold text-[#1E1035]">Current:</span>{' '}
                {currentTitle} ({currentTitle.length} chars)
              </div>
              {suggestedTitle ? (
                <div className="text-[#1E1035] pt-2 border-t border-[#EDE9FE]">
                  <span className="font-semibold text-emerald-600">Suggested:</span>{' '}
                  <span className="font-medium">{suggestedTitle}</span> ({suggestedTitle.length} chars)
                </div>
              ) : (
                <div className="text-emerald-700 font-medium">
                  Current title already meets SEO keyword and character length standards.
                </div>
              )}
            </div>
          </div>

          {/* 2. Meta Description Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-heading font-bold text-[#1E1035] flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Meta Description Recommendation</span>
              </label>
              {suggestedMetaDescription && suggestedMetaDescription !== currentMetaDescription && (
                <button
                  type="button"
                  onClick={() => onApplyDescription(suggestedMetaDescription)}
                  className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Description</span>
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] space-y-2">
              <div className="text-[#6D6582]">
                <span className="font-semibold text-[#1E1035]">Current:</span>{' '}
                {currentMetaDescription || '(Empty)'} ({currentMetaDescription.length} chars)
              </div>
              {suggestedMetaDescription ? (
                <div className="text-[#1E1035] pt-2 border-t border-[#EDE9FE]">
                  <span className="font-semibold text-emerald-600">Suggested:</span>{' '}
                  <span className="font-medium">{suggestedMetaDescription}</span> ({suggestedMetaDescription.length} chars)
                </div>
              ) : (
                <div className="text-emerald-700 font-medium">
                  Current description is already optimized.
                </div>
              )}
            </div>
          </div>

          {/* 3. Flagged Content Lines & Readability Issues */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-heading font-bold text-[#1E1035]">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Flagged Sentences &amp; Line Improvements</span>
            </div>

            {flaggedLines.length === 0 && lineImprovements.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs">
                No sentence complexity or keyword issues detected in the article content.
              </div>
            ) : (
              <div className="space-y-2">
                {flaggedLines.map((flag, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1">
                    <div className="text-[11px] font-semibold text-amber-900 flex items-center justify-between">
                      <span>{flag.issue}</span>
                      {flag.lineNumber && <span className="font-mono">Line {flag.lineNumber}</span>}
                    </div>
                    <div className="text-amber-800 italic">&ldquo;{flag.snippet}&rdquo;</div>
                    <div className="text-[11px] text-amber-950 font-medium">
                      Suggestion: {flag.suggestion}
                    </div>
                  </div>
                ))}

                {lineImprovements.map((imp, idx) => (
                  <div key={`imp-${idx}`} className="p-3 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#6D6582]">{imp.reason}</span>
                      <button
                        type="button"
                        onClick={() => onApplyLineImprovement(imp.recommended)}
                        className="text-[11px] font-heading font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                      >
                        Apply Line
                      </button>
                    </div>
                    <div className="text-xs text-[#6D6582] line-through">&ldquo;{imp.original}&rdquo;</div>
                    <div className="text-xs text-[#1E1035] font-medium">&ldquo;{imp.recommended}&rdquo;</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#EDE9FE] bg-[#FAF9FE] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
