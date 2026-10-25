import { useState, useEffect, useRef } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FAQAccordion } from '../components/FAQAccordion';
import { ToolCard } from '../components/ToolCard';
import { GuideCard } from '../components/GuideCard';
import { SEOHelmet } from '../components/SEOHelmet';
import { ShareButton } from '../components/ShareModal';
import { ReportIssueModal } from '../components/ReportIssueModal';
import { AdSlotPlaceholder } from '../components/AdSlotPlaceholder';
import { Link } from '../context/RouterContext';
import { getToolBySlug, TOOLS } from '../data/tools';
import { getAllMergedGuidesSync, syncGuidesFromSupabase, GUIDES_UPDATED_EVENT } from '../services/guideStorageDB';
import { getCategoryBySlug } from '../data/categories';
import { PercentageCalculator } from '../components/tools/PercentageCalculator';
import { AgeCalculator } from '../components/tools/AgeCalculator';
import { WordCounter } from '../components/tools/WordCounter';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Heart,
  ArrowDown,
  Sparkles,
  Calculator,
  Code2,
  Copy,
  Check,
  CheckCircle,
  ExternalLink,
  Table,
  Lightbulb,
} from 'lucide-react';
import { getDBCustomToolBySlug, getDBStatusOverrides, DBToolRecord } from '../services/toolStorageDB';
import { recordToolView } from '../services/toolAnalyticsService';
import { ToolCommentsSection } from '../components/tools/ToolCommentsSection';
import { ToolItem } from '../types';
import { getSiteUrl } from '../data/siteConfig';
import { getCategoryTheme } from '../utils/categoryColors';
import {
  isToolFavorited,
  toggleToolFavorite,
  FAVORITES_UPDATED_EVENT,
} from '../services/userFavoritesService';
import { getStandardizedToolContent, ToolFormulaData } from '../services/toolContentEngine';

interface ToolViewProps {
  toolSlug: string;
}

