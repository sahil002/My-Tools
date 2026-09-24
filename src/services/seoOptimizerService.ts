/**
 * SEO Optimizer Service (RankMath-style Content Analysis)
 * Analyzes content, focus keywords, headings, readability, links, and metadata.
 */

export interface SeoCheckItem {
  id: string;
  category: 'basic' | 'additional' | 'title' | 'readability';
  label: string;
  status: 'good' | 'warning' | 'bad';
  scoreImpact: number; // Max points this test contributes
  scoreEarned: number;
  currentValue: string | number;
  targetValue?: string;
  suggestion: string;
}

export interface SeoAnalysisResult {
  overallScore: number; // 0 - 100
  scoreTier: 'good' | 'warning' | 'bad';
  checks: SeoCheckItem[];
  stats: {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    avgSentenceWords: number;
    readingTimeMinutes: number;
    keywordOccurrences: number;
    keywordDensity: number; // percentage e.g. 1.4
    h1Count: number;
    h2Count: number;
    h3Count: number;
    internalLinksCount: number;
    externalLinksCount: number;
    totalImagesCount: number;
    imagesWithAltCount: number;
    imagesWithKeywordInAltCount: number;
    passiveVoiceOccurrences: number;
    longParagraphsCount: number;
  };
  flaggedLines: {
    lineNumber?: number;
    snippet: string;
    issue: string;
    suggestion: string;
  }[];
}

export interface AutoOptimizationSuggestions {
  suggestedTitle?: string;
  suggestedMetaDescription?: string;
  suggestedSlug?: string;
  suggestedH1?: string;
  suggestedFirstSentence?: string;
  lineImprovements: {
    original: string;
    recommended: string;
    reason: string;
  }[];
}

export interface PageDocument {
  id: string;
  type: 'post' | 'tool' | 'page';
  name: string;
  slug: string;
  urlExample: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  contentHtml: string;
  lastUpdated: string;
  isPublished: boolean;
}

const STORAGE_KEY = 'ot_seo_optimizer_documents';

/**
 * Baseline initial templates based on actual site content
 */
