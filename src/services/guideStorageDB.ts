/**
 * PRBSolver Guides & Blog Storage Database Service
 * 
 * Manages full lifecycle of blog posts & guides:
 * - Supabase-backed persistence (production source of truth)
 * - WordPress-style Rich Content & HTML Editor support
 * - Intelligent auto-parser for pasted articles (Markdown/Text/HTML)
 * - Real-Time RankMath SEO Analyzer engine with 17 blog checkpoints
 */

import { GuideArticle, GuideSection } from '../types';
import { GUIDES as BUILTIN_GUIDES } from '../data/guides';
import { supabase, isSupabaseConfigured, getActiveSupabaseCredentials } from '../lib/supabaseClient';

export const GUIDES_STORAGE_KEY = 'ot_custom_guides_v2';
export const DELETED_GUIDES_KEY = 'ot_deleted_guides_v2';
export const GUIDES_UPDATED_EVENT = 'prbsolver_guides_updated';

// Supported table candidates in user's Supabase instance
export const GUIDE_TABLE_CANDIDATES = ['guides', 'guids', 'guide'] as const;
export const COMMENT_TABLE_CANDIDATES = [
  'guide_comments',
  'guids_comments',
  'guids-comment',
  'guids_comment',
  'guide_comment',
] as const;

let activeWorkingGuideTable: string | null = null;

export interface RankMathTest {
  id: string;
  category: 'basic' | 'additional' | 'title' | 'readability';
  targetFieldId: string;
  title: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
  recommendation: string;
  fixActionLabel: string;
}

export interface RankMathAnalysis {
  overallScore: number;
  grade: 'poor' | 'fair' | 'good' | 'great' | 'excellent';
  gradeLabel: string;
  gradeColor: string;
  passedCount: number;
  issuesCount: number;
  totalCount: number;
  wordCount: number;
  readingTimeText: string;
  keywordDensity: number;
  keywordCount: number;
  headingsSummary: string;
  h1Count: number;
  h2Count: number;
  linksSummary: string;
  intLinksCount: number;
  extLinksCount: number;
  tests: RankMathTest[];
}

/**
 * Returns set of permanently deleted guide slugs (normalized lowercase trimmed)
 */
export function getDeletedGuideSlugs(): Set<string> { return new Set(); }
export function markGuideSlugDeleted(_slug: string): void { }
export function unmarkGuideSlugDeleted(_slug: string): void { }

/** Production guide list is loaded from Supabase; browser storage is not a source of truth. */
export function getAllMergedGuidesSync(): GuideArticle[] { return []; }

export function getGuideArticleBySlug(_slug: string): GuideArticle | undefined { return undefined; }

export interface SupabaseGuidesStatus {
  isConfigured: boolean;
  projectUrl: string;
  detectedGuideTable: string | null;
  detectedCommentTable: string | null;
  guidesCount: number;
  commentsCount: number;
  tablesFound: string[];
  error?: string;
}

/**
 * Actively probes user's Supabase database to detect which tables exist ('guides', 'guids', etc.)
 * and tests read/write permissions.
 */
