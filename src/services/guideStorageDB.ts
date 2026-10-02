/**
 * PRBSolver Guides & Blog Storage Database Service
 * 
 * Manages full lifecycle of blog posts & guides:
 * - Synchronous local fallback + Supabase persistence
 * - Intelligent auto-parser for pasted articles (Markdown/Text)
 * - Built-in RankMath SEO Analyzer engine with 10 real tests
 */

import { GuideArticle, GuideSection } from '../types';
import { GUIDES as BUILTIN_GUIDES } from '../data/guides';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const GUIDES_STORAGE_KEY = 'ot_custom_guides_v2';
export const GUIDES_UPDATED_EVENT = 'prbsolver_guides_updated';

export interface RankMathTest {
  id: string;
  title: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
  recommendation: string;
}

export interface RankMathAnalysis {
  overallScore: number;
  grade: 'poor' | 'fair' | 'good' | 'excellent';
  gradeColor: string;
  passedCount: number;
  totalCount: number;
  wordCount: number;
  keywordDensity: number;
  tests: RankMathTest[];
}

/**
 * Get synchronous merged list of guides (built-in + custom stored)
 */
export function getAllMergedGuidesSync(): GuideArticle[] {
  if (typeof window === 'undefined') return BUILTIN_GUIDES;

  try {
    const raw = localStorage.getItem(GUIDES_STORAGE_KEY);
    const customList: GuideArticle[] = raw ? JSON.parse(raw) : [];

    // Map by slug so custom overrides or adds
    const map = new Map<string, GuideArticle>();
    BUILTIN_GUIDES.forEach((g) => map.set(g.slug, g));
    customList.forEach((g) => map.set(g.slug, g));

    return Array.from(map.values());
  } catch {
    return BUILTIN_GUIDES;
  }
}

/**
 * Get a single guide by slug (searches merged registry)
 */
export function getGuideArticleBySlug(slug: string): GuideArticle | undefined {
  const all = getAllMergedGuidesSync();
  return all.find((g) => g.slug === slug);
}

/**
 * Saves a guide article to LocalStorage & Supabase
 */
export async function saveGuideArticle(article: GuideArticle): Promise<{ success: boolean; message: string }> {
  try {
    const raw = localStorage.getItem(GUIDES_STORAGE_KEY);
    const customList: GuideArticle[] = raw ? JSON.parse(raw) : [];

    const existingIdx = customList.findIndex((g) => g.slug === article.slug);
    if (existingIdx >= 0) {
      customList[existingIdx] = {
        ...customList[existingIdx],
        ...article,
        updatedDate: new Date().toISOString().split('T')[0],
      };
    } else {
      customList.unshift({
        ...article,
        publishedDate: article.publishedDate || new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
      });
    }

    localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(customList));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GUIDES_UPDATED_EVENT));
    }

    // Background sync to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('guides').upsert(
          {
            slug: article.slug,
            title: article.title,
            description: article.description,
            category: article.category,
            author: article.author || 'PRBSolver Editorial Team',
            published_date: article.publishedDate,
            updated_date: article.updatedDate,
            reading_time: article.readingTime,
            quick_answer: article.quickAnswer,
            formula: article.formula,
            sections: article.sections || [],
            practical_examples: article.practicalExamples || [],
            common_mistakes: article.commonMistakes || [],
            related_tools: article.relatedTools || [],
            related_guides: article.relatedGuides || [],
            faq: article.faq || [],
            target_keyword: article.targetKeyword || '',
            seo_score: article.seoScore || 85,
            is_draft: Boolean(article.isDraft),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        );
      } catch (dbErr) {
        console.warn('[guideStorageDB] Supabase sync notice:', dbErr);
      }
    }

    return { success: true, message: `Guide "${article.title}" saved successfully!` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to save guide.' };
  }
}

/**
 * Deletes a guide article
 */
