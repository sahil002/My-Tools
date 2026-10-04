import React, { useMemo } from 'react';
import {
  InteractiveFinanceChart,
  ChartConfig,
} from './InteractiveFinanceChart';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(
  contentHtml?: string,
  sections?: { title?: string }[]
): HeadingItem[] {
  const headings: HeadingItem[] = [];

  if (contentHtml) {
    const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
    let match;
    let index = 0;
    while ((match = headingRegex.exec(contentHtml)) !== null) {
      const level = parseInt(match[1], 10);
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      if (text) {
        const id =
          text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || `section-${index}`;
        headings.push({ id, text, level });
        index++;
      }
    }
  }

  // Fallback to sections if no HTML headings found
  if (headings.length === 0 && sections && sections.length > 0) {
    sections.forEach((sec, idx) => {
      if (sec.title) {
        const id = `sec-${idx}`;
        headings.push({ id, text: sec.title, level: 2 });
      }
    });
  }

  return headings;
}

interface ArticleContentRendererProps {
  contentHtml: string;
  onEditChart?: (config: ChartConfig) => void;
  isEditable?: boolean;
}

export function ArticleContentRenderer({
  contentHtml,
  onEditChart,
  isEditable = false,
}: ArticleContentRendererProps) {
  // Parse content into HTML chunks and interactive chart blocks
  const parts = useMemo(() => {
    if (!contentHtml) return [];

    // Inject id attributes to <h2> and <h3> tags for TOC jump links
    let processedHtml = contentHtml;
    processedHtml = processedHtml.replace(
      /<h([2-3])([^>]*)>(.*?)<\/h\1>/gi,
      (match, level, attrs, text) => {
        const plainText = text.replace(/<[^>]+>/g, '').trim();
        const id =
          plainText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'heading';
        // If id already exists in attrs, leave it
        if (/id=["'][^"']+["']/i.test(attrs)) {
          return match;
        }
        return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
      }
    );

    // Split on chart block markers
    const chartRegex = /<div[^>]*class=["'][^"']*interactive-chart-block[^"']*["'][^>]*data-chart-config=["']([^"']+)["'][^>]*>[\s\S]*?<\/div>/gi;
    const pieces: { type: 'html' | 'chart'; content?: string; chartConfig?: ChartConfig }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = chartRegex.exec(processedHtml)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        pieces.push({
          type: 'html',
          content: processedHtml.substring(lastIndex, matchIndex),
        });
      }

      try {
        const rawJson = decodeURIComponent(match[1]);
        const chartConfig: ChartConfig = JSON.parse(rawJson);
        pieces.push({
          type: 'chart',
          chartConfig,
        });
      } catch (err) {
        console.error('Failed to parse chart config:', err);
        pieces.push({
          type: 'html',
          content: match[0],
        });
      }

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < processedHtml.length) {
      pieces.push({
        type: 'html',
        content: processedHtml.substring(lastIndex),
      });
    }

    return pieces;
  }, [contentHtml]);

  return (
    <div className="article-body prose prose-purple max-w-none text-sm sm:text-base leading-relaxed text-[#1E1035] space-y-4 font-sans">
      {parts.map((p, idx) => {
        if (p.type === 'chart' && p.chartConfig) {
          return (
            <div key={idx} className="my-6">
              <InteractiveFinanceChart
                config={p.chartConfig}
                onEdit={onEditChart ? () => onEditChart(p.chartConfig!) : undefined}
                isEditable={isEditable}
              />
            </div>
          );
        }
        return (
          <div
            key={idx}
            dangerouslySetInnerHTML={{ __html: p.content || '' }}
          />
        );
      })}
    </div>
  );
}