export async function testSupabaseGuidesConnection(): Promise<SupabaseGuidesStatus> {
  const creds = getActiveSupabaseCredentials();
  if (!creds.isConfigured || !supabase) {
    return {
      isConfigured: false,
      projectUrl: creds.url,
      detectedGuideTable: null,
      detectedCommentTable: null,
      guidesCount: 0,
      commentsCount: 0,
      tablesFound: [],
      error: 'Supabase credentials (URL & Key) are not configured in environment or settings.',
    };
  }

  const tablesFound: string[] = [];
  let detectedGuideTable: string | null = null;
  let detectedCommentTable: string | null = null;
  let guidesCount = 0;
  let commentsCount = 0;
  let lastError: string | undefined;

  // Test guide table candidates
  for (const table of GUIDE_TABLE_CANDIDATES) {
    try {
      const { data, count, error } = await supabase
        .from(table)
        .select('slug', { count: 'exact', head: false })
        .limit(10);
      if (!error) {
        tablesFound.push(table);
        if (!detectedGuideTable) {
          detectedGuideTable = table;
          activeWorkingGuideTable = table;
          guidesCount = typeof count === 'number' ? count : (data?.length || 0);
        }
      } else if (!lastError && error.code !== '42P01') {
        lastError = error.message;
      }
    } catch (e: any) {
      if (!lastError) lastError = e?.message;
    }
  }

  // Test comment table candidates
  for (const table of COMMENT_TABLE_CANDIDATES) {
    try {
      const { data, count, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: false })
        .limit(10);
      if (!error) {
        tablesFound.push(table);
        if (!detectedCommentTable) {
          detectedCommentTable = table;
          commentsCount = typeof count === 'number' ? count : (data?.length || 0);
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    isConfigured: true,
    projectUrl: creds.url,
    detectedGuideTable,
    detectedCommentTable,
    guidesCount,
    commentsCount,
    tablesFound,
    error: detectedGuideTable
      ? undefined
      : lastError || 'No guide tables ("guides" or "guids") found yet. Please run the SQL schema in Supabase SQL Editor.',
  };
}

/**
 * Fetches and syncs all guides directly from Supabase (auto-detects 'guides', 'guids', or 'guide')
 */
export async function syncGuidesFromSupabase(): Promise<{
  success: boolean;
  count: number;
  message: string;
  tableUsed?: string;
}> {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, count: 0, message: 'Supabase credentials are not configured in project.' };
    }

    let data: any[] | null = null;
    let lastError: any = null;
    let tableUsed = '';

    const candidates = activeWorkingGuideTable
      ? [activeWorkingGuideTable, ...GUIDE_TABLE_CANDIDATES.filter((t) => t !== activeWorkingGuideTable)]
      : GUIDE_TABLE_CANDIDATES;

    for (const table of candidates) {
      try {
        const res = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

        if (!res.error && res.data) {
          data = res.data;
          lastError = null;
          tableUsed = table;
          activeWorkingGuideTable = table;
          break;
        } else if (res.error) {
          lastError = res.error;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (lastError && !data) {
      return { success: false, count: 0, message: `Supabase query error: ${lastError.message || lastError}` };
    }

    if (data && Array.isArray(data)) {
      const deleted = getDeletedGuideSlugs();
      const raw = localStorage.getItem(GUIDES_STORAGE_KEY);
      const customList: GuideArticle[] = raw ? JSON.parse(raw) : [];
      const map = new Map<string, GuideArticle>();

      customList.forEach((g) => {
        if (!deleted.has(g.slug.toLowerCase().trim())) {
          map.set(g.slug, g);
        }
      });

      data.forEach((row: any) => {
        const slugKey = (row.slug || '').toLowerCase().trim();
        if (slugKey && !deleted.has(slugKey)) {
          map.set(row.slug, {
            slug: row.slug,
            title: row.title || 'Untitled Guide',
            description: row.description || '',
            category: row.category || 'calculators',
            author: row.author || 'PRBSolver Editorial Team',
            publishedDate: row.published_date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            updatedDate: row.updated_date || row.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            readingTime: row.reading_time || '5 min read',
            quickAnswer: row.quick_answer || '',
            formula: row.formula || undefined,
            contentHtml: row.content_html || row.contentHtml || undefined,
            sections: Array.isArray(row.sections) ? row.sections : [],
            practicalExamples: Array.isArray(row.practical_examples) ? row.practical_examples : [],
            commonMistakes: Array.isArray(row.common_mistakes) ? row.common_mistakes : [],
            relatedTools: Array.isArray(row.related_tools) ? row.related_tools : [],
            relatedGuides: Array.isArray(row.related_guides) ? row.related_guides : [],
            faq: Array.isArray(row.faq) ? row.faq : [],
            targetKeyword: row.target_keyword || '',
            seoScore: row.seo_score || 85,
            isDraft: Boolean(row.is_draft),
          });
        }
      });

      const mergedCustom = Array.from(map.values());
      localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(mergedCustom));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(GUIDES_UPDATED_EVENT));
      }

      return {
        success: true,
        count: data.length,
        tableUsed,
        message: `Successfully synchronized ${data.length} guides from Supabase (table: "${tableUsed}")!`,
      };
    }

    return { success: true, count: 0, message: 'No guide records found in Supabase table.' };
  } catch (err: any) {
    return { success: false, count: 0, message: err?.message || 'Sync failed.' };
  }
}

/**
 * Saves a guide article to LocalStorage & Supabase (seamless multi-table candidate support)
 */
