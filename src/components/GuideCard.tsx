import { GuideArticle } from '../types';
import { Link } from '../context/RouterContext';
import { Clock, ArrowRight, BookOpen, Calculator, FileText, Calendar, Sparkles, User } from 'lucide-react';
import { getToolBySlug } from '../data/tools';
import { getCategoryBySlug } from '../data/categories';

interface GuideCardProps {
  guide: GuideArticle;
}

// Generate topic-specific thumbnail artwork styles and SVG elements
function getBlogGraphic(slug: string, category: string) {
  if (slug.includes('percentage') || category === 'calculators') {
    return {
      gradient: 'from-[#4C1D95] via-[#6D28D9] to-[#7C3AED]',
      pattern: (
        <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`pct-pattern-${slug}`} width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="18" cy="18" r="1.5" fill="#FFFFFF" />
              <path d="M6 30L30 6" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#pct-pattern-${slug})`} />
          <circle cx="85%" cy="30%" r="50" fill="#DDD6FE" opacity="0.25" filter="blur(20px)" />
        </svg>
      ),
      badgeText: 'Math & Formulas',
      icon: Calculator,
    };
  }
  if (slug.includes('word') || category === 'text-tools') {
    return {
      gradient: 'from-[#581C87] via-[#7E22CE] to-[#9333EA]',
      pattern: (
        <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`text-pattern-${slug}`} width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M4 8h24M4 16h16M4 24h20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#text-pattern-${slug})`} />
          <circle cx="80%" cy="40%" r="45" fill="#F3E8FF" opacity="0.3" filter="blur(20px)" />
        </svg>
      ),
      badgeText: 'Writing & SEO',
      icon: FileText,
    };
  }
  if (slug.includes('age') || category === 'date-time') {
    return {
      gradient: 'from-[#3B0764] via-[#5B21B6] to-[#7C3AED]',
      pattern: (
        <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`time-pattern-${slug}`} width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="12" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
              <path d="M20 12v8l5 3" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#time-pattern-${slug})`} />
          <circle cx="20%" cy="70%" r="50" fill="#DDD6FE" opacity="0.25" filter="blur(20px)" />
        </svg>
      ),
      badgeText: 'Chronometry & Dates',
      icon: Calendar,
    };
  }
  // Default Developer / Tools Graphic
  return {
    gradient: 'from-[#431407] via-[#581C87] to-[#6D28D9]',
    pattern: (
      <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`code-pattern-${slug}`} width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M10 12L4 18l6 6M26 12l6 6-6 6M20 8l-4 20" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#code-pattern-${slug})`} />
        <circle cx="75%" cy="30%" r="45" fill="#DDD6FE" opacity="0.3" filter="blur(20px)" />
      </svg>
    ),
    badgeText: 'Developer & Tech',
    icon: Sparkles,
  };
}

export function GuideCard({ guide }: GuideCardProps) {
  const guideUrl = `/guides/${guide.slug}`;
  const categoryObj = getCategoryBySlug(guide.category);
  const categoryLabel = categoryObj ? categoryObj.name : guide.category.replace('-', ' ');

  // Get primary related tool
  const relatedTools = (guide.relatedTools || [])
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const primaryRelatedTool = relatedTools[0];

  const graphic = getBlogGraphic(guide.slug, guide.category);
  const GraphicIcon = graphic.icon;

  // Format display date
  const displayDate = guide.updatedDate || guide.publishedDate || '2026';
  const formattedDate = new Date(displayDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      id={`blog-card-${guide.slug}`}
      className="group relative bg-[#FFFFFF] border border-[#EDE9FE] hover:border-[#DDD6FE] rounded-xl flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] hover:-translate-y-0.5 overflow-hidden h-full"
    >
      {/* 1. Blog Card Thumbnail Banner (Compact height) */}
      <div className={`relative h-26 sm:h-28 w-full bg-gradient-to-br ${graphic.gradient} overflow-hidden flex flex-col justify-between p-3`}>
        {/* Dynamic Abstract Pattern */}
        {graphic.pattern}

        {/* Ambient Glow Orb */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none transform translate-x-6 -translate-y-6" />

        {/* Top Floating Badges */}
        <div className="relative z-10 flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 text-[9.5px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/95 text-[#6D28D9] shadow-2xs backdrop-blur-xs">
            <BookOpen className="w-2.5 h-2.5 text-[#7C3AED]" />
            <span>{categoryLabel}</span>
          </span>

          <div className="flex items-center gap-1">
            {guide.readingTime && (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-white bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/15 shadow-2xs">
                <Clock className="w-2.5 h-2.5 text-purple-200" aria-hidden="true" />
                <span>{guide.readingTime}</span>
              </span>
            )}
          </div>
        </div>

        {/* Center Graphic Icon Spotlight */}
        <div className="relative z-10 flex items-center justify-between mt-auto pt-1">
          <div className="inline-flex items-center gap-1.5 text-white/90">
            <div className="w-6.5 h-6.5 rounded-md bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shadow-inner">
              <GraphicIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10.5px] font-heading font-bold text-white tracking-wide drop-shadow-xs">
              {graphic.badgeText}
            </span>
          </div>

          <span className="text-[9.5px] font-mono font-medium text-purple-200/90 bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-xs">
            Article
          </span>
        </div>
      </div>

      {/* 2. Blog Card Content Body (Compact, no formula box) */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row: Author & Date */}
          <div className="flex items-center gap-1.5 text-[10.5px] text-[#6D6582] mb-1.5">
            <div className="w-4 h-4 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shrink-0">
              <User className="w-2.5 h-2.5" />
            </div>
            <span className="font-heading font-semibold text-[#1E1035] text-[10.5px]">
              {guide.author || 'Editorial'}
            </span>
            <span className="text-[#DDD6FE]">•</span>
            <span className="text-[10.5px] text-[#9D95B3] font-sans">
              {formattedDate}
            </span>
          </div>

          {/* Article Title */}
          <h3 className="text-xs sm:text-[13px] font-heading font-bold text-[#1E1035] group-hover:text-[#7C3AED] transition-colors leading-snug line-clamp-2 mb-1">
            <Link href={guideUrl} className="focus:outline-hidden after:absolute after:inset-0">
              {guide.title}
            </Link>
          </h3>

          {/* Article Excerpt */}
          <p className="text-[11px] text-[#6D6582] line-clamp-2 leading-relaxed font-sans mb-2">
            {guide.description}
          </p>
        </div>

        {/* 3. Blog Card Footer CTA */}
        <div className="pt-2 mt-auto border-t border-[#F5F3FF] flex items-center justify-between text-[11px]">
          <span className="text-[9.5px] font-medium text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-md border border-[#EDE9FE]">
            Verified Guide
          </span>

          <span className="inline-flex items-center gap-0.5 font-heading font-semibold text-[11px] text-[#7C3AED] group-hover:text-[#6D28D9] group-hover:translate-x-0.5 transition-all">
            <span>Read</span>
            <ArrowRight className="w-2.5 h-2.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