export function ToolView({ toolSlug }: ToolViewProps) {
  const [customTool, setCustomTool] = useState<DBToolRecord | null>(null);
  const [availableGuides, setAvailableGuides] = useState(() => getAllMergedGuidesSync());
  const [, setStatusOverrides] = useState<Record<string, 'active' | 'inactive'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number>(550);
  const [customToolHtml, setCustomToolHtml] = useState<string>('');
  const [customToolHtmlError, setCustomToolHtmlError] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const lastHeightRef = useRef<number>(550);
  const toolIframeRef = useRef<HTMLIFrameElement | null>(null);
  const isEmbedMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === 'true';

  // Let a parent website resize its embed when the uploaded calculator reports a new height.
  useEffect(() => {
    if (!isEmbedMode || typeof window === 'undefined' || window.parent === window) return;
    window.parent.postMessage(
      { type: 'OT_EMBED_RESIZE', height: Math.max(420, Math.min(25000, iframeHeight + 24)) },
      '*'
    );
  }, [iframeHeight, isEmbedMode]);

  // Auto-resize listener for seamless embedded tool height with anti-vibration damping
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== toolIframeRef.current?.contentWindow) return;
      if (event.data && event.data.type === 'OT_EMBED_RESIZE' && typeof event.data.height === 'number') {
        const rawH = event.data.height;
        const targetH = Math.max(350, Math.min(25000, Math.ceil(rawH)));
        if (Math.abs(targetH - lastHeightRef.current) >= 8) {
          lastHeightRef.current = targetH;
          setIframeHeight(targetH);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setCustomToolHtml('');
    setCustomToolHtmlError(false);
    recordToolView(toolSlug);
    Promise.all([
      getDBCustomToolBySlug(toolSlug),
      getDBStatusOverrides(),
    ])
      .then(([custom, overrides]) => {
        if (!isMounted) return;
        setCustomTool(custom);
        setStatusOverrides(overrides);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load tool metadata:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [toolSlug]);

  // Load published guides from Supabase so custom uploaded guides can appear
  // in related-content sections without requiring a code deployment for each guide.
  useEffect(() => {
    let active = true;
    const refreshGuides = () => setAvailableGuides(getAllMergedGuidesSync());
    refreshGuides();
    window.addEventListener(GUIDES_UPDATED_EVENT, refreshGuides);
    void syncGuidesFromSupabase().then(() => {
      if (active) refreshGuides();
    });
    return () => {
      active = false;
      window.removeEventListener(GUIDES_UPDATED_EVENT, refreshGuides);
    };
  }, []);

  // Some uploaded HTML objects were stored with a text/plain MIME type.
  // Fetch their source and render it as a sandboxed document so browsers parse the HTML.
  useEffect(() => {
    let cancelled = false;
    const url = customTool?.storageUrl;
    if (!url) {
      setCustomToolHtml('');
      setCustomToolHtmlError(false);
      return;
    }

    const loadHtml = async () => {
      try {
        const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' });
        if (!response.ok) throw new Error(`Unable to load uploaded tool HTML (${response.status}).`);
        const html = await response.text();
        if (!html.trim().toLowerCase().startsWith('<!doctype html') && !html.trim().toLowerCase().startsWith('<html')) {
          throw new Error('The uploaded tool file did not contain an HTML document.');
        }
        if (!cancelled) {
          // Keep relative URLs working for any assets not inlined into index.html.
          // Relative assets resolve from the uploaded bundle directory, not from index.html itself.
          const assetBaseUrl = new URL('.', url).href;
          const baseTag = `<base href="${assetBaseUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
          let withBase = /<head\b[^>]*>/i.test(html)
            ? html.replace(/<head\b[^>]*>/i, (head) => head + baseTag)
            : html.replace(/<html\b[^>]*>/i, (root) => root + '<head>' + baseTag + '</head>');

          // Ensure the iframe uses the real device width. Without this meta tag,
          // mobile media queries may behave as if the viewport were ~980px wide.
          const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
          withBase = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i.test(withBase)
            ? withBase.replace(/<meta\s+[^>]*name=["']viewport["'][^>]*>/i, viewportTag)
            : withBase.replace(/<head\b[^>]*>/i, (head) => head + viewportTag);

          // Mobile-only layout corrections for the Compound Interest Calculator.
          // Keep desktop styling and all calculator behavior unchanged.
          if (toolSlug === 'compound-interest-calculator') {
            const responsiveStyle = `
<style id="prbsolver-compound-mobile-layout">
  *, *::before, *::after { box-sizing: border-box; }
  html, body { max-width: 100%; overflow-x: hidden; }
  @media (max-width: 640px) {
    html, body { width: 100% !important; max-width: 100vw !important; margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; }
    body { padding-left: 0 !important; padding-right: 0 !important; }
    main, .container, .app-container, .calculator-container, .tool-container, #app, #root, .app { width: 100% !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; padding-left: 8px !important; padding-right: 8px !important; }
    main, .container, .app-container, .calculator-container, .tool-container,
    #app, #root, .app { max-width: 100% !important; min-width: 0 !important; }
    form, .input-grid, .inputs-grid, .form-grid, .calculator-inputs,
    .input-section-grid, .inputs-section, .form-fields {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
      min-width: 0 !important;
    }
    form > div, .input-grid > *, .inputs-grid > *, .form-grid > *,
    .calculator-inputs > *, .input-section-grid > *, .form-fields > * {
      min-width: 0 !important;
      max-width: 100% !important;
    }
    input, select, textarea, button { max-width: 100%; min-width: 0; }
    input, select, textarea { font-size: 16px !important; }
    .results-grid, .result-grid, .result-cards, .summary-cards,
    .metrics-grid, .stats-grid, .summary-grid, .key-results {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
      min-width: 0 !important;
    }
    .result-card, .summary-card, .metric-card, .stat-card,
    .result-item, .summary-item {
      min-width: 0 !important;
      padding: 8px !important;
      font-size: 12px !important;
      line-height: 1.25 !important;
      overflow-wrap: anywhere !important;
    }
    /* App-like mobile workspace: comfortable edges, compact controls and clear sections. */
    body { background: #f7f5fc !important; color: #1e1035; }
    main, .container, .app-container, .calculator-container, .tool-container,
    #app, #root, .app {
      border-radius: 18px;
    }
    h1 { font-size: clamp(1.35rem, 5vw, 1.8rem) !important; line-height: 1.2 !important; }
    h2 { font-size: clamp(1.05rem, 4vw, 1.3rem) !important; line-height: 1.3 !important; }
    input, select, textarea {
      border-radius: 12px !important;
      padding: 10px 11px !important;
      background: #fff;
    }
    button { border-radius: 12px; }

    /* Contribution timing: two compact, clearly ordered choices in one row. */
    fieldset, [role="radiogroup"], .radio-group, .segmented-control,
    .contribution-timing, .timing-options, .timing-selector {
      min-width: 0 !important;
      max-width: 100% !important;
    }
    fieldset label, [role="radiogroup"] label, .radio-group label,
    .segmented-control button, .contribution-timing button,
    .timing-options button, .timing-selector button {
      font-size: 12px !important;
      line-height: 1.25 !important;
      padding: 9px 8px !important;
      min-width: 0 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }
    [role="radiogroup"], .radio-group, .segmented-control,
    .contribution-timing, .timing-options, .timing-selector {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    /* Year-by-year breakdown: deliberately landscape/wide, swipe horizontally on phones. */
    table {
      width: max-content !important;
      min-width: 620px !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
      font-size: 12px !important;
      background: #fff;
    }
    table th, table td {
      padding: 10px 12px !important;
      white-space: nowrap !important;
      border-bottom: 1px solid #ede9fe;
      text-align: right;
      vertical-align: middle;
    }
    table th:first-child, table td:first-child {
      text-align: left;
      position: sticky;
      left: 0;
      z-index: 1;
      background: #faf9fe;
      font-weight: 600;
    }
    table thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #f3efff;
      color: #3b2760;
      font-weight: 700;
    }
    table thead th:first-child { z-index: 3; }
    .prb-mobile-table-scroll,\n    .table-wrapper, .table-container, .table-responsive, .overflow-x-auto,
    .yearly-table-wrapper, .breakdown-table-wrapper,
    table:where(.year-by-year, .yearly-breakdown, .breakdown-table) {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      overflow-y: auto !important;
      max-height: 252px !important;
      scrollbar-width: thin;
      scrollbar-color: #a78bfa #f5f3ff;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
      border: 1px solid #ede9fe;
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(43, 20, 77, 0.04);
    }
    canvas, svg, img { max-width: 100%; }
    /* Avoid forcing the whole document wider because of a wide annual table. */
    section, article, div { min-width: 0; }
  }
</style>`;
            withBase = /<\/head>/i.test(withBase)
              ? withBase.replace(/<\/head>/i, responsiveStyle + '</head>')
              : responsiveStyle + withBase;
            // Wrap actual tables in a horizontal scroll container even when the
            // uploaded HTML uses unknown wrapper/class names.
            const mobileTableScript = `<script id="prb-mobile-table-wrap">
              (() => {
                const wrapTables = () => {
                  document.querySelectorAll('table').forEach((table) => {
                    if (table.parentElement?.classList.contains('prb-mobile-table-scroll')) return;
                    const wrapper = document.createElement('div');
                    wrapper.className = 'prb-mobile-table-scroll';
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                  });
                };
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', wrapTables, { once: true });
                } else {
                  wrapTables();
                }
              })();
            <\/script>`;
            withBase = /<\/body>/i.test(withBase)
              ? withBase.replace(/<\/body>/i, mobileTableScript + '</body>')
              : withBase + mobileTableScript;
            // The guide is the single source for compound-interest FAQs.
            // Remove the legacy FAQ block from the uploaded calculator HTML so
            // users do not see the same questions above and inside the guide.
            const compoundFaqCleanupScript = `<script id="prb-compound-faq-cleanup">
              (() => {
                const removeFaqBlock = () => {
                  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
                  const heading = headings.find((item) => /^(frequently asked questions|compound interest calculator\\s*faq|compound interest calculator\\s*faqs|faqs?|common questions)$/i.test((item.textContent || '').replace(/\\s+/g, ' ').trim()));
                  if (!heading) return;
                  const labelledContainer = heading.closest('[id*="faq" i], [class*="faq" i], [id*="question" i], [class*="question" i]');
                  if (labelledContainer) {
                    labelledContainer.remove();
                    return;
                  }
                  const section = heading.closest('section');
                  if (section) {
                    section.remove();
                    return;
                  }
                  let block = heading.parentElement;
                  for (let depth = 0; depth < 5 && block?.parentElement; depth += 1) {
                    const parent = block.parentElement;
                    const faqItems = parent.querySelectorAll('details, summary, [class*="faq" i], [class*="accordion" i], [class*="question" i]');
                    if (faqItems.length > 0) {
                      block = parent;
                      break;
                    }
                    if (parent.querySelectorAll('h1,h2,h3,h4,h5,h6').length > 1) break;
                    block = parent;
                  }
                  block?.remove();
                };
                if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeFaqBlock, { once: true });
                else removeFaqBlock();
              })();
            <\\/script>`;
            withBase = /<\/body>/i.test(withBase)
              ? withBase.replace(/<\/body>/i, compoundFaqCleanupScript + '</body>')
              : withBase + compoundFaqCleanupScript;
          }
          setCustomToolHtml(withBase);
          setCustomToolHtmlError(false);
        }
      } catch (error) {
        console.error('[CustomTools] Could not load uploaded HTML:', error);
        if (!cancelled) setCustomToolHtmlError(true);
      }
    };

    void loadHtml();
    return () => { cancelled = true; };
  }, [customTool?.storageUrl]);

  const builtInTool = getToolBySlug(toolSlug);

  // Construct active tool data
  let tool: ToolItem | null = null;
  let isCustom = false;
  let isActive = true;

  if (customTool) {
    isCustom = true;
    isActive = customTool.status === 'active';
    tool = {
      id: customTool.id,
      name: customTool.name,
      slug: customTool.slug,
      category: customTool.category as any,
      description: customTool.description,
      iconName: customTool.iconName,
      keywords: customTool.keywords || [],
      status: customTool.status,
      featured: customTool.featured,
      popular: customTool.popular,
      conceptExplanation: customTool.longDescription || customTool.description,
      relatedTools: [],
      relatedGuides: [],
    };
  } else if (builtInTool) {
    tool = builtInTool;
  }

  // Favorite tracking
  useEffect(() => {
    if (!tool) return;
    setIsFav(isToolFavorited(tool.id) || isToolFavorited(tool.slug));
    const handleFavUpdate = () => {
      if (tool) {
        setIsFav(isToolFavorited(tool.id) || isToolFavorited(tool.slug));
      }
    };
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavUpdate);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavUpdate);
  }, [tool]);

  const handleToggleFavorite = () => {
    if (!tool) return;
    const newStatus = toggleToolFavorite(tool.id);
    setIsFav(newStatus);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#6D6582]">Loading utility workspace...</p>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="py-16 text-center font-sans">
        <h1 className="text-2xl font-heading font-extrabold text-[#1E1035]">Tool Not Found</h1>
        <p className="mt-2 text-sm text-[#6D6582]">
          The tool you are searching for does not exist or has been relocated.
        </p>
        <Link
          href="/tools"
          className="mt-4 inline-block px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-heading font-semibold hover:bg-[#6D28D9] shadow-2xs transition-colors"
        >
          Explore All Tools
        </Link>
      </div>
    );
  }

  // Standardize content for this tool (whether custom uploaded, built-in, or new)
  const effectiveDescription = tool.slug === 'compound-interest-calculator' && !tool.description.trim()
    ? 'Estimate how an initial deposit and recurring contributions may grow with compound interest. Adjust the annual rate, compounding frequency, contribution timing, and duration to view a projected balance, growth chart, and year-by-year breakdown. Results are estimates, not guaranteed returns.'
    : tool.description;

  const standard = getStandardizedToolContent(
    tool.slug,
    tool.name,
    tool.category,
    effectiveDescription
  );

  const formulaData: ToolFormulaData = {
    ...standard.formula,
    equation: (tool.formula && tool.formula.equation) || standard.formula.equation,
    explanation: (tool.formula && tool.formula.explanation) || standard.formula.explanation,
  };
  const howToUseSteps = (tool.howToUse && tool.howToUse.length > 0) ? tool.howToUse : standard.howToUse;
  const faqItems = (tool.faq && tool.faq.length > 0) ? tool.faq : standard.faq;
  const isMathProblemSolver = tool.slug === 'math-problem-solver';
  const conceptText = isMathProblemSolver
    ? 'Enter a supported math question to see its type, the method or formula used, and the working leading to the answer. AI explanations and image input appear only when those features are enabled and configured.'
    : (tool.conceptExplanation || standard.conceptExplanation);
  const workedExamples = standard.workedExamples;
  const prosList = standard.pros;
  const consList = standard.cons;

  const category = getCategoryBySlug(tool.category);
  const categoryName = category ? category.name : (tool.category ? tool.category.replace(/-/g, ' ') : 'Calculators');

  // Related tools & guides
  const relatedToolsList = TOOLS.filter(
    (t) => tool && (tool.relatedTools.includes(t.id) || tool.relatedTools.includes(t.slug))
  );
  const relatedGuidesList = availableGuides.filter((g) => tool && (
    tool.relatedGuides.includes(g.slug) ||
    (tool.slug === 'compound-interest-calculator' && g.slug === 'compound-interest-calculator-formula-and-examples') ||
    (tool.slug === 'math-problem-solver' && g.slug === 'math-solver-free-step-by-step-solutions-for-algebra-more')
  ));

  // Render specific tool component
  const renderInteractiveTool = () => {
    if (!isActive) {
      return (
        <div className="p-8 text-center bg-amber-50/60 rounded-xl border border-amber-200">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
          <h3 className="font-heading font-bold text-sm text-amber-900">
            Tool Temporarily Offline for Scheduled Maintenance
          </h3>
          <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
            This utility is currently inactive while upgrades are being implemented by the administration.
          </p>
        </div>
      );
    }

    // 2. Production custom tool bundle from Supabase Storage.
    if (customTool && customTool.storageUrl) {
      if (customToolHtmlError) {
        return (
          <div className="p-6 text-center rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <p className="font-semibold text-sm">Unable to load this uploaded tool.</p>
            <p className="text-xs mt-1">Please re-upload the tool ZIP or check that its HTML file is publicly accessible.</p>
          </div>
        );
      }
      if (!customToolHtml) {
        return <div className="p-8 text-center text-sm text-[#6D6582]">Loading tool workspace…</div>;
      }
      return (
        <div className="compound-interest-iframe-shell w-full relative overflow-hidden rounded-xl bg-white border border-[#EDE9FE] shadow-2xs">
          <iframe
            ref={toolIframeRef}
            srcDoc={customToolHtml}
            title={`${tool?.name || 'Custom Tool'} Workspace`}
            className="w-full border-0 block"
            style={{
              height: `${iframeHeight}px`,
              minHeight: '380px',
            }}
            scrolling="no"
            sandbox="allow-scripts allow-forms allow-modals allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    // Backward-compatible browser-cache fallback for tools created before
    // the production Storage migration.
    if (customTool && customTool.extractedHtml) {
      return (
        <div className="w-full relative overflow-hidden rounded-xl bg-white border border-[#EDE9FE] shadow-2xs">
          <iframe
            ref={toolIframeRef}
            srcDoc={customTool.extractedHtml}
            title={`${tool?.name || 'Custom Tool'} Workspace`}
            className="w-full border-0 block"
            style={{
              height: `${iframeHeight}px`,
              minHeight: '380px',
            }}
            scrolling="no"
            sandbox="allow-scripts allow-forms allow-modals allow-same-origin allow-popups"
          />
        </div>
      );
    }

    // 3. Fallback to other built-in interactive tools
    switch (tool?.slug) {
      case 'percentage-calculator':
        return <PercentageCalculator />;
      case 'age-calculator':
        return <AgeCalculator />;
      case 'word-counter':
        return <WordCounter />;
      default:
        // Default clean interactive client engine
        return (
          <div className="p-8 text-center bg-[#FAF9FE] rounded-2xl border border-[#EDE9FE] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto shadow-2xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#1E1035]">{tool.name}</h3>
              <p className="text-xs text-[#6D6582] max-w-md mx-auto mt-1">
                {tool.description}
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active In-Browser Computation
              </span>
            </div>
          </div>
        );
    }
  };

  const breadcrumbItems = [
    { label: categoryName, path: `/${tool.category}` },
    { label: tool.name, path: `/${tool.category}/${tool.slug}` },
  ];

  const baseUrl = getSiteUrl().replace(/\/+$/, '');
  const toolCanonicalPath = `/${tool.category}/${tool.slug}`;

  // Structured Data (SoftwareApplication + FAQPage)
  const toolSchema: Record<string, unknown>[] = [
    {
      '@type': 'SoftwareApplication',
      name: tool.name,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All',
      description: effectiveDescription,
      url: `${baseUrl}${toolCanonicalPath}`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ];

  if (faqItems && faqItems.length > 0) {
    toolSchema.push({
      '@type': 'FAQPage',
      mainEntity: faqItems.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

  const embedSnippet = `<iframe id="prbsolver-${tool.slug}-embed" src="${baseUrl}${toolCanonicalPath}?embed=true" title="${tool.name}" width="100%" height="900" loading="lazy" style="display:block;width:100%;min-height:700px;height:900px;border:0;border-radius:12px;overflow:auto;" referrerpolicy="strict-origin-when-cross-origin"></iframe>
<script>
(function () {
  var frame = document.getElementById('prbsolver-${tool.slug}-embed');
  if (!frame) return;
  window.addEventListener('message', function (event) {
    if (event.origin !== '${baseUrl}' || event.source !== frame.contentWindow) return;
    if (!event.data || event.data.type !== 'OT_EMBED_RESIZE') return;
    var height = Number(event.data.height);
    if (Number.isFinite(height)) frame.style.height = Math.max(500, Math.min(25000, height)) + 'px';
  });
})();
</script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  if (isEmbedMode) {
    return (
      <div className="w-full min-w-0 bg-white p-2 sm:p-3">
        <div id="interactive-tool-section" aria-label={`${tool.name} calculator`} className="w-full min-w-0 overflow-hidden rounded-xl">
          {renderInteractiveTool()}
        </div>
      </div>
    );
  }

  return (
    <article className="space-y-6 sm:space-y-7 font-sans">
      <SEOHelmet
        title={customTool?.seoTitle || `${tool.name} – Free Online Tool | PRBSolver`}
        description={customTool?.seoDescription || effectiveDescription}
        canonicalPath={toolCanonicalPath}
        breadcrumbs={breadcrumbItems}
        schema={toolSchema}
      />

      {/* 1. Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* 2 & 3. Header & Short Description */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Link
              href={`/${tool.category}`}
              className="text-[11px] font-heading font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE] transition-all hover:bg-[#EDE9FE]"
            >
              {categoryName}
            </Link>
            <span className="text-xs text-[#9D95B3]">•</span>
            <span className="text-xs text-[#6D6582] flex items-center gap-1 font-medium font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
              Online Tool
            </span>
            <span className="text-xs text-[#9D95B3]">•</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium font-sans">
              Interactive Workspace
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-heading font-extrabold text-[#1E1035] tracking-tight">
            {tool.name}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm font-sans text-[#6D6582] max-w-3xl leading-relaxed">
            {effectiveDescription}
          </p>
        </div>

        {/* Action Buttons in Header: Share & Favorite & Report Issue */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
          <ShareButton
            title={tool.name}
            url={typeof window !== 'undefined' ? window.location.href : undefined}
            description={effectiveDescription}
            variant="button"
          />

          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-semibold border transition-colors cursor-pointer shadow-2xs ${
              isFav
                ? 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]'
                : 'bg-white text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] border-[#EDE9FE]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#7C3AED] text-[#7C3AED]' : ''}`} />
            <span>{isFav ? 'Saved' : 'Favorite'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-medium text-amber-700 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 transition-colors cursor-pointer shadow-2xs"
            title="Report a problem or bug with this tool"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {/* 4. DEDICATED INTERACTIVE TOOL WORKSPACE & LIVE RESULTS (ELEVATED CONTAINER WITH SHADOW) */}
      <section
        id="interactive-tool-section"
        aria-label="Interactive Tool Workspace & Output Results"
        className={`bg-white border-2 border-[#DDD6FE] rounded-2xl sm:rounded-3xl shadow-[0_16px_45px_-10px_rgba(124,58,237,0.12),0_4px_18px_rgba(30,16,53,0.06)] overflow-hidden transition-all duration-200 ${toolSlug === 'compound-interest-calculator' ? 'compound-interest-tool-workspace' : ''}`}
      >
        {/* Top Header of the Tool Section */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-[#FAF8FE] via-[#F5F3FF] to-[#FAF8FE] border-b border-[#EDE9FE] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-heading font-bold text-[#1E1035] tracking-wide uppercase">
              Interactive Tool Workspace
            </span>
          </div>
          <span className="text-[11px] font-sans text-[#7C3AED] bg-white px-2.5 py-0.5 rounded-full border border-[#DDD6FE] shadow-2xs font-semibold">
            Live Results
          </span>
        </div>

        {/* The Tool and Results Container */}
        <div className={toolSlug === 'compound-interest-calculator' ? 'compound-interest-tool-inner p-2 sm:p-6 lg:p-7' : 'p-4 sm:p-6 lg:p-7'}>
          {renderInteractiveTool()}
        </div>

        {/* Bottom Demarcation Bar - Demarcates exactly where tool output ends */}
        <div className="px-5 py-3 sm:px-6 bg-[#FAF9FE] border-t border-[#EDE9FE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-heading font-bold text-[#7C3AED]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tool Workspace Ends Here</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6D6582] font-sans">
            <span>Scroll below for instructions, method, examples &amp; FAQs</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#7C3AED] animate-bounce shrink-0" />
          </div>
        </div>
      </section>

      {/* HIGHEST CTR GOOGLE ADSENSE PLACEMENT: POST-CALCULATION SLOT */}
      <AdSlotPlaceholder id="tool-after-calc-ad" type="post-calculation" showExplanation />

      {/* 5. Step-by-Step How to Use This Tool */}
      {howToUseSteps && howToUseSteps.length > 0 && (
        <section
          id="how-to-use"
          className="bg-white border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(124,58,237,0.03)] space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
                How to Use the {tool.name}
              </h2>
              <p className="text-xs text-[#6D6582]">{isMathProblemSolver ? 'Enter a question, then review the method and solution steps.' : 'Follow these steps to use the tool and understand its results.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {howToUseSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] flex items-start gap-3 text-xs leading-relaxed"
              >
                <span className="w-6 h-6 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-heading font-bold text-xs shrink-0 shadow-2xs">
                  {idx + 1}
                </span>
                <span className="text-[#1E1035] pt-0.5 font-medium">{step}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Understanding the Concept */}
      <section
        aria-labelledby="understanding-concept-title"
        className={`bg-white border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(124,58,237,0.03)] ${isMathProblemSolver ? 'space-y-3' : 'space-y-3'}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 id="understanding-concept-title" className="text-base sm:text-lg font-heading font-bold text-[#1E1035] tracking-tight">
              Understanding the Concept
            </h2>
            <p className="mt-1 text-xs text-[#6D6582] leading-relaxed">
              {isMathProblemSolver
                ? 'A quick guide to what the solver explains.'
                : 'The key idea behind this tool and what its result means.'}
            </p>
          </div>
        </div>
        {isMathProblemSolver ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-start gap-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-[#DDD6FE] text-[11px] font-bold text-[#7C3AED]">1</span>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-[#1E1035]">Identify the problem</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#6D6582]">Learn what kind of math question you have.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-[#DDD6FE] text-[11px] font-bold text-[#7C3AED]">2</span>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-[#1E1035]">Choose a method</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#6D6582]">See the relevant formula or solving approach.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-[#DDD6FE] text-[11px] font-bold text-[#7C3AED]">3</span>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-[#1E1035]">Follow the steps</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#6D6582]">Understand each calculation before the final answer.</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="max-w-4xl text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed">
            {conceptText}
          </p>
        )}
      </section>

      {/* 7. COMPLETE MATHEMATICAL FORMULATION & UNDERLYING LOGIC (USER REQUIREMENT) */}
      <section
        id="underlying-logic"
        className="bg-white border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(124,58,237,0.03)] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDE9FE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
                Methodology &amp; Formula
              </h2>
              <p className="text-xs text-[#6D6582]">
                Review the method, formula, variables, and example that apply to this tool.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE] self-start sm:self-auto">
            Calculation Method
          </span>
        </div>

        {/* {isMathProblemSolver ? 'Method or Formula' : 'Primary Mathematical Equation'} Highlight Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#1E1035] via-[#2A1647] to-[#1E1035] text-white shadow-md relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-wider text-[#DDD6FE] font-heading font-semibold mb-2 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Formula or Method</span>
          </div>
          <div className="text-base sm:text-xl md:text-2xl font-mono font-bold text-[#FAF9FE] tracking-wide overflow-x-auto py-2">
            {formulaData.equation}
          </div>
          <p className="text-xs text-[#DDD6FE]/90 mt-2 font-sans leading-relaxed">
            {formulaData.explanation}
          </p>
        </div>

        {/* Variables Legend Table / Grid */}
        {formulaData.variables && formulaData.variables.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Variable Definitions &amp; Units</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {formulaData.variables.map((v, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#7C3AED] bg-white px-2 py-0.5 rounded-md border border-[#DDD6FE]">
                      {v.symbol}
                    </span>
                    {v.unit && (
                      <span className="text-[10px] text-[#9D95B3] font-medium font-sans">
                        {v.unit}
                      </span>
                    )}
                  </div>
                  <div className="font-heading font-bold text-[#1E1035] text-xs pt-1">{v.name}</div>
                  <p className="text-[11px] text-[#6D6582] leading-snug">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Step-by-Step Calculation Walkthrough */}
        {formulaData.sampleCalculation && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <h4 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
                  Worked Step-by-Step Calculation Walkthrough
                </h4>
              </div>
              <span className="text-[11px] font-heading font-semibold text-[#7C3AED] bg-white px-2.5 py-0.5 rounded-full border border-[#DDD6FE]">
                Worked Example
              </span>
            </div>
            <div className="text-xs text-[#1E1035] font-heading font-semibold">
              Scenario: <span className="font-normal text-[#6D6582]">{formulaData.sampleCalculation.scenario}</span>
            </div>
            <ol className="space-y-1.5 text-xs text-[#6D6582] list-decimal list-inside font-mono leading-relaxed bg-white p-3.5 rounded-xl border border-[#EDE9FE]">
              {formulaData.sampleCalculation.steps.map((st, i) => (
                <li key={i} className="pl-1">
                  <span className="font-sans text-[#1E1035]">{st}</span>
                </li>
              ))}
            </ol>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-heading font-bold text-[#1E1035]">Output Resolution:</span>
              <span className="font-mono font-bold text-[#7C3AED] bg-white px-2.5 py-1 rounded-lg border border-[#DDD6FE] shadow-2xs">
                {formulaData.sampleCalculation.result}
              </span>
            </div>
          </div>
        )}

        {/* Mathematical Nuances / Properties */}
        {formulaData.mathematicalProperties && formulaData.mathematicalProperties.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
              Mathematical Principles &amp; Characteristics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formulaData.mathematicalProperties.map((prop, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-xs text-[#6D6582] flex items-start gap-2">
                  <span className="text-[#7C3AED] font-bold">•</span>
                  <span>{prop}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 8. Practical Worked Examples Table */}
      {(
        <section className="bg-white border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(124,58,237,0.03)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
                Worked Examples
              </h2>
              <p className="text-xs text-[#6D6582]">{isMathProblemSolver ? 'See how common math questions are worked through.' : 'Examples showing typical inputs, the method used, and the resulting output.'}</p>
            </div>
          </div>

          {workedExamples.length > 0 ? (
          <div className="space-y-4 pt-1">
            {workedExamples.map((ex, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-heading font-bold text-[#1E1035]">{ex.title}</h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {ex.result}
                  </span>
                </div>
                <p className="text-xs text-[#6D6582]">{ex.scenario}</p>

                {ex.inputs && ex.inputs.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {ex.inputs.map((inp, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-[#EDE9FE] text-[11px]">
                        <span className="text-[#9D95B3] block">{inp.label}</span>
                        <span className="font-heading font-bold text-[#1E1035]">{inp.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-2.5 bg-white rounded-lg border border-[#EDE9FE] text-xs text-[#7C3AED] font-heading font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Key Takeaway: {ex.keyTakeaway}</span>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <p className="rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] p-4 text-sm leading-relaxed text-[#6D6582]">
              A verified worked example is not available for this tool yet. Use the interactive workspace above with a valid input, then review the result shown by the tool.
            </p>
          )}
        </section>
      )}

      {/* 9. Advantages & Considerations (Pros & Cons) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pros */}
        <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-heading font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Advantages</span>
          </div>
          <ul className="space-y-2 text-xs text-[#6D6582]">
            {prosList.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons / Considerations */}
        <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-heading font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Limitations &amp; Considerations</span>
          </div>
          <ul className="space-y-2 text-xs text-[#6D6582]">
            {consList.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold shrink-0">!</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10. Embed Tool Generator */}
      <section className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#7C3AED]" />
              <span>Embed This Tool on Your Website or Blog</span>
            </h3>
            <p className="text-xs text-[#6D6582] mt-0.5">
              Copy this standard responsive iframe code to embed {tool.name} freely into any HTML document.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyEmbed}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] text-xs font-heading font-semibold transition-colors cursor-pointer shrink-0"
          >
            {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEmbed ? 'Snippet Copied!' : 'Copy Embed Code'}</span>
          </button>
        </div>
        <pre className="bg-[#FAF9FE] text-[#1E1035] p-3 rounded-xl text-xs font-mono border border-[#EDE9FE] overflow-x-auto select-all">
          {embedSnippet}
        </pre>
      </section>

      {/* 11. Related Tools */}
      {relatedToolsList.length > 0 && (
        <section id="related-tools" className="pt-6 border-t border-[#EDE9FE]">
          <h2 className="text-xl font-heading font-bold text-[#1E1035] mb-5">
            Related Calculators &amp; Utilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedToolsList.map((rel) => (
              <ToolCard key={rel.id} tool={rel} />
            ))}
          </div>
        </section>
      )}

      {/* 12. Related Guides */}
      {relatedGuidesList.length > 0 && (
        <section id="related-guides" className="pt-6 border-t border-[#EDE9FE]">
          <h2 className="text-xl font-heading font-bold text-[#1E1035] mb-5">
            Comprehensive Guides &amp; Explanations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedGuidesList.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </section>
      )}

      {/* 13. FAQ with Schema.org injection */}
      {faqItems && faqItems.length > 0 && (
        <FAQAccordion
          items={faqItems}
          title={`${tool.name} FAQ`}
          description={`Answers to common inquiries regarding the mathematical basis and inputs for the ${tool.name}.`}
        />
      )}

      {/* 14. Comments & User Discussion */}
      <ToolCommentsSection toolSlug={tool.slug} toolName={tool.name} />

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        toolSlug={tool.slug}
        toolName={tool.name}
      />
    </article>
  );
}
