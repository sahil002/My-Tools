import React, { useState } from 'react';
import { SeoAnalysisResult, SeoCheckItem } from '../../services/seoOptimizerService';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  Clock,
  Layers,
  Link2,
  Hash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SeoAnalysisPanelProps {
  analysis: SeoAnalysisResult;
  focusKeyword: string;
}

export function SeoAnalysisPanel({ analysis, focusKeyword }: SeoAnalysisPanelProps) {
  const [filter, setFilter] = useState<'all' | 'issues' | 'good'>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { overallScore, scoreTier, checks, stats } = analysis;

  const passedChecks = checks.filter((c) => c.status === 'good');
  const warningChecks = checks.filter((c) => c.status === 'warning');
  const badChecks = checks.filter((c) => c.status === 'bad');
  const issueChecks = checks.filter((c) => c.status !== 'good');

  const filteredChecks =
    filter === 'all'
      ? checks
      : filter === 'issues'
      ? issueChecks
      : passedChecks;

  const getScoreColor = () => {
    if (overallScore >= 80) return 'text-[#16A34A] dark:text-[#16A34A] border-[#16A34A]/30 bg-[#E9F8EF] dark:bg-[#1B233A]';
    if (overallScore >= 50) return 'text-[#F59E0B] dark:text-[#F59E0B] border-[#F59E0B]/30 bg-[#FFFBEB] dark:bg-[#1B233A]';
    return 'text-[#DC2626] dark:text-[#DC2626] border-[#DC2626]/30 bg-[#FEF2F2] dark:bg-[#1B233A]';
  };

  const getScoreBadgeText = () => {
    if (overallScore >= 80) return 'Great SEO';
    if (overallScore >= 50) return 'Fair — Needs Improvement';
    return 'Poor — Critical Fixes Needed';
  };

  return (
    <div
      id="seo-analysis-panel"
      className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-4 sm:p-5 space-y-5 shadow-2xs"
    >
      {/* 1. Score Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E8EF] dark:border-[#1B233A]">
        <div className="flex items-center gap-4">
          {/* Radial / Pill Score Display */}
          <div
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor()}`}
          >
            <span className="text-xl font-extrabold leading-none">{overallScore}</span>
            <span className="text-[10px] font-bold opacity-75 mt-0.5">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                Real-Time SEO Score
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  overallScore >= 80
                    ? 'bg-[#E9F8EF] text-[#16A34A] dark:bg-[#1B233A] dark:text-[#16A34A]'
                    : overallScore >= 50
                    ? 'bg-[#FFFBEB] text-[#F59E0B] dark:bg-[#1B233A] dark:text-[#F59E0B]'
                    : 'bg-[#FEF2F2] text-[#DC2626] dark:bg-[#1B233A] dark:text-[#DC2626]'
                }`}
              >
                {getScoreBadgeText()}
              </span>
            </div>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-1">
              {passedChecks.length} of {checks.length} tests passed based on target keyword:
              <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9] ml-1 font-mono">
                "{focusKeyword || 'none set'}"
              </span>
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 self-start sm:self-center bg-[#F4F6F9] dark:bg-[#1B233A] p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#FFFFFF] dark:bg-[#131A2B] text-[#131A2B] dark:text-[#F4F6F9] shadow-2xs font-semibold'
                : 'text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]'
            }`}
          >
            All ({checks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('issues')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filter === 'issues'
                ? 'bg-[#FFFFFF] dark:bg-[#131A2B] text-[#DC2626] dark:text-[#DC2626] shadow-2xs font-semibold'
                : 'text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]'
            }`}
          >
            Issues ({issueChecks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('good')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filter === 'good'
                ? 'bg-[#FFFFFF] dark:bg-[#131A2B] text-[#16A34A] dark:text-[#16A34A] shadow-2xs font-semibold'
                : 'text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]'
            }`}
          >
            Passed ({passedChecks.length})
          </button>
        </div>
      </div>

      {/* 2. Micro Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A]">
          <div className="flex items-center gap-1.5 text-[#5B6577] dark:text-[#9AA5B8]">
            <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Word Count</span>
          </div>
          <div className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-1">
            {stats.wordCount}{' '}
            <span className="text-[10px] font-normal text-[#5B6577] dark:text-[#9AA5B8]">
              (~{stats.readingTimeMinutes} min read)
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A]">
          <div className="flex items-center gap-1.5 text-[#5B6577] dark:text-[#9AA5B8]">
            <Hash className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Keyword Density</span>
          </div>
          <div className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-1">
            {stats.keywordDensity}%{' '}
            <span className="text-[10px] font-normal text-[#5B6577] dark:text-[#9AA5B8]">
              ({stats.keywordOccurrences}x)
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A]">
          <div className="flex items-center gap-1.5 text-[#5B6577] dark:text-[#9AA5B8]">
            <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Headings</span>
          </div>
          <div className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-1">
            H1: {stats.h1Count} <span className="text-xs font-normal text-[#5B6577] dark:text-[#9AA5B8]">| H2: {stats.h2Count}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A]">
          <div className="flex items-center gap-1.5 text-[#5B6577] dark:text-[#9AA5B8]">
            <Link2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Links (Int/Ext)</span>
          </div>
          <div className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-1">
            {stats.internalLinksCount} <span className="text-xs font-normal text-[#5B6577] dark:text-[#9AA5B8]">int / {stats.externalLinksCount} ext</span>
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
                  ? 'border-[#16A34A]/30 dark:border-emerald-950/60 bg-[#E9F8EF]/40 dark:bg-[#1B233A]'
                  : check.status === 'warning'
                  ? 'border-[#F59E0B]/30 dark:border-amber-950/60 bg-[#FFFBEB]/40 dark:bg-[#1B233A]'
                  : 'border-[#DC2626]/30 dark:border-rose-950/60 bg-[#FEF2F2]/40 dark:bg-[#1B233A]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {check.status === 'good' && (
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#16A34A] shrink-0 mt-0.5" />
                  )}
                  {check.status === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B] dark:text-[#F59E0B] shrink-0 mt-0.5" />
                  )}
                  {check.status === 'bad' && (
                    <XCircle className="w-4 h-4 text-[#DC2626] dark:text-[#DC2626] shrink-0 mt-0.5" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                        {check.label}
                      </span>
                      {check.currentValue && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8]">
                          {check.currentValue}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 leading-relaxed ${
                        check.status === 'good'
                          ? 'text-[#16A34A] dark:text-[#16A34A]'
                          : check.status === 'warning'
                          ? 'text-[#F59E0B] dark:text-[#F59E0B]'
                          : 'text-[#DC2626] dark:text-[#DC2626]'
                      }`}
                    >
                      {check.suggestion}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize shrink-0 ${
                    check.status === 'good'
                      ? 'bg-[#E9F8EF] text-[#16A34A] dark:bg-[#1B233A] dark:text-[#16A34A]'
                      : check.status === 'warning'
                      ? 'bg-[#FFFBEB] text-[#F59E0B] dark:bg-[#1B233A] dark:text-[#F59E0B]'
                      : 'bg-[#FEF2F2] text-[#DC2626] dark:bg-[#1B233A] dark:text-[#DC2626]'
                  }`}
                >
                  {check.status === 'good' ? 'Pass' : check.status === 'warning' ? 'Warning' : 'Critical'}
                </span>
              </div>
            </div>
          );
        })}

        {filteredChecks.length === 0 && (
          <div className="text-center py-6 text-xs text-[#5B6577] dark:text-[#9AA5B8]">
            No checks match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