export async function deleteGuideArticle(slug: string): Promise<{ success: boolean; message: string }> {
  try {
    const raw = localStorage.getItem(GUIDES_STORAGE_KEY);
    const customList: GuideArticle[] = raw ? JSON.parse(raw) : [];
    const filtered = customList.filter((g) => g.slug !== slug);

    localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GUIDES_UPDATED_EVENT));
    }

    // Sync to Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('guides').delete().eq('slug', slug);
      } catch (dbErr) {
        console.warn('[guideStorageDB] Supabase delete notice:', dbErr);
      }
    }

    return { success: true, message: `Guide "${slug}" deleted successfully.` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to delete guide.' };
  }
}

/**
 * Smart Auto-Parser: Converts raw pasted text (Markdown/Text/AI output) into structured GuideArticle fields!
 */
export function parsePastedArticle(rawText: string): Partial<GuideArticle> {
  const text = rawText.trim();
  if (!text) return {};

  const lines = text.split('\n').map((l) => l.trim());
  let title = '';
  let formula = '';
  let quickAnswer = '';
  const sections: GuideSection[] = [];
  const faq: { question: string; answer: string }[] = [];
  const commonMistakes: string[] = [];

  let currentSectionTitle = 'Overview & Core Concept';
  let currentParagraphs: string[] = [];
  let currentListItems: string[] = [];

  const flushCurrentSection = () => {
    if (currentParagraphs.length > 0 || currentListItems.length > 0) {
      sections.push({
        title: currentSectionTitle,
        paragraphs: [...currentParagraphs],
        ...(currentListItems.length > 0 ? { listItems: [...currentListItems] } : {}),
      });
      currentParagraphs = [];
      currentListItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // 1. Detect Title (H1 or first bold line or first line)
    if (!title) {
      if (line.startsWith('# ')) {
        title = line.replace(/^#\s+/, '').trim();
        continue;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        title = line.replace(/^\*\*|\*\*$/g, '').trim();
        continue;
      } else if (i === 0 && line.length < 120 && !line.includes(':')) {
        title = line;
        continue;
      }
    }

    // 2. Detect Formula
    if (!formula && (line.toLowerCase().startsWith('formula:') || line.toLowerCase().startsWith('**formula:**'))) {
      formula = line.replace(/^(formula:|\*\*formula:\*\*)/i, '').trim();
      continue;
    } else if (!formula && (line.includes(' = ') || line.includes(' =\\(')) && line.length < 80 && line.startsWith('`')) {
      formula = line.replace(/`/g, '').trim();
      continue;
    }

    // 3. Detect Quick Answer / Takeaway
    if (!quickAnswer && (
      line.toLowerCase().startsWith('summary:') ||
      line.toLowerCase().startsWith('quick answer:') ||
      line.toLowerCase().startsWith('tl;dr:') ||
      line.toLowerCase().startsWith('key takeaway:')
    )) {
      quickAnswer = line.replace(/^(summary:|quick answer:|tl;dr:|key takeaway:)/i, '').trim();
      continue;
    }

    // 4. Detect FAQ Header & Q&A items
    if (line.toLowerCase().includes('frequently asked questions') || line.toLowerCase().startsWith('## faq')) {
      flushCurrentSection();
      currentSectionTitle = 'Frequently Asked Questions';
      continue;
    }

    if (line.startsWith('Q:') || line.startsWith('**Q:**') || line.startsWith('### ')) {
      const qText = line.replace(/^(Q:|\*\*Q:\*\*|###\s+)/i, '').trim();
      let aText = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.startsWith('A:') || nextLine.startsWith('**A:**')) {
          aText = nextLine.replace(/^(A:|\*\*A:\*\*)/i, '').trim();
          i++; // skip next line
        }
      }
      if (qText) {
        faq.push({ question: qText, answer: aText || 'See full explanation above.' });
      }
      continue;
    }

    // 5. Detect Section Headings (## Heading)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      flushCurrentSection();
      currentSectionTitle = line.replace(/^#{2,3}\s+/, '').replace(/\*\*/g, '').trim();
      continue;
    }

    // 6. Detect Bullet list items
    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      const item = line.replace(/^([-*]|\d+\.)\s+/, '').trim();
      if (currentSectionTitle.toLowerCase().includes('mistake') || currentSectionTitle.toLowerCase().includes('pitfall')) {
        commonMistakes.push(item);
      } else {
        currentListItems.push(item);
      }
      continue;
    }

    // 7. Regular paragraph
    currentParagraphs.push(line);
  }

  flushCurrentSection();

  // If no title extracted, generate from first section or generic
  if (!title && sections.length > 0) {
    title = sections[0].title;
  }
  if (!title) {
    title = 'Comprehensive Mathematical Guide';
  }

  // Generate clean slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);

  // Description / Excerpt
  let description = '';
  if (quickAnswer) {
    description = quickAnswer.slice(0, 160);
  } else if (sections.length > 0 && sections[0].paragraphs.length > 0) {
    description = sections[0].paragraphs[0].slice(0, 160);
  } else {
    description = `In-depth explanation and formula guide for ${title}. Practical examples and worked calculations.`;
  }

  // Count total words
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const readingTime = `${Math.max(2, Math.ceil(totalWords / 200))} min read`;

  // Detect simple target keyword from title
  const words = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const targetKeyword = words.slice(0, 3).join(' ') || 'formula guide';

  return {
    title,
    slug,
    description,
    category: 'calculators',
    author: 'PRBSolver Editorial Team',
    readingTime,
    quickAnswer: quickAnswer || description,
    formula: formula || undefined,
    sections: sections.length > 0 ? sections : [
      {
        title: 'Core Concept & Explanation',
        paragraphs: [text.slice(0, 500)],
      }
    ],
    faq: faq.length > 0 ? faq : undefined,
    commonMistakes: commonMistakes.length > 0 ? commonMistakes : undefined,
    targetKeyword,
    publishedDate: new Date().toISOString().split('T')[0],
    updatedDate: new Date().toISOString().split('T')[0],
  };
}

/**
 * RankMath SEO Analysis Engine:
 * Evaluates 10 Real SEO & Quality checkpoints
 */
export function calculateRankMathScore(guide: Partial<GuideArticle>): RankMathAnalysis {
  const title = (guide.title || '').trim();
  const desc = (guide.description || '').trim();
  const slug = (guide.slug || '').trim();
  const keyword = (guide.targetKeyword || '').trim().toLowerCase();
  const formula = (guide.formula || '').trim();
  const quickAnswer = (guide.quickAnswer || '').trim();
  const sections = guide.sections || [];
  const faq = guide.faq || [];

  // Combine full content for word count and keyword search
  const contentText = [
    title,
    desc,
    quickAnswer,
    ...sections.map((s) => `${s.title} ${(s.paragraphs || []).join(' ')} ${(s.listItems || []).join(' ')}`),
    ...faq.map((f) => `${f.question} ${f.answer}`),
  ].join(' ').toLowerCase();

  const words = contentText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Keyword density
  let keywordOccurrences = 0;
  if (keyword) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = contentText.match(new RegExp(escaped, 'gi'));
    keywordOccurrences = matches ? matches.length : 0;
  }
  const keywordDensity = wordCount > 0 && keyword ? (keywordOccurrences / (wordCount / (keyword.split(' ').length || 1))) * 100 : 0;

  const tests: RankMathTest[] = [];

  // Test 1: Keyword in SEO Title
  const hasKwInTitle = keyword ? title.toLowerCase().includes(keyword) : false;
  tests.push({
    id: 'kw-in-title',
    title: 'Focus Keyword in Title',
    passed: hasKwInTitle,
    score: hasKwInTitle ? 15 : 0,
    maxScore: 15,
    message: hasKwInTitle ? `Focus keyword "${keyword}" is present in the title.` : `Focus keyword is missing from the title.`,
    recommendation: 'Place your exact target keyword near the beginning of the title.',
  });

  // Test 2: Keyword in Meta Description
  const hasKwInDesc = keyword ? desc.toLowerCase().includes(keyword) : false;
  tests.push({
    id: 'kw-in-desc',
    title: 'Focus Keyword in Meta Description',
    passed: hasKwInDesc,
    score: hasKwInDesc ? 10 : 0,
    maxScore: 10,
    message: hasKwInDesc ? `Focus keyword is included in the meta description.` : `Focus keyword missing in meta description.`,
    recommendation: 'Add the focus keyword naturally into the meta description summary.',
  });

  // Test 3: Keyword in URL Slug
  const hasKwInSlug = keyword ? slug.toLowerCase().includes(keyword.replace(/\s+/g, '-')) : false;
  tests.push({
    id: 'kw-in-slug',
    title: 'Focus Keyword in URL Slug',
    passed: hasKwInSlug,
    score: hasKwInSlug ? 10 : 0,
    maxScore: 10,
    message: hasKwInSlug ? `Clean keyword URL slug detected (/guides/${slug}).` : `Keyword not reflected in the URL slug.`,
    recommendation: 'Use the target keyword in the permalink slug.',
  });

  // Test 4: Keyword in Introduction
  const firstSection = sections[0]?.paragraphs?.[0]?.toLowerCase() || '';
  const hasKwInIntro = keyword ? firstSection.includes(keyword) : false;
  tests.push({
    id: 'kw-in-intro',
    title: 'Focus Keyword in First Paragraph',
    passed: hasKwInIntro,
    score: hasKwInIntro ? 10 : 0,
    maxScore: 10,
    message: hasKwInIntro ? `Focus keyword appears in the first paragraph.` : `Focus keyword is missing from the article opening.`,
    recommendation: 'Mention the primary concept within the first 100 words.',
  });

  // Test 5: Keyword in H2/H3 Section Headings
  const hasKwInHeadings = keyword ? sections.some((s) => s.title.toLowerCase().includes(keyword)) : false;
  tests.push({
    id: 'kw-in-headings',
    title: 'Focus Keyword in Subheadings',
    passed: hasKwInHeadings,
    score: hasKwInHeadings ? 10 : 0,
    maxScore: 10,
    message: hasKwInHeadings ? `Focus keyword appears in at least one section subheading.` : `Keyword not found in subheadings.`,
    recommendation: 'Include your focus keyword in at least one H2 or H3 heading.',
  });

  // Test 6: Content Word Count
  const isWordCountGood = wordCount >= 600;
  const wordCountScore = wordCount >= 800 ? 15 : wordCount >= 500 ? 10 : wordCount >= 300 ? 5 : 0;
  tests.push({
    id: 'content-length',
    title: 'Content Depth & Word Count',
    passed: isWordCountGood,
    score: wordCountScore,
    maxScore: 15,
    message: `Article has ${wordCount} words (${wordCount >= 800 ? 'Comprehensive' : wordCount >= 500 ? 'Good' : 'Needs expansion'}).`,
    recommendation: 'Aim for at least 600–1,000 words for competitive Google ranking.',
  });

  // Test 7: Keyword Density (0.5% - 3.0%)
  const isDensityGood = keyword ? keywordDensity >= 0.5 && keywordDensity <= 3.2 : false;
  tests.push({
    id: 'kw-density',
    title: 'Focus Keyword Density',
    passed: isDensityGood,
    score: isDensityGood ? 10 : keywordDensity > 3.2 ? 4 : 2,
    maxScore: 10,
    message: `Keyword density is ${keywordDensity.toFixed(1)}% (${keywordOccurrences} mentions).`,
    recommendation: 'Maintain a natural 1.0% to 2.5% keyword density to avoid keyword stuffing.',
  });

  // Test 8: Mathematical Formula or Structured Proof
  const hasFormula = Boolean(formula) || sections.some((s) => s.table || s.paragraphs.some((p) => p.includes('=')));
  tests.push({
    id: 'formula-present',
    title: 'Mathematical Formula & Verification',
    passed: hasFormula,
    score: hasFormula ? 10 : 0,
    maxScore: 10,
    message: hasFormula ? `Clear formula notation detected.` : `No explicit mathematical formula found.`,
    recommendation: 'Include a formula box or equation for high-authority educational snippet ranking.',
  });

  // Test 9: Meta Description Length (120-160 chars)
  const isDescLenGood = desc.length >= 110 && desc.length <= 165;
  tests.push({
    id: 'desc-length',
    title: 'Snippet Length (120–160 Chars)',
    passed: isDescLenGood,
    score: isDescLenGood ? 5 : desc.length > 50 ? 2 : 0,
    maxScore: 5,
    message: `Description length is ${desc.length} characters.`,
    recommendation: 'Keep meta descriptions between 120 and 160 characters for zero SERP truncation.',
  });

  // Test 10: FAQ Section for Schema Rich Results
  const hasFaq = faq.length >= 2;
  tests.push({
    id: 'faq-schema',
    title: 'FAQ Rich Snippet Schema',
    passed: hasFaq,
    score: hasFaq ? 5 : faq.length > 0 ? 3 : 0,
    maxScore: 5,
    message: hasFaq ? `${faq.length} FAQ questions ready for Google Rich Snippets.` : `Fewer than 2 FAQs found.`,
    recommendation: 'Add 2–4 frequently asked questions to qualify for Google FAQ accordion snippets.',
  });

  const totalPossible = tests.reduce((acc, t) => acc + t.maxScore, 0); // 100
  const overallScore = Math.min(100, Math.round(tests.reduce((acc, t) => acc + t.score, 0)));
  const passedCount = tests.filter((t) => t.passed).length;

  let grade: RankMathAnalysis['grade'] = 'poor';
  let gradeColor = '#EF4444'; // red

  if (overallScore >= 80) {
    grade = 'excellent';
    gradeColor = '#10B981'; // green
  } else if (overallScore >= 65) {
    grade = 'good';
    gradeColor = '#3B82F6'; // blue
  } else if (overallScore >= 50) {
    grade = 'fair';
    gradeColor = '#F59E0B'; // amber
  }

  return {
    overallScore,
    grade,
    gradeColor,
    passedCount,
    totalCount: tests.length,
    wordCount,
    keywordDensity,
    tests,
  };
}

export const SUPABASE_GUIDES_SQL = `-- 8. Guides, Blog Posts & Educational Articles
CREATE TABLE IF NOT EXISTS public.guides (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'calculators',
    author TEXT NOT NULL DEFAULT 'PRBSolver Editorial Team',
    published_date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
    updated_date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
    reading_time TEXT NOT NULL DEFAULT '5 min read',
    quick_answer TEXT,
    formula TEXT,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    practical_examples JSONB DEFAULT '[]'::jsonb,
    common_mistakes JSONB DEFAULT '[]'::jsonb,
    related_tools JSONB DEFAULT '[]'::jsonb,
    related_guides JSONB DEFAULT '[]'::jsonb,
    faq JSONB DEFAULT '[]'::jsonb,
    target_keyword TEXT,
    seo_score INTEGER DEFAULT 85,
    is_draft BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_guides_slug ON public.guides(slug);
CREATE INDEX IF NOT EXISTS idx_guides_category ON public.guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON public.guides(created_at DESC);

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published guides"
    ON public.guides
    FOR SELECT
    USING (is_draft = false OR true);

CREATE POLICY "Service role full access to guides"
    ON public.guides
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR true);
`;