export const DEFAULT_PAGE_DOCUMENTS: PageDocument[] = [
  {
    id: 'guide-how-to-calculate-percentage',
    type: 'post',
    name: 'Guide: How to Calculate Percentage',
    slug: 'how-to-calculate-percentage',
    urlExample: '/guides/how-to-calculate-percentage',
    focusKeyword: 'calculate percentage',
    metaTitle: 'How to Calculate Percentage: The Complete Step-by-Step Guide',
    metaDescription: 'Learn how to calculate percentages, percentage increases, discounts, and percentage differences with practical formulas and clear examples.',
    contentHtml: `<h1>How to Calculate Percentage: The Complete Step-by-Step Guide</h1>
<p>Learning how to <strong>calculate percentage</strong> values is an essential skill for personal finance, retail shopping, academic coursework, and business analysis. In mathematical terms, a percentage is a dimensionless ratio where the denominator is fixed at 100.</p>
<h2>Understanding What a Percentage Actually Is</h2>
<p>The word "percent" stems from the Latin "per centum", which translates directly to "by the hundred". Using a standardized scale of 100 makes it straightforward to compare proportional sizes without confusion.</p>
<h2>The Three Fundamental Calculation Scenarios</h2>
<p>In everyday life, you will almost always encounter one of three standard percentage formulas:</p>
<ul>
  <li>Finding a percentage of a given number (e.g. 20% of $80)</li>
  <li>Finding what percentage one number is of another (e.g. 42 out of 50)</li>
  <li>Finding the percentage increase or discount difference between two values</li>
</ul>
<h2>Practical Example: Store Discount Calculation</h2>
<p>Consider a winter jacket with an original retail price of $160 marked down by 25%. To calculate the final price, convert 25% into decimal 0.25, multiply $160 by 0.25 to get a $40 discount, and subtract it to arrive at $120.</p>
<img src="/assets/percentage-formula-diagram.svg" alt="How to calculate percentage formula breakdown diagram" />
<p>For more interactive calculations, check our <a href="/tools/percentage-calculator">percentage calculator tool</a> or explore external references on <a href="https://en.wikipedia.org/wiki/Percentage" target="_blank" rel="noopener noreferrer">Wikipedia mathematical percentages</a>.</p>`,
    lastUpdated: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: 'guide-word-count-for-writers',
    type: 'post',
    name: 'Guide: Word Count Guide for Writers',
    slug: 'word-count-guide-for-writers',
    urlExample: '/guides/word-count-guide-for-writers',
    focusKeyword: 'word count guide',
    metaTitle: 'Word Count Guide for Writers: Standards Across Books and Essays',
    metaDescription: 'Comprehensive word count guide for authors and essayists covering industry standards for novels, short stories, academic dissertations, and SEO articles.',
    contentHtml: `<h1>Word Count Guide for Writers: Industry Standards</h1>
<p>This definitive <strong>word count guide</strong> details established publisher benchmarks across literary fiction, commercial non-fiction, blog articles, and college papers.</p>
<h2>Why Target Length Matters</h2>
<p>Publishers enforce strict volume benchmarks because printing economics, shelf footprint, and reader attention spans dictate pricing formulas.</p>
<h2>Standard Novel Benchmarks</h2>
<p>Standard commercial novels typically span 80,000 to 100,000 words. Debut authors are advised to stay under 95,000 words to improve acquisition odds.</p>
<p>Test your draft in real-time with our online <a href="/tools/word-counter">word counter tool</a>.</p>`,
    lastUpdated: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: 'tool-word-counter',
    type: 'tool',
    name: 'Tool: Online Word Counter',
    slug: 'word-counter',
    urlExample: '/tools/word-counter',
    focusKeyword: 'online word counter',
    metaTitle: 'Free Online Word Counter: Character, Word & Reading Time Tool',
    metaDescription: 'Count words, characters, sentences, paragraphs, and estimated reading time in real-time with our free client-side online word counter utility.',
    contentHtml: `<h1>Online Word Counter and Text Statistics Tool</h1>
<p>Our free <strong>online word counter</strong> provides instant character counts, sentence statistics, readability estimates, and keyword density metrics without transmitting your data anywhere.</p>
<h2>Key Metrics Calculated</h2>
<p>The tool measures total words, character count with and without spaces, reading duration at 200 WPM, and speech pace at 130 WPM.</p>`,
    lastUpdated: new Date().toISOString(),
    isPublished: true,
  },
  {
    id: 'page-homepage',
    type: 'page',
    name: 'Page: Homepage Root',
    slug: '',
    urlExample: '/',
    focusKeyword: 'free online tools',
    metaTitle: 'Free Online Tools: Fast, Accurate & Ad-Free Privacy-First Utilities',
    metaDescription: 'Directory of fast, private online calculators, text utilities, and conversion tools running 100% in your browser without tracking or delays.',
    contentHtml: `<h1>Free Online Tools Directory</h1>
<p>Discover dozens of fast, privacy-respecting <strong>free online tools</strong> designed for students, developers, and writers.</p>
<h2>Explore Popular Categories</h2>
<p>Browse math calculators, finance estimators, and text manipulation utilities.</p>`,
    lastUpdated: new Date().toISOString(),
    isPublished: true,
  },
];

/**
 * Strip HTML tags to get raw plain text
 */
export function extractPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Comprehensive SEO Content Analysis Engine
 */