export async function saveGuideArticle(article: GuideArticle): Promise<{
  success: boolean;
  message: string;
  supabaseSynced?: boolean;
  supabaseError?: string;
  syncedTable?: string;
}> {
  try {
    unmarkGuideSlugDeleted(article.slug);
    const raw = localStorage.getItem(GUIDES_STORAGE_KEY);
    const customList: GuideArticle[] = raw ? JSON.parse(raw) : [];

    const existingIdx = customList.findIndex(
      (g) => g.slug.toLowerCase().trim() === article.slug.toLowerCase().trim()
    );
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

    // Direct persistence into Supabase
    let supabaseResult: { synced: boolean; tableName?: string; error?: string } = { synced: false };

    if (isSupabaseConfigured() && supabase) {
      const fullPayload: Record<string, any> = {
        id: (article as any).id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `guide-${Date.now()}`),
        slug: article.slug,
        title: article.title,
        description: article.description,
        category: article.category,
        author: article.author || 'PRBSolver Editorial Team',
        published_date: article.publishedDate || new Date().toISOString().split('T')[0],
        updated_date: new Date().toISOString().split('T')[0],
        reading_time: article.readingTime || '5 min read',
        quick_answer: article.quickAnswer || null,
        formula: article.formula || null,
        content_html: article.contentHtml || null,
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
      };

      const candidates = activeWorkingGuideTable
        ? [activeWorkingGuideTable, ...GUIDE_TABLE_CANDIDATES.filter((t) => t !== activeWorkingGuideTable)]
        : GUIDE_TABLE_CANDIDATES;

      let lastDbError: any = null;

      for (const table of candidates) {
        try {
          // Attempt 1: upsert with full payload onConflict slug
          let { error: upsertErr } = await supabase.from(table).upsert(fullPayload, { onConflict: 'slug' });

          // If onConflict fails or table lacks unique constraint on slug, try update or insert
          if (upsertErr && (upsertErr.code === '42P10' || upsertErr.message?.includes('ON CONFLICT'))) {
            const { data: existingRows } = await supabase.from(table).select('id, slug').eq('slug', article.slug).limit(1);
            if (existingRows && existingRows.length > 0) {
              const { error: updErr } = await supabase.from(table).update(fullPayload).eq('slug', article.slug);
              upsertErr = updErr;
            } else {
              const { error: insErr } = await supabase.from(table).insert([fullPayload]);
              upsertErr = insErr;
            }
          }

          // If error is missing column (code 42703), retry with core standard columns
          if (upsertErr && (upsertErr.code === '42703' || upsertErr.message?.toLowerCase().includes('column'))) {
            const corePayload: Record<string, any> = {
              slug: article.slug,
              title: article.title,
              description: article.description,
              category: article.category,
              author: article.author || 'PRBSolver Editorial Team',
              reading_time: article.readingTime || '5 min read',
              content_html: article.contentHtml || null,
              sections: article.sections || [],
              target_keyword: article.targetKeyword || '',
              seo_score: article.seoScore || 85,
              is_draft: Boolean(article.isDraft),
              updated_at: new Date().toISOString(),
            };
            const retryRes = await supabase.from(table).upsert(corePayload, { onConflict: 'slug' });
            if (!retryRes.error) {
              upsertErr = null;
            }
          }

          if (!upsertErr) {
            activeWorkingGuideTable = table;
            supabaseResult = { synced: true, tableName: table };
            break;
          } else {
            lastDbError = upsertErr;
            // If table does not exist (relation error 42P01), continue loop to next candidate
            if (upsertErr.code === '42P01' || upsertErr.message?.toLowerCase().includes('relation')) {
              continue;
            }
          }
        } catch (dbEx: any) {
          lastDbError = dbEx;
        }
      }

      if (!supabaseResult.synced && lastDbError) {
        supabaseResult = {
          synced: false,
          error: lastDbError?.message || 'Failed to persist into Supabase',
        };
      }
    }

    if (isSupabaseConfigured()) {
      if (supabaseResult.synced) {
        return {
          success: true,
          message: `Guide "${article.title}" saved & synced to Supabase (table: "${supabaseResult.tableName}")!`,
          supabaseSynced: true,
          syncedTable: supabaseResult.tableName,
        };
      } else {
        return {
          success: true,
          message: `Saved locally! (Supabase sync notice: ${supabaseResult.error || 'table not found in database'})`,
          supabaseSynced: false,
          supabaseError: supabaseResult.error,
        };
      }
    }

    return { success: true, message: `Guide "${article.title}" saved successfully!` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to save guide.' };
  }
}

/**
 * Pushes all current local/built-in guides into Supabase
 */
export async function pushLocalGuidesToSupabase(): Promise<{
  success: boolean;
  count: number;
  message: string;
  tableUsed?: string;
}> {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, count: 0, message: 'Supabase is not configured yet.' };
    }
    const all = getAllMergedGuidesSync();
    let savedCount = 0;
    let targetTable = '';
    for (const g of all) {
      const res = await saveGuideArticle(g);
      if (res.supabaseSynced) {
        savedCount++;
        if (res.syncedTable) targetTable = res.syncedTable;
      }
    }
    return {
      success: true,
      count: savedCount,
      tableUsed: targetTable,
      message: `Uploaded ${savedCount} guides to Supabase (table: "${targetTable || 'guides'}") successfully!`,
    };
  } catch (err: any) {
    return { success: false, count: 0, message: err?.message || 'Upload failed.' };
  }
}

/**
 * Deletes a guide article permanently from local cache, blacklist, and all candidate tables in Supabase
 */
