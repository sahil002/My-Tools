import { useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { ToolCard } from '../components/ToolCard';
import { CategoryCard } from '../components/CategoryCard';
import { GuideCard } from '../components/GuideCard';
import { FAQAccordion } from '../components/FAQAccordion';
import { AdSlot } from '../components/AdSlotPlaceholder';
import { SEOHelmet } from '../components/SEOHelmet';
import { Link, useRouter } from '../context/RouterContext';
import { CATEGORIES } from '../data/categories';
import { getPopularTools } from '../data/tools';
import { GUIDES } from '../data/guides';
import { getSiteUrl } from '../data/siteConfig';
import {
  Zap,
  CheckCircle2,
  FileCheck,
  Smartphone,
  ArrowRight,
  Wrench,
  BookOpen,
  Sparkles,
  LayoutGrid,
  ArrowUpRight,
  Mail,
  Shield,
} from 'lucide-react';

export function HomeView() {
  const { navigate } = useRouter();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribeEmail.trim()) {
      setSubscribed(true);
      setSubscribeEmail('');
    }
  };

  const popularTools = getPopularTools().slice(0, 6);
  const guidesList = GUIDES.slice(0, 4);

  const filteredCategories =
    selectedCategoryFilter === 'all'
      ? CATEGORIES
      : CATEGORIES.filter((c) => c.id === selectedCategoryFilter || c.slug === selectedCategoryFilter);

  const homeFaq = [
    {
      question: 'Are all calculators and tools on this website free to use?',
      answer: 'Yes. Every calculator, converter, and developer tool on this website is completely free with no paywalls, subscriptions, or hidden charges.'
    },
    {
      question: 'Do I need to create an account or download any software?',
      answer: 'No registration or installation is required. Every utility operates instantly inside your web browser across mobile, tablet, and desktop devices.'
    },
    {
      question: 'How is user privacy protected during calculations?',
      answer: 'All mathematical calculations, code formatting, and text manipulations run locally in your client browser. Your inputs are never sent to external servers.'
    },
    {
      question: 'Can I bookmark or save favorite tools for quick access?',
      answer: 'Yes! Click the heart icon on any tool card or inside the tool page to save it into your Favorites drawer for immediate one-click access.'
    },
    {
      question: 'How can I request a new tool or suggest improvements?',
      answer: 'You can submit requests anytime using our Request a Tool page. We review new tool suggestions and publish updates frequently.'
    }
  ];

  const siteBaseUrl = getSiteUrl().replace(/\/+$/, '');
  const homeSchemas: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${siteBaseUrl}/#organization`,
      name: 'Online Tools',
      url: siteBaseUrl,
      logo: `${siteBaseUrl}/favicon.svg`,
      description: 'Free, fast, and privacy-preserving web calculators, converters, text utilities, and developer tools.',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteBaseUrl}/#website`,
      name: 'Online Tools',
      url: siteBaseUrl,
      description: 'Use practical calculators, converters, text tools, and other online utilities to get everyday tasks done quickly.',
      publisher: {
        '@id': `${siteBaseUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteBaseUrl}/tools?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'FAQPage',
      mainEntity: homeFaq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer
        }
      }))
    }
  ];

  return (
    <div className="w-full">
      <SEOHelmet
        title="Online Tools – Simple Tools for Everyday Tasks"
        description="Use practical calculators, converters, text tools, and other online utilities to get everyday tasks done quickly."
        canonicalPath="/"
        breadcrumbs={[{ label: 'Home', path: '/' }]}
        schema={homeSchemas}
      />

      {/* 1. HERO SECTION (Full-Width, seamless with navbar, zero detached-box look) */}
      <section
        id="hero-section"
        aria-label="Search and Discovery"
        className="w-full bg-gradient-to-b from-[#FAF5FF] via-[#FAF5FF]/70 to-[#FFFFFF] border-b border-[#EDE9FE] pt-5 pb-7 sm:pt-7 sm:pb-9 px-6 sm:px-10 md:px-12 lg:px-14 text-center relative overflow-hidden"
      >
        {/* Subtle decorative purple glow orbs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#9333EA]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto space-y-3">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold text-[#7C3AED] bg-white border border-[#DDD6FE] shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#7C3AED]" />
            <span>150+ free tools, zero sign-up</span>
          </div>

          {/* H1 Heading with Professional Proportions & Color Accent on Key Words */}
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-[2.15rem] text-[#1E1035] tracking-tight leading-[1.25] max-w-xl mx-auto">
            Free Online{' '}
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#6D28D9] bg-clip-text text-transparent">
              Calculators
            </span>{' '}
            &amp;{' '}
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#6D28D9] bg-clip-text text-transparent">
              Everyday Utilities
            </span>
          </h1>

          {/* Subtext */}
          <p className="font-sans text-xs sm:text-[13px] text-[#6D6582] max-w-lg mx-auto leading-relaxed">
            From loan EMIs to JSON formatting — explore finance, text, converter, and developer utilities designed to save you time. Instant, accurate, and completely free.
          </p>

          {/* Hero Search Bar with Compact, Balanced Width */}
          <div className="max-w-md mx-auto pt-0.5">
            <SearchBar
              isHero={true}
              showButton={true}
              buttonText="Search"
              placeholder="Try 'Loan EMI Calculator' or 'JSON Formatter'"
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="pt-0.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-heading">
            <span className="text-[#6D6582] font-medium mr-0.5">Trending:</span>
            {[
              { label: 'Percentage Calculator', path: '/calculators/percentage-calculator' },
              { label: 'Age Calculator', path: '/date-time/age-calculator' },
              { label: 'Word Counter', path: '/text-tools/word-counter' },
              { label: 'Loan EMI Calculator', path: '/calculators' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => navigate(chip.path)}
                className="px-2.5 py-0.5 rounded-full bg-white text-[#1E1035] border border-[#EDE9FE] hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-[#F5F3FF] shadow-2xs transition-all cursor-pointer font-medium text-[11px]"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Container for Remaining Sections (increased left/right margins, max-w-[1100px]) */}
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 py-6 sm:py-8 space-y-10 sm:space-y-12">
        {/* 2. AD SLOT 1 */}
        <AdSlot id="home-top-ad" type="top-leaderboard" />

        {/* 3. POPULAR TOOLS (Balanced 3-column grid: banner is 2 cols wide with low height, 1 card beside it, 3 cards in Row 2) */}
        <section id="popular-tools-section" aria-labelledby="popular-tools-heading" className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2.5 border-b border-[#EDE9FE]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold uppercase tracking-wider bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] mb-1.5 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Most Popular Utilities</span>
              </div>
              <h2 id="popular-tools-heading" className="font-heading font-bold text-xl sm:text-2xl text-[#1E1035] tracking-tight">
                Popular Tools
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#6D6582] mt-0.5">
                Directly runnable in-browser calculators and converters with real-time results and zero sign-up.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-heading font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors shrink-0 py-1"
            >
              <span>Browse all tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Popular Tools: Unified 3-column grid where Most Used Everyday Tools is the spotlight card in slot #1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5 pt-1">
            {/* Spotlight Card: Most Used Everyday Tools (same width/proportions as tool cards, zero stretching) */}
            <div className="group relative bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#7C3AED] text-white rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_2px_12px_rgba(124,58,237,0.12)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.22)] hover:-translate-y-0.5 transition-all duration-200 border border-purple-300/25 h-full">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8.5 h-8.5 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                    <Zap className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                    Top Trending
                  </span>
                </div>

                <h3 className="font-heading font-bold text-white leading-snug text-[14px] sm:text-[15px] mb-1">
                  Most Used Everyday Tools
                </h3>
                <p className="font-sans text-purple-100/90 text-xs line-clamp-2 leading-relaxed mb-2.5">
                  Instant, privacy-friendly calculators running 100% in your browser without lag or sign-ups.
                </p>
              </div>

              {/* Matching Footer Row */}
              <div className="border-t border-white/15 pt-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-purple-200">
                  <Sparkles className="w-2.5 h-2.5 text-purple-200" />
                  <span>Zero lag</span>
                </span>

                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1 font-heading font-semibold transition-all duration-150 shadow-2xs text-[#4C1D95] bg-white hover:bg-purple-50 px-2.5 py-1 rounded-lg text-[11px] focus:outline-hidden after:absolute after:inset-0"
                >
                  <span>Explore All</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Popular Tool Cards: 5 cards filling the rest of the 2x3 grid */}
            {popularTools.slice(0, 5).map((tool) => (
              <ToolCard key={tool.id} tool={tool} hidePopularBadge={true} />
            ))}
          </div>
        </section>

        {/* 4. TOOL CATEGORIES SECTION */}
      {/* Requirement: Explore All Categories card has wide width, with ONLY 2 cards next to it in Row 1, and the rest below in Row 2! */}
      <section
        id="categories-section"
        aria-labelledby="categories-heading"
        className="rounded-3xl p-5 sm:p-7 bg-white border border-[#EDE9FE] shadow-[0_2px_14px_rgba(124,58,237,0.03)]"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 pb-3 border-b border-[#EDE9FE]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold uppercase tracking-wider bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] mb-1.5 shadow-2xs">
              <LayoutGrid className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Categories Directory</span>
            </div>
            <h2 id="categories-heading" className="font-heading font-bold text-xl sm:text-2xl text-[#1E1035] tracking-tight">
              Find the right tools for every task.
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6D6582] mt-0.5 max-w-2xl">
              Browse categories covering online calculators, developer tools, finance, text utilities, and practical everyday converters.
            </p>
          </div>
          <span className="text-xs font-heading font-bold px-2.5 py-1 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] shrink-0 shadow-2xs">
            {CATEGORIES.length} Categories Available
          </span>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-heading font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'bg-white text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] border border-[#EDE9FE]'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-heading font-semibold shrink-0 transition-all cursor-pointer ${
                selectedCategoryFilter === cat.id
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] border border-[#EDE9FE]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Category Cards Grid: Compact 4-column directory grid, visibly smaller and distinct from the 3-column tool cards above */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 pt-1">
          {/* Spotlight Card: Explore All Categories (Compact height, matching CategoryCard proportions, distinct from big tool banner) */}
          {selectedCategoryFilter === 'all' && (
            <div className="group relative bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#7C3AED] text-white rounded-xl p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-[0_4px_16px_rgba(124,58,237,0.15)] hover:-translate-y-0.5 transition-all duration-200 border border-purple-300/25 h-full min-h-[110px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                    <LayoutGrid className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                    {CATEGORIES.length} Categories
                  </span>
                </div>

                <h3 className="font-heading font-bold text-xs sm:text-[13px] text-white leading-snug">
                  Explore All Categories
                </h3>
                <p className="font-sans text-purple-100/90 text-[11px] line-clamp-1 leading-normal mt-0.5">
                  150+ calculators &amp; developer utilities
                </p>
              </div>

              {/* Compact Footer Row */}
              <div className="pt-1.5 mt-1.5 border-t border-white/15 flex items-center justify-between text-[11px]">
                <span className="text-[10px] text-purple-200 font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-200" />
                  <span>150+ Tools</span>
                </span>

                <Link
                  href="/tools"
                  className="inline-flex items-center gap-0.5 font-heading font-semibold text-[11px] text-white group-hover:translate-x-0.5 transition-transform focus:outline-hidden after:absolute after:inset-0"
                >
                  <span>Browse</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Category Cards: Rendered with compact, smaller cards */}
          {filteredCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}

          {/* 8th Slot: Suggest a Tool card to keep the 4-column grid 100% complete and balanced in Row 2 */}
          {selectedCategoryFilter === 'all' && (
            <Link
              href="/request-a-tool"
              className="group relative bg-[#FAF9FE] border border-dashed border-[#DDD6FE] hover:border-[#7C3AED] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 hover:bg-[#F5F3FF] hover:-translate-y-0.5 h-full min-h-[110px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-white text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE] shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-200">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-heading font-medium px-2 py-0.5 rounded-full bg-white text-[#7C3AED] border border-[#DDD6FE]">
                    Community
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xs sm:text-[13px] text-[#1E1035] group-hover:text-[#7C3AED] transition-colors leading-snug">
                  Request a Tool
                </h3>
                <p className="font-sans text-[11px] text-[#6D6582] line-clamp-1 leading-normal mt-0.5">
                  Need a custom tool? Ask us to build it.
                </p>
              </div>
              <div className="pt-1.5 mt-1.5 border-t border-[#EDE9FE] flex items-center justify-between text-[11px]">
                <span className="text-[10px] font-medium text-[#9D95B3]">Custom build</span>
                <span className="inline-flex items-center gap-0.5 font-heading font-semibold text-[11px] text-[#7C3AED] group-hover:translate-x-0.5 transition-transform">
                  <span>Suggest</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* 5. WHY USE OUR TOOLS */}
      <section
        id="why-us-section"
        aria-labelledby="why-us-heading"
        className="border border-[#EDE9FE] rounded-3xl bg-[#FFFFFF] p-5 sm:p-7 shadow-[0_2px_14px_rgba(124,58,237,0.03)]"
      >
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold uppercase tracking-wider bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Built For Speed &amp; Accuracy</span>
          </div>
          <h2 id="why-us-heading" className="font-heading font-bold text-xl sm:text-2xl text-[#1E1035] tracking-tight">
            Why Use Our Tools
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#6D6582] mt-0.5">
            Practical utilities designed for straightforward results and everyday convenience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-start p-4 rounded-2xl bg-white border border-[#EDE9FE] shadow-2xs hover:border-[#DDD6FE] hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mb-2.5 shadow-2xs">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1E1035]">Ultra Fast</h3>
            <p className="font-sans text-xs text-[#6D6582] mt-1 leading-relaxed">
              Every tool executes immediately in your browser with zero network lag or waiting.
            </p>
          </div>

          <div className="flex flex-col items-start p-4 rounded-2xl bg-white border border-[#EDE9FE] shadow-2xs hover:border-[#DDD6FE] hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] flex items-center justify-center mb-2.5 shadow-2xs">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1E1035]">No Registration</h3>
            <p className="font-sans text-xs text-[#6D6582] mt-1 leading-relaxed">
              Completely free and open. No email signup, logins, or hidden paywalls.
            </p>
          </div>

          <div className="flex flex-col items-start p-4 rounded-2xl bg-white border border-[#EDE9FE] shadow-2xs hover:border-[#DDD6FE] hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#9333EA] border border-[#DDD6FE] flex items-center justify-center mb-2.5 shadow-2xs">
              <FileCheck className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1E1035]">Transparent Math</h3>
            <p className="font-sans text-xs text-[#6D6582] mt-1 leading-relaxed">
              Calculations include clear mathematical formulas and breakdown explanations.
            </p>
          </div>

          <div className="flex flex-col items-start p-4 rounded-2xl bg-white border border-[#EDE9FE] shadow-2xs hover:border-[#DDD6FE] hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE] flex items-center justify-center mb-2.5 shadow-2xs">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1E1035]">Fully Responsive</h3>
            <p className="font-sans text-xs text-[#6D6582] mt-1 leading-relaxed">
              Seamlessly designed for mobile phones, tablets, laptops, and large desktop screens.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HELPFUL GUIDES & BLOG SECTION */}
      <section id="helpful-guides-section" aria-labelledby="guides-heading" className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2.5 border-b border-[#EDE9FE]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold uppercase tracking-wider bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] mb-1.5 shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Articles &amp; Tutorials</span>
            </div>
            <h2 id="guides-heading" className="font-heading font-bold text-xl sm:text-2xl text-[#1E1035] tracking-tight">
              Helpful Guides &amp; Blog Posts
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6D6582] mt-0.5">
              Step-by-step formulas, comprehensive tutorials, and practical mathematical explanations.
            </p>
          </div>
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-heading font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors shrink-0 py-1"
          >
            <span>All articles ({GUIDES.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 cards per line grid on desktop, including the Standout Feature Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5 pt-1">
          {/* Standout Feature Card: Knowledge Hub & Guides (Compact, matching GuideCard scale) */}
          <div className="group relative bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#7C3AED] text-white rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-[0_8px_24px_rgba(124,58,237,0.18)] hover:-translate-y-0.5 transition-all duration-200 h-full overflow-hidden border border-purple-300/25">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                  Knowledge Hub
                </span>
              </div>

              <div className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-200 bg-white/10 px-2 py-0.5 rounded-md mb-2">
                <Sparkles className="w-2.5 h-2.5 text-purple-200" />
                <span>Formulas &amp; Explanations</span>
              </div>

              <h3 className="font-heading font-bold text-xs sm:text-[14px] text-white leading-snug mb-1">
                Practical Guides &amp; Math Deep-Dives
              </h3>
              <p className="font-sans text-[11px] text-purple-100/90 leading-relaxed line-clamp-3 mb-2">
                Step-by-step tutorials explaining standard calculation formulas, loan amortizations, and text analysis methods.
              </p>
            </div>

            <div className="relative z-10 pt-2 mt-auto border-t border-white/15 flex items-center justify-between text-[11px]">
              <span className="text-[10px] font-medium text-purple-200">
                {GUIDES.length}+ Articles
              </span>
              <Link
                href="/guides"
                className="inline-flex items-center gap-0.5 font-heading font-semibold text-[11px] text-white group-hover:translate-x-0.5 transition-transform focus:outline-hidden after:absolute after:inset-0"
              >
                <span>Browse All</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>

            {/* Decorative subtle backdrop orb */}
            <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {guidesList.slice(0, 5).map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </section>

      {/* 7. AD SLOT 2 */}
      <AdSlot id="home-bottom-ad" type="bottom-leaderboard" />

        {/* 8. FAQ */}
        <FAQAccordion
          items={homeFaq}
          title="Frequently Asked Questions"
          description="Common questions about using our online tools and calculators."
        />
      </div>
    </div>
  );
}