export function analyzeContent(params: {
  title: string;
  metaDescription: string;
  slug: string;
  contentHtml: string;
  focusKeyword: string;
}): SeoAnalysisResult {
  const { title, metaDescription, slug, contentHtml, focusKeyword } = params;
  const kwLower = (focusKeyword || '').trim().toLowerCase();
  const kwWords = kwLower.split(/\s+/).filter(Boolean);

  const plainText = extractPlainText(contentHtml);
  const plainWords = plainText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const totalWords = plainWords.length;
  const totalChars = plainText.length;

  // Sentences calculation
  const sentences = plainText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
  const totalSentences = Math.max(1, sentences.length);
  const avgSentenceWords = Math.round((totalWords / totalSentences) * 10) / 10;
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

  // Keyword count & density
  let keywordOccurrences = 0;
  if (kwLower) {
    // Regex match keyword as phrase
    const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = plainText.match(new RegExp(`\\b${escaped}\\b`, 'gi'));
    keywordOccurrences = matches ? matches.length : 0;
  }
  const keywordDensity =
    totalWords > 0 && kwWords.length > 0
      ? Math.round(((keywordOccurrences * kwWords.length) / totalWords) * 100 * 10) / 10
      : 0;

  // HTML Headings analysis
  const h1Matches = contentHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2Matches = contentHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3Matches = contentHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];

  const h1Text = h1Matches.map((h) => extractPlainText(h)).join(' ');
  const h2Text = h2Matches.map((h) => extractPlainText(h)).join(' ');

  // First paragraph analysis
  const pMatches = contentHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const firstParagraph = pMatches.length > 0 && pMatches[0] ? extractPlainText(pMatches[0]) : plainText.slice(0, 300);

  // Images analysis
  const imgMatches = contentHtml.match(/<img[^>]*>/gi) || [];
  const totalImagesCount = imgMatches.length;
  let imagesWithAltCount = 0;
  let imagesWithKeywordInAltCount = 0;

  imgMatches.forEach((imgTag) => {
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
    if (altMatch && altMatch[1] && altMatch[1].trim().length > 0) {
      imagesWithAltCount++;
      if (kwLower && altMatch[1].toLowerCase().includes(kwLower)) {
        imagesWithKeywordInAltCount++;
      }
    }
  });

  // Links analysis
  const linkMatches = contentHtml.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  let internalLinksCount = 0;
  let externalLinksCount = 0;

  linkMatches.forEach((linkTag) => {
    const hrefMatch = linkTag.match(/href=["']([^"']*)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      const href = hrefMatch[1];
      if (href.startsWith('http://') || href.startsWith('https://')) {
        externalLinksCount++;
      } else if (href.startsWith('/') || href.startsWith('#')) {
        internalLinksCount++;
      }
    }
  });

  // Passive voice detection heuristics
  const passiveRegex = /\b(is|are|was|were|been|being)\s+([a-z]+ed|[a-z]+en)\b/gi;
  const passiveMatches = plainText.match(passiveRegex) || [];
  const passiveVoiceOccurrences = passiveMatches.length;

  // Paragraph lengths
  let longParagraphsCount = 0;
  pMatches.forEach((p) => {
    const pText = extractPlainText(p);
    const pWords = pText.split(/\s+/).filter(Boolean).length;
    if (pWords > 120) {
      longParagraphsCount++;
    }
  });

  // Flagged line snippets for Auto-Optimizer
  const flaggedLines: SeoAnalysisResult['flaggedLines'] = [];

  // Flag long sentences (> 25 words)
  sentences.forEach((s, idx) => {
    const sWords = s.split(/\s+/).filter(Boolean).length;
    if (sWords > 25 && flaggedLines.length < 4) {
      flaggedLines.push({
        lineNumber: idx + 1,
        snippet: s.slice(0, 80) + (s.length > 80 ? '...' : ''),
        issue: `Sentence is excessively long (${sWords} words).`,
        suggestion: 'Split into two clearer sentences to boost readability.',
      });
    }
  });

  // Checks evaluation
  const checks: SeoCheckItem[] = [];

  // 1. Focus Keyword in Title
  const hasKwInTitle = kwLower ? title.toLowerCase().includes(kwLower) : false;
  checks.push({
    id: 'kw-in-title',
    category: 'basic',
    label: 'Focus Keyword in Meta Title',
    status: hasKwInTitle ? 'good' : 'bad',
    scoreImpact: 10,
    scoreEarned: hasKwInTitle ? 10 : 0,
    currentValue: hasKwInTitle ? 'Present' : 'Missing',
    suggestion: hasKwInTitle
      ? 'Great! The focus keyword appears in the SEO title.'
      : `Add "${focusKeyword}" into the meta title, preferably near the beginning.`,
  });

  // 2. Focus Keyword in Meta Description
  const hasKwInMetaDesc = kwLower ? metaDescription.toLowerCase().includes(kwLower) : false;
  checks.push({
    id: 'kw-in-meta-desc',
    category: 'basic',
    label: 'Focus Keyword in Meta Description',
    status: hasKwInMetaDesc ? 'good' : 'bad',
    scoreImpact: 10,
    scoreEarned: hasKwInMetaDesc ? 10 : 0,
    currentValue: hasKwInMetaDesc ? 'Present' : 'Missing',
    suggestion: hasKwInMetaDesc
      ? 'The focus keyword is present in the meta description.'
      : `Include the keyword "${focusKeyword}" in the meta description snippet.`,
  });

  // 3. Focus Keyword in First Paragraph
  const hasKwInFirstP = kwLower ? firstParagraph.toLowerCase().includes(kwLower) : false;
  checks.push({
    id: 'kw-in-first-p',
    category: 'basic',
    label: 'Focus Keyword in First Paragraph',
    status: hasKwInFirstP ? 'good' : 'bad',
    scoreImpact: 10,
    scoreEarned: hasKwInFirstP ? 10 : 0,
    currentValue: hasKwInFirstP ? 'Present' : 'Missing',
    suggestion: hasKwInFirstP
      ? 'Focus keyword is naturally established in the introduction.'
      : `Introduce "${focusKeyword}" within the first 10% of the content.`,
  });

  // 4. Focus Keyword in H1
  const hasKwInH1 = kwLower ? h1Text.toLowerCase().includes(kwLower) : false;
  checks.push({
    id: 'kw-in-h1',
    category: 'basic',
    label: 'Focus Keyword in Primary Heading (H1)',
    status: hasKwInH1 ? 'good' : 'bad',
    scoreImpact: 10,
    scoreEarned: hasKwInH1 ? 10 : 0,
    currentValue: hasKwInH1 ? 'Present' : 'Missing',
    suggestion: hasKwInH1
      ? 'Focus keyword is included in the H1 tag.'
      : `Ensure your primary H1 heading contains "${focusKeyword}".`,
  });

  // 5. Focus Keyword in URL / Slug
  const cleanSlug = (slug || '').toLowerCase().replace(/[-_]/g, ' ');
  const hasKwInSlug = kwLower ? kwWords.every((w) => cleanSlug.includes(w)) : false;
  checks.push({
    id: 'kw-in-slug',
    category: 'basic',
    label: 'Focus Keyword in URL Slug',
    status: hasKwInSlug ? 'good' : 'bad',
    scoreImpact: 8,
    scoreEarned: hasKwInSlug ? 8 : 0,
    currentValue: hasKwInSlug ? 'Present' : 'Missing',
    suggestion: hasKwInSlug
      ? 'The permalink URL contains your target focus keyword.'
      : `Incorporate "${focusKeyword}" cleanly into the URL path slug.`,
  });

  // 6. Content Length Check
  let lengthStatus: 'good' | 'warning' | 'bad' = 'bad';
  let lengthScore = 0;
  if (totalWords >= 600) {
    lengthStatus = 'good';
    lengthScore = 12;
  } else if (totalWords >= 300) {
    lengthStatus = 'warning';
    lengthScore = 7;
  } else {
    lengthStatus = 'bad';
    lengthScore = 2;
  }
  checks.push({
    id: 'content-length',
    category: 'additional',
    label: 'Content Word Count',
    status: lengthStatus,
    scoreImpact: 12,
    scoreEarned: lengthScore,
    currentValue: `${totalWords} words`,
    targetValue: '600+ words',
    suggestion:
      lengthStatus === 'good'
        ? `Comprehensive length (${totalWords} words). Well detailed for search engines.`
        : lengthStatus === 'warning'
        ? 'Moderate length (300–599 words). Expanding with extra examples or FAQs will improve rankings.'
        : 'Thin content (< 300 words). Add more valuable context, steps, and explanations.',
  });

  // 7. Heading Structure Check (H1/H2/H3 Hierarchy)
  let headingStatus: 'good' | 'warning' | 'bad' = 'good';
  let headingScore = 8;
  let headingSuggestion = 'Heading structure is logical (single H1 with subheadings).';

  if (h1Matches.length === 0) {
    headingStatus = 'bad';
    headingScore = 0;
    headingSuggestion = 'Missing H1 heading. Add exactly one top-level H1.';
  } else if (h1Matches.length > 1) {
    headingStatus = 'warning';
    headingScore = 4;
    headingSuggestion = `Found ${h1Matches.length} H1 headings. Best practice is exactly one H1 per page.`;
  } else if (h2Matches.length === 0 && totalWords > 200) {
    headingStatus = 'warning';
    headingScore = 4;
    headingSuggestion = 'No H2 subheadings found. Break your content into structured sections.';
  }

  checks.push({
    id: 'heading-structure',
    category: 'additional',
    label: 'Heading Structure & Hierarchy',
    status: headingStatus,
    scoreImpact: 8,
    scoreEarned: headingScore,
    currentValue: `H1: ${h1Matches.length} | H2: ${h2Matches.length} | H3: ${h3Matches.length}`,
    suggestion: headingSuggestion,
  });

  // 8. Keyword Density Check
  let densityStatus: 'good' | 'warning' | 'bad' = 'good';
  let densityScore = 10;
  let densitySuggestion = `Keyword density is optimal at ${keywordDensity}%.`;

  if (keywordOccurrences === 0) {
    densityStatus = 'bad';
    densityScore = 0;
    densitySuggestion = `Keyword "${focusKeyword}" was not found in the body text.`;
  } else if (keywordDensity < 0.6) {
    densityStatus = 'warning';
    densityScore = 5;
    densitySuggestion = `Keyword density is low (${keywordDensity}%). Mention "${focusKeyword}" 1 or 2 more times.`;
  } else if (keywordDensity > 2.8) {
    densityStatus = 'warning';
    densityScore = 4;
    densitySuggestion = `Keyword density is high (${keywordDensity}%). Beware of keyword stuffing penalties.`;
  }

  checks.push({
    id: 'keyword-density',
    category: 'additional',
    label: 'Keyword Density',
    status: densityStatus,
    scoreImpact: 10,
    scoreEarned: densityScore,
    currentValue: `${keywordDensity}% (${keywordOccurrences}x)`,
    targetValue: '0.8% - 2.5%',
    suggestion: densitySuggestion,
  });

  // 9. Readability Check (Sentence length, paragraph length, passive voice)
  let readStatus: 'good' | 'warning' | 'bad' = 'good';
  let readScore = 10;
  let readSuggestion = 'Readability is strong. Sentences and paragraphs are concise.';

  if (avgSentenceWords > 22 || longParagraphsCount > 2) {
    readStatus = 'warning';
    readScore = 5;
    readSuggestion = `Average sentence length is ${avgSentenceWords} words, and ${longParagraphsCount} paragraphs exceed 120 words. Consider shortening them.`;
  } else if (passiveVoiceOccurrences > 6) {
    readStatus = 'warning';
    readScore = 6;
    readSuggestion = `Detected ${passiveVoiceOccurrences} instances of passive voice. Use active verbs where possible.`;
  }

  checks.push({
    id: 'readability-check',
    category: 'readability',
    label: 'Content Readability & Flow',
    status: readStatus,
    scoreImpact: 10,
    scoreEarned: readScore,
    currentValue: `Avg ${avgSentenceWords} words/sentence`,
    targetValue: '< 20 words/sentence',
    suggestion: readSuggestion,
  });

  // 10. Image Alt Text Check
  let imageStatus: 'good' | 'warning' | 'bad' = 'good';
  let imageScore = 6;
  let imageSuggestion = 'Images include descriptive alt text.';

  if (totalImagesCount === 0) {
    imageStatus = 'warning';
    imageScore = 3;
    imageSuggestion = 'Consider adding an illustrative diagram or chart to enrich visual engagement.';
  } else if (imagesWithAltCount < totalImagesCount) {
    imageStatus = 'bad';
    imageScore = 1;
    imageSuggestion = `${totalImagesCount - imagesWithAltCount} image(s) lack alt text descriptions.`;
  } else if (kwLower && imagesWithKeywordInAltCount === 0) {
    imageStatus = 'warning';
    imageScore = 4;
    imageSuggestion = `Include "${focusKeyword}" in at least one image alt tag attribute.`;
  }

  checks.push({
    id: 'image-alt-text',
    category: 'additional',
    label: 'Image Alt Attributes',
    status: imageStatus,
    scoreImpact: 6,
    scoreEarned: imageScore,
    currentValue: `${imagesWithAltCount}/${totalImagesCount} with Alt`,
    suggestion: imageSuggestion,
  });

  // 11. Internal & External Links Check
  let linkStatus: 'good' | 'warning' | 'bad' = 'good';
  let linkScore = 8;
  let linkSuggestion = 'Healthy linking structure with internal and external citations.';

  if (internalLinksCount === 0 && externalLinksCount === 0) {
    linkStatus = 'bad';
    linkScore = 0;
    linkSuggestion = 'Add at least 1 internal link to related tools and 1 authoritative external reference.';
  } else if (internalLinksCount === 0) {
    linkStatus = 'warning';
    linkScore = 4;
    linkSuggestion = 'Add internal links connecting this page to related tools or guide articles.';
  } else if (externalLinksCount === 0) {
    linkStatus = 'warning';
    linkScore = 5;
    linkSuggestion = 'Link out to at least 1 reputable educational or standard reference.';
  }

  checks.push({
    id: 'links-count',
    category: 'additional',
    label: 'Internal & External Links',
    status: linkStatus,
    scoreImpact: 8,
    scoreEarned: linkScore,
    currentValue: `${internalLinksCount} Internal | ${externalLinksCount} External`,
    suggestion: linkSuggestion,
  });

  // 12. Meta Title Length Check
  const titleLen = title.length;
  let titleStatus: 'good' | 'warning' | 'bad' = 'good';
  let titleScore = 4;
  let titleSuggestion = 'Title length is in the optimal 40–60 character range.';

  if (titleLen === 0) {
    titleStatus = 'bad';
    titleScore = 0;
    titleSuggestion = 'Meta title is empty.';
  } else if (titleLen < 35) {
    titleStatus = 'warning';
    titleScore = 2;
    titleSuggestion = `Title is short (${titleLen} chars). Expand to 45–60 characters to maximize SERP CTR.`;
  } else if (titleLen > 65) {
    titleStatus = 'warning';
    titleScore = 2;
    titleSuggestion = `Title is long (${titleLen} chars). Google may truncate it after ~60 characters.`;
  }

  checks.push({
    id: 'meta-title-length',
    category: 'title',
    label: 'Meta Title Length',
    status: titleStatus,
    scoreImpact: 4,
    scoreEarned: titleScore,
    currentValue: `${titleLen} characters`,
    targetValue: '45–60 chars',
    suggestion: titleSuggestion,
  });

  // 13. Meta Description Length Check
  const descLen = metaDescription.length;
  let descStatus: 'good' | 'warning' | 'bad' = 'good';
  let descScore = 4;
  let descSuggestion = 'Meta description length is ideal (120–160 characters).';

  if (descLen === 0) {
    descStatus = 'bad';
    descScore = 0;
    descSuggestion = 'Meta description is missing.';
  } else if (descLen < 90) {
    descStatus = 'warning';
    descScore = 2;
    descSuggestion = `Description is too brief (${descLen} chars). Elaborate with key user benefits.`;
  } else if (descLen > 165) {
    descStatus = 'warning';
    descScore = 2;
    descSuggestion = `Description is long (${descLen} chars) and may get cut off on mobile search results.`;
  }

  checks.push({
    id: 'meta-desc-length',
    category: 'title',
    label: 'Meta Description Length',
    status: descStatus,
    scoreImpact: 4,
    scoreEarned: descScore,
    currentValue: `${descLen} characters`,
    targetValue: '120–160 chars',
    suggestion: descSuggestion,
  });

  // Calculate Overall Score (sum of earned vs max 100)
  const totalEarned = checks.reduce((acc, c) => acc + c.scoreEarned, 0);
  const totalMax = checks.reduce((acc, c) => acc + c.scoreImpact, 0);
  const overallScore = Math.min(100, Math.round((totalEarned / totalMax) * 100));

  let scoreTier: 'good' | 'warning' | 'bad' = 'bad';
  if (overallScore >= 80) scoreTier = 'good';
  else if (overallScore >= 50) scoreTier = 'warning';

  return {
    overallScore,
    scoreTier,
    checks,
    stats: {
      wordCount: totalWords,
      charCount: totalChars,
      sentenceCount: totalSentences,
      avgSentenceWords,
      readingTimeMinutes,
      keywordOccurrences,
      keywordDensity,
      h1Count: h1Matches.length,
      h2Count: h2Matches.length,
      h3Count: h3Matches.length,
      internalLinksCount,
      externalLinksCount,
      totalImagesCount,
      imagesWithAltCount,
      imagesWithKeywordInAltCount,
      passiveVoiceOccurrences,
      longParagraphsCount,
    },
    flaggedLines,
  };
}

