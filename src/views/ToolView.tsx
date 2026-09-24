import { useState, useEffect } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FAQAccordion } from '../components/FAQAccordion';
import { ToolCard } from '../components/ToolCard';
import { GuideCard } from '../components/GuideCard';
import { SEOHelmet } from '../components/SEOHelmet';
import { AdSlotPlaceholder } from '../components/AdSlotPlaceholder';
import { Link } from '../context/RouterContext';
import { getToolBySlug, TOOLS } from '../data/tools';
import { GUIDES } from '../data/guides';
import { getCategoryBySlug } from '../data/categories';
import { PercentageCalculator } from '../components/tools/PercentageCalculator';
import { AgeCalculator } from '../components/tools/AgeCalculator';
import { WordCounter } from '../components/tools/WordCounter';
import {
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  RefreshCw,
  Heart,
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

interface ToolViewProps {
  toolSlug: string;
}

export function ToolView({ toolSlug }: ToolViewProps) {
  const [customTool, setCustomTool] = useState<DBToolRecord | null>(null);
  const [, setStatusOverrides] = useState<Record<string, 'active' | 'inactive'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

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
      formula: undefined,
      howToUse: [
        'Review the input fields in the interactive calculation module below.',
        'Enter or adjust the numerical values and parameters.',
        'Results and figures update in real-time within the sandboxed calculation engine.',
      ],
      stepExamples: [
        {
          title: 'Standard Calculation',
          scenario: 'Provide inputs to embedded utility',
          steps: ['Adjust inputs', 'Examine real-time outputs'],
          result: 'Immediate computation result',
        },
      ],
      faq: [
        {
          question: `Is the ${customTool.name} safe and accurate?`,
          answer:
            'Yes. Calculations are performed securely inside the sandboxed execution container directly in your client browser.',
        },
      ],
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

  const category = getCategoryBySlug(tool.category);
  const categoryName = category ? category.name : tool.category;

  // Related tools & guides
  const relatedToolsList = TOOLS.filter(
    (t) => tool && (tool.relatedTools.includes(t.id) || tool.relatedTools.includes(t.slug))
  );
  const relatedGuidesList = GUIDES.filter((g) => tool && tool.relatedGuides.includes(g.slug));

  // Render specific tool component
  const renderInteractiveTool = () => {
    // If tool is deactivated by admin
    if (!isActive) {
      return (
        <div className="bg-[#FFFFFF] border border-[#DDD6FE] rounded-2xl p-8 sm:p-12 text-center shadow-2xs font-sans">
          <div className="w-12 h-12 rounded-xl bg-[#F5F3FF] text-[#7C3AED] mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-heading font-bold text-[#1E1035]">
            Utility Temporarily Inactive
          </h2>
          <p className="text-sm text-[#6D6582] mt-2 max-w-md mx-auto leading-relaxed">
            {tool.name} has been temporarily placed offline by administrators for scheduled optimization or maintenance.
          </p>
          <div className="mt-6">
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-heading font-semibold hover:bg-[#6D28D9] shadow-2xs transition-colors"
            >
              Browse Active Utilities →
            </Link>
          </div>
        </div>
      );
    }

    // If it's a custom uploaded tool with extracted HTML bundle
    if (isCustom && customTool?.extractedHtml) {
      return (
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(124,58,237,0.03)] font-sans">
          <div className="px-4 py-2.5 bg-[#FAF9FE] border-b border-[#EDE9FE] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span className="font-heading font-semibold text-[#1E1035]">
                Sandboxed Isolated Utility
              </span>
              <span className="text-[11px] text-[#6D6582] font-mono">
                {customTool.entryHtmlPath || 'index.html'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#6D6582]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Permission Sandboxed</span>
            </div>
          </div>
          <iframe
            id={`embedded-tool-frame-${customTool.slug}`}
            title={customTool.name}
            srcDoc={customTool.extractedHtml}
            sandbox="allow-scripts allow-forms"
            referrerPolicy="no-referrer"
            className="w-full min-h-[580px] border-0 bg-white"
          />
        </div>
      );
    }

    // Native hardcoded tools
    switch (tool.slug) {
      case 'percentage-calculator':
        return <PercentageCalculator />;
      case 'age-calculator':
        return <AgeCalculator />;
      case 'word-counter':
        return <WordCounter />;
      default:
        return (
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-8 text-center shadow-2xs font-sans">
            <p className="text-sm text-[#6D6582]">
              Interactive engine ready for calculation.
            </p>
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

  if (tool.faq && tool.faq.length > 0) {
    toolSchema.push({
      '@type': 'FAQPage',
      mainEntity: tool.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

  return (
    <article className="space-y-6 sm:space-y-7">
      <SEOHelmet
        title={`${tool.name} – Free Online Calculator & Utility`}
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
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/${tool.category}`}
              className="text-[11px] font-heading font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE] transition-all hover:bg-[#EDE9FE]"
            >
              {categoryName}
            </Link>
            <span className="text-xs text-[#9D95B3]">•</span>
            <span className="text-xs text-[#6D6582] flex items-center gap-1 font-medium font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
              Free &amp; Private
            </span>
            {isCustom && (
              <>
                <span className="text-xs text-[#9D95B3]">•</span>
                <span className="text-xs text-[#7C3AED] font-medium font-sans">
                  Auto-Embedded Engine
                </span>
              </>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-heading font-extrabold text-[#1E1035] tracking-tight">
            {tool.name}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm font-sans text-[#6D6582] max-w-3xl leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Favorite Button in Header */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold border transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs ${
            isFav
              ? 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]'
              : 'bg-white text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] border-[#EDE9FE]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#7C3AED] text-[#7C3AED]' : ''}`} />
          <span>{isFav ? 'Saved in Favorites' : 'Add to Favorites'}</span>
        </button>
      </div>

      {/* 4. ACTUAL TOOL UI */}
      <section id="interactive-tool-section" aria-label="Interactive Tool">
        {renderInteractiveTool()}
      </section>

      {/* HIGHEST CTR GOOGLE ADSENSE PLACEMENT: POST-CALCULATION SLOT */}
      <AdSlotPlaceholder id="tool-after-calc-ad" type="post-calculation" showExplanation />

      {/* 5. How to Use This Tool */}
      {tool.howToUse && tool.howToUse.length > 0 && (
        <section
          id="how-to-use"
          className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(124,58,237,0.03)]"
        >
          <h2 className="text-xl font-heading font-bold text-[#1E1035] tracking-tight flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-[#7C3AED]" />
            How to Use the {tool.name}
          </h2>
          <ol className="space-y-2.5 text-sm text-[#1E1035] list-decimal list-inside leading-relaxed font-sans">
            {tool.howToUse.map((step, idx) => (
              <li key={idx} className="pl-1">
                <span className="text-[#6D6582]">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 6. Explanation of the Concept */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Concept */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(124,58,237,0.03)]">
          <h2 className="text-xl font-heading font-bold text-[#1E1035] tracking-tight mb-3">
            Understanding the Concept
          </h2>
          <p className="text-sm font-sans text-[#6D6582] leading-relaxed">
            {tool.conceptExplanation ||
              `${tool.name} streamlines common digital computations through a responsive, mathematically grounded interface.`}
          </p>
        </div>

        {/* Formula or Logic */}
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(124,58,237,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#7C3AED]" />
              Underlying Logic
            </h3>
            <p className="text-xs font-sans text-[#6D6582] leading-relaxed mb-4">
              {tool.formula ? 'Mathematical Formulation:' : 'Engine Methodology:'}
            </p>
            <div className="bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl p-3 text-center">
              <code className="text-xs font-mono font-bold text-[#7C3AED]">
                {tool.formula ? tool.formula.equation : 'Interactive Client-Side Engine'}
              </code>
            </div>
          </div>
        </div>
      </div>

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

      {/* 13. FAQ */}
      {tool.faq && tool.faq.length > 0 && (
        <FAQAccordion
          items={tool.faq}
          title={`${tool.name} FAQ`}
          description={`Answers to common inquiries regarding the mathematical basis and inputs for the ${tool.name}.`}
        />
      )}

      {/* 14. Comments & User Discussion */}
      <ToolCommentsSection toolSlug={tool.slug} toolName={tool.name} />
    </article>
  );
}
