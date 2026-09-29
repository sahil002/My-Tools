import { useState } from 'react';
import { SeoAnalysisResult } from '../../services/seoOptimizerService';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Layers,
  Link2,
  Hash,
} from 'lucide-react';

interface SeoAnalysisPanelProps {
  analysis: SeoAnalysisResult;
  focusKeyword: string;
}

export function SeoAnalysisPanel({ analysis, focusKeyword }: SeoAnalysisPanelProps) {
  const [filter, setFilter] = useState<'all' | 'issues' | 'good'>('all');

  const { overallScore, checks, stats } = analysis;

  const passedChecks = checks.filter((c) => c.status === 'good');
  const issueChecks = checks.filter((c) => c.status !== 'good');

  const filteredChecks =
    filter === 'all'
      ? checks
      : filter === 'issues'
      ? issueChecks
      : passedChecks;

  const getScoreColor = () => {
    if (overallScore >= 80) return 'text-[#16A34A] border-emerald-300 bg-emerald-50';
    if (overallScore >= 50) return 'text-[#D97706] border-amber-300 bg-amber-50';
    return 'text-[#DC2626] border-rose-300 bg-rose-50';
  };

  const getScoreBadgeText = () => {
    if (overallScore >= 80) return 'Great SEO';
    if (overallScore >= 50) return 'Fair — Needs Improvement';
    return 'Poor — Critical Fixes Needed';
  };

  return (
    <div
      id="seo-analysis-panel"
      className="bg-white border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 space-y-5 shadow-2xs font-sans"
    >
      {/* 1. Score Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
        <div className="flex items-center gap-4">
          {/* Radial / Pill Score Display */}
          <div
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor()}`}
          >
            <span className="text-xl font-extrabold font-mono leading-none">{overallScore}</span>
            <span className="text-[10px] font-bold opacity-75 mt-0.5">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-heading font-bold text-[#1E1035]">
                Real-Time RankMath SEO Score
              </h3>
              <span
                className={`text-[10px] font-heading font-bold px-2 py-0.5 rounded-full ${
                  overallScore >= 80
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : overallScore >= 50
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {getScoreBadgeText()}
              </span>
            </div>
            <p className="text-xs text-[#6D6582] mt-1">
              {passedChecks.length} of {checks.length} tests passed for focus keyword:
              <span className="font-semibold text-[#7C3AED] ml-1 font-mono">
                &ldquo;{focusKeyword || 'none set'}&rdquo;
              </span>
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 self-start sm:self-center bg-[#FAF9FE] border border-[#EDE9FE] p-1 rounded-xl text-xs font-heading font-medium">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#7C3AED] shadow-2xs font-semibold'
                : 'text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            All ({checks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('issues')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filter === 'issues'
                ? 'bg-white text-rose-600 shadow-2xs font-semibold'
                : 'text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            Issues ({issueChecks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('good')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filter === 'good'
                ? 'bg-white text-emerald-600 shadow-2xs font-semibold'
                : 'text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            Passed ({passedChecks.length})
          </button>
        </div>
      </div>

      {/* 2. Micro Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
          <div className="flex items-center gap-1.5 text-[#6D6582]">
            <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Word Count</span>
          </div>
          <div className="text-sm font-bold font-mono text-[#1E1035] mt-1">
            {stats.wordCount}{' '}
            <span className="text-[10px] font-normal text-[#6D6582]">
              (~{stats.readingTimeMinutes}m)
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
          <div className="flex items-center gap-1.5 text-[#6D6582]">
            <Hash className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Keyword Density</span>
          </div>
          <div className="text-sm font-bold font-mono text-[#1E1035] mt-1">
            {stats.keywordDensity}%{' '}
            <span className="text-[10px] font-normal text-[#6D6582]">
              ({stats.keywordOccurrences}x)
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
          <div className="flex items-center gap-1.5 text-[#6D6582]">
            <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Headings</span>
          </div>
          <div className="text-sm font-bold font-mono text-[#1E1035] mt-1">
            H1: {stats.h1Count} <span className="text-xs font-normal text-[#6D6582]">| H2: {stats.h2Count}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
          <div className="flex items-center gap-1.5 text-[#6D6582]">
            <Link2 className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Links (Int/Ext)</span>
          </div>
          <div className="text-sm font-bold font-mono text-[#1E1035] mt-1">
            {stats.internalLinksCount} <span className="text-xs font-normal text-[#6D6582]">int / {stats.externalLinksCount} ext</span>
          </div>
        </div>
      </div>

      {/* 3. Detailed Check List */}
      <div className="space-y-2.5">
        {filteredChecks.map((check) => {
          return (
            <div
              key={check.id}
              className={`p-3 rounded-xl border text-xs transition-all ${
                check.status === 'good'
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : check.status === 'warning'
                  ? 'border-amber-200 bg-amber-50/50'
                  : 'border-rose-200 bg-rose-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {check.status === 'good' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {check.status === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  {check.status === 'bad' && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-[#1E1035]">
                        {check.label}
                      </span>
                      {check.currentValue && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#EDE9FE] text-[#6D6582]">
                          {check.currentValue}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 leading-relaxed ${
                        check.status === 'good'
                          ? 'text-emerald-800'
                          : check.status === 'warning'
                          ? 'text-amber-800'
                          : 'text-rose-800'
                      }`}
                    >
                      {check.suggestion}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-heading font-bold px-2 py-0.5 rounded capitalize shrink-0 ${
                    check.status === 'good'
                      ? 'bg-emerald-100 text-emerald-800'
                      : check.status === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {check.status === 'good' ? 'Pass' : check.status === 'warning' ? 'Warning' : 'Critical'}
                </span>
              </div>
            </div>
          );
        })}

        {filteredChecks.length === 0 && (
          <div className="text-center py-6 text-xs text-[#6D6582]">
            No checks match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