/**
 * Generate Auto-Optimize Suggestions without overwriting content silently
 */
export function generateAutoOptimizations(params: {
  title: string;
  metaDescription: string;
  slug: string;
  contentHtml: string;
  focusKeyword: string;
}): AutoOptimizationSuggestions {
  const { title, metaDescription, slug, contentHtml, focusKeyword } = params;
  const kwClean = (focusKeyword || '').trim();
  const kwCapitalized = kwClean
    ? kwClean
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '';

  let suggestedTitle: string | undefined;
  if (!title.toLowerCase().includes(kwClean.toLowerCase())) {
    suggestedTitle = `${kwCapitalized}: Complete Guide & Free Online Calculator`;
    if (suggestedTitle.length > 60) {
      suggestedTitle = `${kwCapitalized}: Practical Guide & Steps`;
    }
  } else if (title.length < 35) {
    suggestedTitle = `${title} — Complete Step-by-Step Overview`;
  } else if (title.length > 65) {
    suggestedTitle = title.slice(0, 57).trim() + '...';
  }

  let suggestedMetaDescription: string | undefined;
  if (!metaDescription.toLowerCase().includes(kwClean.toLowerCase()) || metaDescription.length < 90) {
    suggestedMetaDescription = `Learn how to ${kwClean.toLowerCase()} with accurate formulas, step-by-step calculations, practical examples, and interactive online tools.`;
  } else if (metaDescription.length > 165) {
    suggestedMetaDescription = metaDescription.slice(0, 155).trim() + '...';
  }

  let suggestedSlug: string | undefined;
  if (kwClean && !slug.toLowerCase().includes(kwClean.toLowerCase().replace(/\s+/g, '-'))) {
    suggestedSlug = kwClean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const lineImprovements: AutoOptimizationSuggestions['lineImprovements'] = [];

  // Check first paragraph
  const pMatch = contentHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (pMatch && pMatch[1]) {
    const rawP = extractPlainText(pMatch[1]);
    if (kwClean && !rawP.toLowerCase().includes(kwClean.toLowerCase())) {
      lineImprovements.push({
        original: rawP.slice(0, 100) + '...',
        recommended: `When you need to ${kwClean.toLowerCase()}, having a reliable method is critical. ` + rawP,
        reason: 'Adds focus keyword into the opening paragraph for immediate search intent match.',
      });
    }
  }

  return {
    suggestedTitle,
    suggestedMetaDescription,
    suggestedSlug,
    lineImprovements,
  };
}

/**
 * Storage helpers to retrieve and persist page documents
 */
export function getPageDocuments(): PageDocument[] {
  if (typeof window === 'undefined') return DEFAULT_PAGE_DOCUMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAGE_DOCUMENTS));
      return DEFAULT_PAGE_DOCUMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PAGE_DOCUMENTS;
  } catch {
    return DEFAULT_PAGE_DOCUMENTS;
  }
}

export function savePageDocument(doc: PageDocument): void {
  if (typeof window === 'undefined') return;
  const docs = getPageDocuments();
  const existingIdx = docs.findIndex((d) => d.id === doc.id);
  doc.lastUpdated = new Date().toISOString();
  if (existingIdx >= 0) {
    docs[existingIdx] = doc;
  } else {
    docs.unshift(doc);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Failed to save document:', err);
  }
}
