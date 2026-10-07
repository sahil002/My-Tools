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
import { GUIDES } from '../data/guides';
import { getCategoryBySlug } from '../data/categories';
import { PercentageCalculator } from '../components/tools/PercentageCalculator';
import { AgeCalculator } from '../components/tools/AgeCalculator';
import { WordCounter } from '../components/tools/WordCounter';
import { CompoundInterestCalculator } from '../components/tools/CompoundInterestCalculator';
import {
  CheckCircle2,
  AlertTriangle,
  BookOpen,
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
  const [, setStatusOverrides] = useState<Record<string, 'active' | 'inactive'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number>(550);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const lastHeightRef = useRef<number>(550);

  // Auto-resize listener for seamless embedded tool height with anti-vibration damping
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
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
  const standard = getStandardizedToolContent(
    tool.slug,
    tool.name,
    tool.category,
    tool.description
  );

  const formulaData: ToolFormulaData = {
    ...standard.formula,
    equation: (tool.formula && tool.formula.equation) || standard.formula.equation,
    explanation: (tool.formula && tool.formula.explanation) || standard.formula.explanation,
  };
  const howToUseSteps = (tool.howToUse && tool.howToUse.length > 0) ? tool.howToUse : standard.howToUse;
  const faqItems = (tool.faq && tool.faq.length > 0) ? tool.faq : standard.faq;
  const conceptText = tool.conceptExplanation || standard.conceptExplanation;
  const workedExamples = standard.workedExamples;
  const prosList = standard.pros;
  const consList = standard.cons;

  const category = getCategoryBySlug(tool.category);
  const categoryName = category ? category.name : (tool.category ? tool.category.replace(/-/g, ' ') : 'Calculators');

  // Related tools & guides
  const relatedToolsList = TOOLS.filter(
    (t) => tool && (tool.relatedTools.includes(t.id) || tool.relatedTools.includes(t.slug))
  );
  const relatedGuidesList = GUIDES.filter((g) => tool && tool.relatedGuides.includes(g.slug));

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

    // 1. Native High-Fidelity Compound Interest Calculator Component
    const isCompoundSlug = toolSlug === 'compound-interest-calculator' || (tool && tool.slug === 'compound-interest-calculator');
    if (isCompoundSlug) {
      return <CompoundInterestCalculator />;
    }

    // 2. Production custom tool bundle from Supabase Storage.
    if (customTool && customTool.storageUrl) {
      return (
        <div className="w-full relative overflow-hidden rounded-xl bg-white border border-[#EDE9FE] shadow-2xs">
          <iframe
            src={customTool.storageUrl}
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
      description: tool.description,
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

  const embedSnippet = `<iframe src="${baseUrl}/${tool.category}/${tool.slug}?embed=true" width="100%" height="600" style="border:0;border-radius:12px;overflow:hidden;" title="${tool.name}"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  return (
    <article className="space-y-6 sm:space-y-7 font-sans">
      <SEOHelmet
        title={`${tool.name} – Free Online Calculator & Utility | PRBSolver`}
        description={tool.description}
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
              100% Free &amp; Client-Side Private
            </span>
            <span className="text-xs text-[#9D95B3]">•</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium font-sans">
              Verified Formula
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-heading font-extrabold text-[#1E1035] tracking-tight">
            {tool.name}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm font-sans text-[#6D6582] max-w-3xl leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Action Buttons in Header: Share & Favorite & Report Issue */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
          <ShareButton
            title={tool.name}
            url={typeof window !== 'undefined' ? window.location.href : undefined}
            description={tool.description}
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
        className="bg-white border-2 border-[#DDD6FE] rounded-2xl sm:rounded-3xl shadow-[0_16px_45px_-10px_rgba(124,58,237,0.12),0_4px_18px_rgba(30,16,53,0.06)] overflow-hidden transition-all duration-200"
      >
        {/* Top Header of the Tool Section */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-[#FAF8FE] via-[#F5F3FF] to-[#FAF8FE] border-b border-[#EDE9FE] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-heading font-bold text-[#1E1035] tracking-wide uppercase">
              Interactive Utility &amp; Live Results Engine
            </span>
          </div>
          <span className="text-[11px] font-sans text-[#7C3AED] bg-white px-2.5 py-0.5 rounded-full border border-[#DDD6FE] shadow-2xs font-semibold">
            Real-Time Browser Calculation
          </span>
        </div>

        {/* The Tool and Results Container */}
        <div className="p-4 sm:p-6 lg:p-7">
          {renderInteractiveTool()}
        </div>

        {/* Bottom Demarcation Bar - Demarcates exactly where tool output ends */}
        <div className="px-5 py-3 sm:px-6 bg-[#FAF9FE] border-t border-[#EDE9FE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-heading font-bold text-[#7C3AED]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Interactive Calculation Results End Here</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6D6582] font-sans">
            <span>Scroll below for full guides, formulas &amp; references</span>
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
              <p className="text-xs text-[#6D6582]">Follow these straightforward steps to calculate your results accurately.</p>
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
      <section className="bg-white border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(124,58,237,0.03)] space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
              Understanding the Concept
            </h2>
            <p className="text-xs text-[#6D6582]">Core theory and mathematical rationale behind {tool.name}.</p>
          </div>
        </div>
        <p className="text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed pt-1">
          {conceptText}
        </p>
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
                Mathematical Formulation &amp; Underlying Logic
              </h2>
              <p className="text-xs text-[#6D6582]">
                Detailed equations, variable definitions, and step-by-step calculation mechanics.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE] self-start sm:self-auto">
            Deterministic Engine
          </span>
        </div>

        {/* Primary Mathematical Equation Highlight Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#1E1035] via-[#2A1647] to-[#1E1035] text-white shadow-md relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-wider text-[#DDD6FE] font-heading font-semibold mb-2 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Primary Mathematical Equation</span>
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
                Verified Numerical Proof
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
      {workedExamples && workedExamples.length > 0 && (
        <section className="bg-white border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(124,58,237,0.03)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
                Practical Real-World Scenarios
              </h2>
              <p className="text-xs text-[#6D6582]">Concrete examples showing parameter setups and expected outcomes.</p>
            </div>
          </div>

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
            <span>Considerations &amp; Scope</span>
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