export async function deleteGuideArticle(slug: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanSlug = slug.toLowerCase().trim();
    markGuideSlugDeleted(cleanSlug);

    const raw = localStorage.getItem(GUIDES_STORAGE_KEY);
    const customList: GuideArticle[] = raw ? JSON.parse(raw) : [];
    const filtered = customList.filter((g) => g.slug.toLowerCase().trim() !== cleanSlug);

    localStorage.setItem(GUIDES_STORAGE_KEY, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GUIDES_UPDATED_EVENT));
    }

    // Sync deletion across all possible candidate tables in Supabase ('guides', 'guids', 'guide')
    if (isSupabaseConfigured() && supabase) {
      for (const table of GUIDE_TABLE_CANDIDATES) {
        try {
          await supabase.from(table).delete().eq('slug', slug);
          if (cleanSlug !== slug) {
            await supabase.from(table).delete().eq('slug', cleanSlug);
          }
        } catch (dbErr) {
          console.warn(`[guideStorageDB] Supabase delete notice for table ${table}:`, dbErr);
        }
      }
    }

    return { success: true, message: `Guide "${slug}" deleted permanently.` };
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
        paragraphs: currentParagraphs.length > 0 ? [...currentParagraphs] : [''],
        listItems: currentListItems.length > 0 ? [...currentListItems] : undefined,
      });
      currentParagraphs = [];
      currentListItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Detect H1 Title (# Title or Title: ...)
    if (!title && (line.startsWith('# ') || line.toLowerCase().startsWith('title:'))) {
      title = line.replace(/^#\s*/, '').replace(/^title:\s*/i, '').trim();
      continue;
    }

    // Detect Formula
    if (!formula && (line.toLowerCase().startsWith('formula:') || line.toLowerCase().startsWith('**formula:**'))) {
      formula = line.replace(/^(\*\*)?formula:(\*\*)?\s*/i, '').trim();
      continue;
    }

    // Detect Quick Answer
    if (!quickAnswer && (line.toLowerCase().startsWith('quick answer:') || line.toLowerCase().startsWith('**quick answer:**') || line.toLowerCase().startsWith('key takeaway:'))) {
      quickAnswer = line.replace(/^(\*\*)?(quick answer|key takeaway):(\*\*)?\s*/i, '').trim();
      continue;
    }

    // Detect FAQ item
    if (line.toLowerCase().startsWith('q:') || line.toLowerCase().startsWith('**q:') || line.toLowerCase().startsWith('faq:')) {
      const q = line.replace(/^(\*\*)?q:(\*\*)?\s*/i, '').replace(/^faq:\s*/i, '').trim();
      let a = '';
      if (i + 1 < lines.length && (lines[i + 1].toLowerCase().startsWith('a:') || lines[i + 1].toLowerCase().startsWith('**a:'))) {
        a = lines[i + 1].replace(/^(\*\*)?a:(\*\*)?\s*/i, '').trim();
        i++;
      }
      if (q) faq.push({ question: q, answer: a || 'Refer to the detailed guide above.' });
      continue;
    }

    // Detect H2 Section Header (## Section Title)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      flushCurrentSection();
      currentSectionTitle = line.replace(/^#+\s*/, '').trim();
      continue;
    }

    // Detect list items (- item, * item, 1. item)
    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      currentListItems.push(line.replace(/^[-*]\s+|\d+\.\s+/, '').trim());
      continue;
    }

    // Regular paragraph
    currentParagraphs.push(line);
  }

  flushCurrentSection();

  // Generate fallback slug
  const slug = title
    ? title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 70)
    : 'new-mathematical-guide';

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
 * Full Suite of 17 Real Blog & Content SEO checkpoints with Click-to-Fix field targets
 * Fully analyzes both WordPress WYSIWYG HTML content and structured sections!
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
  const contentHtml = (guide.contentHtml || '').trim();

  // Strip HTML tags for accurate plain text extraction
  const htmlPlainText = contentHtml ? contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  // Full content text combines structured sections + WordPress HTML content
  const contentText = [
    title,
    desc,
    quickAnswer,
    htmlPlainText,
    ...sections.map((s) => `${s.title} ${(s.paragraphs || []).join(' ')} ${(s.listItems || []).join(' ')}`),
    ...faq.map((f) => `${f.question} ${f.answer}`),
  ].join(' ');

  const words = contentText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMins = Math.max(1, Math.ceil(wordCount / 200));
  const readingTimeText = `~${readingTimeMins}m`;

  // Keyword density
  let keywordOccurrences = 0;
  if (keyword) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = contentText.match(new RegExp(escaped, 'gi'));
    keywordOccurrences = matches ? matches.length : 0;
  }
  const keywordDensity = wordCount > 0 && keyword ? Number(((keywordOccurrences / (wordCount / Math.max(1, keyword.split(' ').length))) * 100).toFixed(1)) : 0;

  // Headings analysis (checks both title/sections and HTML tags <h1>, <h2>, <h3>)
  const h1HtmlMatches = (contentHtml.match(/<h1[^>]*>/gi) || []).length;
  const h2HtmlMatches = (contentHtml.match(/<h2[^>]*>/gi) || []).length;
  const h1Count = (title ? 1 : 0) + (h1HtmlMatches > 0 ? h1HtmlMatches - 1 : 0);
  const h2Count = Math.max(sections.filter((s) => s.title && s.title.trim()).length, h2HtmlMatches);
  const headingsSummary = `H1: ${Math.max(1, h1Count)} | H2: ${h2Count}`;

  // Links analysis (checks both text and HTML links)
  const internalLinkMatches = (contentHtml + ' ' + contentText).match(/(?:href=["']\/|\/tools\/|\/calculators\/|\/guides\/|prbsolver\.com)/gi);
  const externalLinkMatches = (contentHtml + ' ' + contentText).match(/https?:\/\/(?!prbsolver\.com)[\w.-]+/gi);
  const intLinksCount = internalLinkMatches ? internalLinkMatches.length : 0;
  const extLinksCount = externalLinkMatches ? externalLinkMatches.length : 0;
  const linksSummary = `${intLinksCount} int / ${extLinksCount} ext`;

  // First paragraph text (either from HTML <p> or first section)
  const firstHtmlP = contentHtml ? (contentHtml.match(/<p[^>]*>(.*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, '') || '') : '';
  const firstSectionP = sections[0]?.paragraphs?.[0] || '';
  const firstParagraph = (firstHtmlP || firstSectionP || '').toLowerCase();

  // Images in content
  const imgMatches = contentHtml.match(/<img[^>]*>/gi) || [];
  const hasImages = imgMatches.length > 0;
  const hasKwInImgAlt = keyword && imgMatches.some((img) => img.toLowerCase().includes('alt=') && img.toLowerCase().includes(keyword));

  const tests: RankMathTest[] = [];

  // Test 1: Keyword in SEO Title
  const hasKwInTitle = keyword ? title.toLowerCase().includes(keyword) : false;
  tests.push({
    id: 'kw-in-title',
    category: 'basic',
    targetFieldId: 'guide-field-title',
    title: 'Focus Keyword in SEO Title',
    passed: hasKwInTitle,
    score: hasKwInTitle ? 12 : 0,
    maxScore: 12,
    message: hasKwInTitle ? `Focus keyword "${keyword}" is present in title.` : `Focus keyword is missing from title.`,
    recommendation: 'Place your exact target keyword near the beginning of the title.',
    fixActionLabel: 'Edit Title (H1)',
  });

  // Test 2: Keyword in Meta Description
  const hasKwInDesc = keyword ? desc.toLowerCase().includes(keyword) : false;
  tests.push({
    id: 'kw-in-desc',
    category: 'basic',
    targetFieldId: 'guide-field-description',
    title: 'Focus Keyword in Meta Description',
    passed: hasKwInDesc,
    score: hasKwInDesc ? 10 : 0,
    maxScore: 10,
    message: hasKwInDesc ? `Focus keyword is included in the meta description.` : `Focus keyword missing in meta description.`,
    recommendation: 'Add the focus keyword naturally into the meta description summary.',
    fixActionLabel: 'Edit Meta Description',
  });

  // Test 3: Keyword in URL Slug
  const kwSlugFormat = keyword.replace(/\s+/g, '-');
  const hasKwInSlug = keyword ? slug.toLowerCase().includes(kwSlugFormat) || slug.toLowerCase().includes(keyword.replace(/\s+/g, '')) : false;
  tests.push({
    id: 'kw-in-slug',
    category: 'basic',
    targetFieldId: 'guide-field-slug',
    title: 'Focus Keyword in URL Slug',
    passed: hasKwInSlug,
    score: hasKwInSlug ? 8 : 0,
    maxScore: 8,
    message: hasKwInSlug ? `Clean keyword URL slug detected (/guides/${slug}).` : `Keyword not reflected in the URL slug.`,
    recommendation: 'Use the target keyword in the permalink slug.',
    fixActionLabel: 'Edit URL Slug',
  });

  // Test 4: Keyword in Introduction (first 10% or first paragraph)
  const hasKwInIntro = keyword ? firstParagraph.includes(keyword) : false;
  tests.push({
    id: 'kw-in-intro',
    category: 'basic',
    targetFieldId: 'guide-editor-content',
    title: 'Focus Keyword in First Paragraph',
    passed: hasKwInIntro,
    score: hasKwInIntro ? 8 : 0,
    maxScore: 8,
    message: hasKwInIntro ? `Focus keyword appears in the first paragraph.` : `Focus keyword is missing from the article opening.`,
    recommendation: 'Mention the primary concept within the first 100 words of your article.',
    fixActionLabel: 'Edit First Paragraph',
  });

  // Test 5: Keyword found in content body
  const kwInContentCount = keywordOccurrences;
  const hasKwInContent = kwInContentCount > 0;
  tests.push({
    id: 'kw-in-content',
    category: 'basic',
    targetFieldId: 'guide-editor-content',
    title: 'Focus Keyword Found in Content',
    passed: hasKwInContent,
    score: hasKwInContent ? 8 : 0,
    maxScore: 8,
    message: hasKwInContent ? `Focus keyword found ${kwInContentCount} times in body text.` : `Keyword not found in content text.`,
    recommendation: 'Use the target keyword naturally throughout your article content.',
    fixActionLabel: 'Edit Content in WordPress Editor',
  });

  // Test 6: Content Word Count
  const isWordCountGood = wordCount >= 600;
  const wordCountScore = wordCount >= 800 ? 12 : wordCount >= 500 ? 8 : wordCount >= 300 ? 5 : 0;
  tests.push({
    id: 'content-length',
    category: 'basic',
    targetFieldId: 'guide-editor-content',
    title: 'Content Depth & Word Count',
    passed: isWordCountGood,
    score: wordCountScore,
    maxScore: 12,
    message: `Article has ${wordCount} words (${wordCount >= 800 ? 'Comprehensive depth' : wordCount >= 500 ? 'Good' : 'Needs expansion'}).`,
    recommendation: 'Aim for at least 600–1,000 words for competitive Google ranking.',
    fixActionLabel: 'Expand Content in Editor',
  });

  // Test 7: Keyword in Subheadings (H2, H3)
  const hasKwInSubheadings = keyword ? (
    sections.some((s) => Boolean(s.title && s.title.toLowerCase().includes(keyword))) ||
    (contentHtml.toLowerCase().includes('<h2') && contentHtml.toLowerCase().includes(keyword)) ||
    (contentHtml.toLowerCase().includes('<h3') && contentHtml.toLowerCase().includes(keyword))
  ) : false;
  tests.push({
    id: 'kw-in-headings',
    category: 'additional',
    targetFieldId: 'guide-editor-content',
    title: 'Focus Keyword in Subheadings (H2)',
    passed: hasKwInSubheadings,
    score: hasKwInSubheadings ? 8 : 0,
    maxScore: 8,
    message: hasKwInSubheadings ? `Focus keyword appears in at least one section subheading.` : `Keyword not found in subheadings.`,
    recommendation: 'Include your focus keyword in at least one H2 or H3 heading.',
    fixActionLabel: 'Add H2 Subheading',
  });

  // Test 8: Keyword Density
  const isDensityGood = keyword ? keywordDensity >= 0.8 && keywordDensity <= 2.8 : false;
  tests.push({
    id: 'kw-density',
    category: 'additional',
    targetFieldId: 'guide-field-keyword',
    title: 'Keyword Density (1% – 2.5%)',
    passed: isDensityGood,
    score: isDensityGood ? 6 : keywordDensity > 2.8 ? 2 : 1,
    maxScore: 6,
    message: `Keyword density is ${keywordDensity}% (${keywordOccurrences} mentions).`,
    recommendation: 'Maintain a natural 1.0% to 2.5% keyword density to avoid stuffing.',
    fixActionLabel: 'Adjust Target Keyword',
  });

  // Test 9: URL Slug Length
  const isSlugShort = slug.length > 0 && slug.length <= 75;
  tests.push({
    id: 'url-length',
    category: 'additional',
    targetFieldId: 'guide-field-slug',
    title: 'SEO Friendly URL Length',
    passed: isSlugShort,
    score: isSlugShort ? 4 : 0,
    maxScore: 4,
    message: `URL slug is ${slug.length} characters long.`,
    recommendation: 'Keep permalink slugs under 75 characters for optimal Google indexing.',
    fixActionLabel: 'Shorten Slug',
  });

  // Test 10: Internal Links
  const hasInternalLinks = intLinksCount > 0;
  tests.push({
    id: 'internal-links',
    category: 'additional',
    targetFieldId: 'guide-editor-content',
    title: 'Internal Links to Related Tools/Guides',
    passed: hasInternalLinks,
    score: hasInternalLinks ? 4 : 2,
    maxScore: 4,
    message: hasInternalLinks ? `${intLinksCount} internal tool/guide links found.` : `No internal links detected.`,
    recommendation: 'Add links pointing to related PRBSolver calculators or guides.',
    fixActionLabel: 'Insert Internal Link (🔗)',
  });

  // Test 11: External Links
  const hasExternalLinks = extLinksCount > 0;
  tests.push({
    id: 'external-links',
    category: 'additional',
    targetFieldId: 'guide-editor-content',
    title: 'External Resource Links',
    passed: hasExternalLinks,
    score: hasExternalLinks ? 4 : 2,
    maxScore: 4,
    message: hasExternalLinks ? `${extLinksCount} external references found.` : `Consider linking to an authority source.`,
    recommendation: 'Link to reputable financial or academic authority sources.',
    fixActionLabel: 'Insert External Link (🔗)',
  });

  // Test 12: Keyword Near Beginning of Title
  const hasKwAtStart = keyword ? title.toLowerCase().indexOf(keyword) === 0 || title.toLowerCase().indexOf(keyword) < 25 : false;
  tests.push({
    id: 'kw-at-start-title',
    category: 'title',
    targetFieldId: 'guide-field-title',
    title: 'Keyword Near Beginning of Title',
    passed: hasKwAtStart,
    score: hasKwAtStart ? 4 : 0,
    maxScore: 4,
    message: hasKwAtStart ? `Keyword is positioned near the front of the title.` : `Keyword appears late in the title.`,
    recommendation: 'Place your focus keyword within the first 30 characters of the title.',
    fixActionLabel: 'Move Keyword to Front',
  });

  // Test 13: Number in Title
  const hasNumberInTitle = /\d+/.test(title);
  tests.push({
    id: 'number-in-title',
    category: 'title',
    targetFieldId: 'guide-field-title',
    title: 'Number in Title for Higher CTR',
    passed: hasNumberInTitle,
    score: hasNumberInTitle ? 4 : 2,
    maxScore: 4,
    message: hasNumberInTitle ? `Title contains numerical value.` : `Adding a number (e.g. 2026, 5 Steps) boosts CTR.`,
    recommendation: 'Include a year (2026) or count of tips/steps in the title.',
    fixActionLabel: 'Add Number to Title',
  });

  // Test 14: Power Words in Title
  const powerWords = ['complete', 'best', 'guide', 'easy', 'step-by-step', 'formula', 'simple', 'fast', 'free', 'how to', 'ultimate', 'instant'];
  const hasPowerWord = powerWords.some((pw) => title.toLowerCase().includes(pw));
  tests.push({
    id: 'power-word-in-title',
    category: 'title',
    targetFieldId: 'guide-field-title',
    title: 'Power / Action Word in Title',
    passed: hasPowerWord,
    score: hasPowerWord ? 4 : 1,
    maxScore: 4,
    message: hasPowerWord ? `Compelling power words detected in title.` : `Add an action word like 'Complete', 'Best', or 'Fast'.`,
    recommendation: 'Use power words to increase click-through rates from search results.',
    fixActionLabel: 'Enhance Title',
  });

  // Test 15: Image with Keyword in Alt Text
  const imageTestPassed = hasImages && (hasKwInImgAlt || !keyword);
  tests.push({
    id: 'image-alt-kw',
    category: 'additional',
    targetFieldId: 'guide-editor-content',
    title: 'Images & Media with Alt Text',
    passed: Boolean(imageTestPassed),
    score: imageTestPassed ? 4 : hasImages ? 2 : 0,
    maxScore: 4,
    message: hasImages
      ? hasKwInImgAlt
        ? 'Image with focus keyword in ALT attribute found.'
        : 'Images found; consider adding focus keyword in ALT text.'
      : 'No images or diagrams found in content.',
    recommendation: 'Insert relevant charts or screenshots with descriptive ALT text.',
    fixActionLabel: 'Insert Image (🖼️)',
  });

  // Test 16: Quick Answer Box (Featured Snippet)
  const hasQuickAnswer = quickAnswer.length >= 40;
  tests.push({
    id: 'quick-answer',
    category: 'readability',
    targetFieldId: 'guide-field-quick-answer',
    title: 'Quick Answer / Featured Snippet Box',
    passed: hasQuickAnswer,
    score: hasQuickAnswer ? 4 : 0,
    maxScore: 4,
    message: hasQuickAnswer ? `Concise quick answer box provided (${quickAnswer.length} chars).` : `Quick answer box is empty or too short.`,
    recommendation: 'Provide a direct 1-sentence answer to win Position Zero on Google.',
    fixActionLabel: 'Fill Quick Answer Box',
  });

  // Test 17: Mathematical Formula or Structured Proof
  const hasFormula = Boolean(formula) || sections.some((s) => s.table || s.paragraphs.some((p) => p.includes('='))) || contentHtml.includes('=');
  tests.push({
    id: 'formula-present',
    category: 'readability',
    targetFieldId: 'guide-field-formula',
    title: 'Formula & Equation Defined',
    passed: hasFormula,
    score: hasFormula ? 4 : 0,
    maxScore: 4,
    message: hasFormula ? `Core formula or calculation rule detected.` : `No explicit formula or calculation expression found.`,
    recommendation: 'Include a clear mathematical formula block for reader utility.',
    fixActionLabel: 'Add Formula Box',
  });

  // Calculate overall score (capped at 100)
  const earnedScore = tests.reduce((sum, t) => sum + t.score, 0);
  const possibleScore = tests.reduce((sum, t) => sum + t.maxScore, 0);
  const overallScore = Math.min(100, Math.round((earnedScore / possibleScore) * 100));

  const passedCount = tests.filter((t) => t.passed).length;
  const issuesCount = tests.filter((t) => !t.passed).length;

  let grade: 'poor' | 'fair' | 'good' | 'great' | 'excellent' = 'poor';
  let gradeLabel = 'Needs Work';
  let gradeColor = '#EF4444'; // red

  if (overallScore >= 88) {
    grade = 'excellent';
    gradeLabel = 'Great SEO';
    gradeColor = '#10B981'; // emerald green
  } else if (overallScore >= 78) {
    grade = 'great';
    gradeLabel = 'Great SEO';
    gradeColor = '#10B981'; // emerald green
  } else if (overallScore >= 68) {
    grade = 'good';
    gradeLabel = 'Good SEO';
    gradeColor = '#3B82F6'; // blue
  } else if (overallScore >= 50) {
    grade = 'fair';
    gradeLabel = 'Fair SEO';
    gradeColor = '#F59E0B'; // amber
  }

  return {
    overallScore,
    grade,
    gradeLabel,
    gradeColor,
    passedCount,
    issuesCount,
    totalCount: tests.length,
    wordCount,
    readingTimeText,
    keywordDensity,
    keywordCount: keywordOccurrences,
    headingsSummary,
    h1Count: Math.max(1, h1Count),
    h2Count,
    linksSummary,
    intLinksCount,
    extLinksCount,
    tests,
  };
}

/**
 * 1-Click Migration and Cleanup SQL:
 * Renames 'guids' to 'guides' and 'guids-comment' to 'guide_comments' without losing any data!
 */
export const SUPABASE_GUIDES_CLEANUP_SQL = `-- =========================================================================
-- PRBSOLVER SUPABASE: 1-CLICK CLEANUP & RENAME SCRIPT
-- Run this in Supabase -> SQL Editor if you created 'guids' or 'guids-comment'
-- =========================================================================

-- 1. Safely rename table 'guids' to standard 'guides' if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guids') THEN
    ALTER TABLE public."guids" RENAME TO guides;
  END IF;
END $$;

-- 2. Safely rename 'guids-comment' or 'guids_comment' to standard 'guide_comments'
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guids-comment') THEN
    ALTER TABLE public."guids-comment" RENAME TO guide_comments;
  ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guids_comment') THEN
    ALTER TABLE public."guids_comment" RENAME TO guide_comments;
  END IF;
END $$;

-- 3. Ensure content_html column exists in guides
ALTER TABLE IF EXISTS public.guides ADD COLUMN IF NOT EXISTS content_html TEXT;

-- 4. Enable Row Level Security (RLS) & Grant full permissions to client
ALTER TABLE IF EXISTS public.guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on guides" ON public.guides;
CREATE POLICY "Allow anon all on guides" ON public.guides FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.guide_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on guide_comments" ON public.guide_comments;
CREATE POLICY "Allow anon all on guide_comments" ON public.guide_comments FOR ALL USING (true) WITH CHECK (true);
`;

export const SUPABASE_GUIDES_SQL = `-- =========================================================================
-- PRBSOLVER SUPABASE FULL PRODUCTION SCHEMA: GUIDES & COMMENTS
-- Run this in your Supabase SQL Editor (supabase.com -> SQL Editor -> New Query)
-- =========================================================================

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
    content_html TEXT,
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

-- Ensure content_html column exists if table was already created
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS content_html TEXT;

CREATE INDEX IF NOT EXISTS idx_guides_slug ON public.guides(slug);
CREATE INDEX IF NOT EXISTS idx_guides_category ON public.guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON public.guides(created_at DESC);

-- Enable RLS and grant open read/write/delete permissions for the frontend client
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published guides" ON public.guides;
DROP POLICY IF EXISTS "Service role full access to guides" ON public.guides;
DROP POLICY IF EXISTS "Allow anon all on guides" ON public.guides;

CREATE POLICY "Allow anon all on guides"
    ON public.guides
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Reader Comments table for guide interactions
CREATE TABLE IF NOT EXISTS public.guide_comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    guide_slug TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,
    rating INTEGER DEFAULT 5,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    likes INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_guide_comments_slug ON public.guide_comments(guide_slug);

ALTER TABLE public.guide_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on guide_comments" ON public.guide_comments;

CREATE POLICY "Allow anon all on guide_comments"
    ON public.guide_comments
    FOR ALL
    USING (true)
    WITH CHECK (true);
`;
