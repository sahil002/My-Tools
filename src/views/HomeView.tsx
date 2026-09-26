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
  const [subscribed, setSubscribed] = useState(() => {
    try {
      return localStorage.getItem('online_tools_subscribed') === 'true';
    } catch {
      return false;
    }
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribeEmail.trim() && subscribeEmail.includes('@')) {
      setSubscribed(true);
      try {
        localStorage.setItem('online_tools_subscribed', 'true');
      } catch {
        // ignore
      }
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

      {/* 1. HERO SECTION (Full-Width, seamless with navbar, standard responsive padding) */}
      <section
        id="hero-section"
        aria-label="Search and Discovery"
        className="w-full bg-gradient-to-b from-[#FAF5FF] via-[#FAF5FF]/70 to-[#FFFFFF] border-b border-[#EDE9FE] pt-8 pb-10 sm:pt-12 sm:pb-14 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden"
      >
        {/* Subtle decorative purple glow orbs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#9333EA]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-3.5">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-white border border-[#DDD6FE] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>150+ Free Tools &amp; Calculators · Zero Sign-Up</span>
          </div>

          {/* H1 Heading with Professional Proportions & Color Accent on Key Words */}
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] text-[#1E1035] tracking-tight leading-[1.2] max-w-2xl mx-auto">
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
          <p className="font-sans text-sm sm:text-base text-[#6D6582] max-w-xl mx-auto leading-relaxed">
            From loan EMIs to JSON formatting — explore finance, text, converter, and developer utilities designed to save you time. Instant, accurate, and completely free.
          </p>

          {/* Hero Search Bar with Clean, Balanced Width */}
          <div className="max-w-[440px] sm:max-w-[460px] mx-auto pt-1">
            <SearchBar
              isHero={true}
              showButton={true}
              buttonText="Search"
              placeholder="Try 'Loan EMI Calculator' or 'JSON Formatter'"
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-heading">
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
                className="px-3 py-1 rounded-full bg-white text-[#1E1035] border border-[#EDE9FE] hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-[#F5F3FF] shadow-2xs transition-all cursor-pointer font-medium text-xs"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Container for Remaining Sections (standard max-w-7xl with spacious, balanced padding) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* 2. AD SLOT 1 */}
        <AdSlot id="home-top-ad" type="top-leaderboard" />

        {/* 3. POPULAR TOOLS */}
        <section id="popular-tools-section" aria-labelledby="popular-tools-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#EDE9FE]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-2 shadow-2xs">
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
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors shrink-0 py-1"
            >
              <span>Browse all tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Popular Tools: Unified 3-column grid where Most Used Everyday Tools is the spotlight card in slot #1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-1">
            {/* Spotlight Card: Most Used Everyday Tools */}
            <div className="group relative bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#7C3AED] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(124,58,237,0.14)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.22)] hover:-translate-y-0.5 transition-all duration-200 border border-purple-300/25 h-full">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="w-8.5 h-8.5 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                    <Zap className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25 shadow-2xs">
                    Top Trending
                  </span>
                </div>

                <h3 className="font-heading font-bold text-white leading-snug text-base sm:text-lg mb-1.5">
                  Most Used Everyday Tools
                </h3>
                <p className="font-sans text-purple-100/90 text-xs sm:text-[13px] line-clamp-2 leading-relaxed mb-3">
                  Instant, privacy-friendly calculators running 100% in your browser without lag or sign-ups.
                </p>
              </div>

              {/* Matching Footer Row */}
              <div className="border-t border-white/15 pt-2.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-200">
                  <Sparkles className="w-3 h-3 text-purple-200" />
                  <span>Zero lag</span>
                </span>

                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1 font-heading font-semibold transition-all duration-150 shadow-2xs text-[#4C1D95] bg-white hover:bg-purple-50 px-3 py-1.5 rounded-lg text-xs focus:outline-hidden after:absolute after:inset-0"
                >
                  <span>Explore All</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
        <section
          id="categories-section"
          aria-labelledby="categories-heading"
          className="rounded-3xl p-5 sm:p-7 bg-white border border-[#EDE9FE] shadow-[0_2px_14px_rgba(124,58,237,0.03)]"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-3 border-b border-[#EDE9FE]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-2 shadow-2xs">
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
            <span className="text-xs font-heading font-bold px-3 py-1 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] shrink-0 shadow-2xs">
              {CATEGORIES.length} Categories Available
            </span>
          </div>

          {/* Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-semibold shrink-0 transition-all cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-semibold shrink-0 transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'bg-white text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] border border-[#EDE9FE]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Category Cards Grid: 4-column balanced directory grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Spotlight Card: Explore All Categories */}
            {selectedCategoryFilter === 'all' && (
              <div className="group relative bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#7C3AED] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(124,58,237,0.14)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.22)] hover:-translate-y-0.5 transition-all duration-200 border border-purple-300/25 h-full">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="w-8.5 h-8.5 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                      <LayoutGrid className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25 shadow-2xs">
                      {CATEGORIES.length} Categories
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base sm:text-lg text-white leading-snug mb-1">
                    Explore All Categories
                  </h3>
                  <p className="font-sans text-purple-100/90 text-xs sm:text-[13px] line-clamp-2 leading-relaxed mb-3">
                    Discover calculators, converters, time tools, developer engines, and finance utilities.
                  </p>
                </div>

                {/* Footer Row */}
                <div className="pt-2.5 mt-auto border-t border-white/15 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-purple-200 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-200" />
                    <span>150+ Tools</span>
                  </span>

                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-1 font-heading font-semibold text-xs text-[#4C1D95] bg-white hover:bg-purple-50 px-3 py-1 rounded-lg transition-all shadow-2xs focus:outline-hidden after:absolute after:inset-0"
                  >
                    <span>Browse All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Category Cards */}
            {filteredCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}

            {/* 8th Slot: Suggest a Tool card */}
            {selectedCategoryFilter === 'all' && (
              <Link
                href="/request-a-tool"
                className="group relative bg-[#FAF9FE] border border-dashed border-[#DDD6FE] hover:border-[#7C3AED] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:bg-[#F5F3FF] hover:-translate-y-0.5 h-full"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="w-8.5 h-8.5 rounded-xl bg-white text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE] shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-200 shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-heading font-semibold px-2.5 py-0.5 rounded-full bg-white text-[#7C3AED] border border-[#DDD6FE]">
                      Community
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#1E1035] group-hover:text-[#7C3AED] transition-colors leading-snug">
                    Request a Tool
                  </h3>
                  <p className="font-sans text-xs text-[#6D6582] line-clamp-2 leading-relaxed mt-1">
                    Need a custom calculator or converter? We build requested utilities for free.
                  </p>
                </div>
                <div className="pt-2.5 mt-3 border-t border-[#EDE9FE] flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-[#9D95B3]">Custom build</span>
                  <span className="inline-flex items-center gap-1 font-heading font-semibold text-xs text-[#7C3AED] group-hover:translate-x-0.5 transition-transform">
                    <span>Suggest</span>
                    <ArrowRight className="w-3 h-3" />
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
          className="border border-[#EDE9FE] rounded-3xl bg-[#FFFFFF] p-6 sm:p-8 shadow-[0_2px_14px_rgba(124,58,237,0.03)]"
        >
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Why Choose Us</span>
            </div>
            <h2 id="why-us-heading" className="font-heading font-bold text-xl sm:text-2xl text-[#1E1035] tracking-tight">
              Built For Speed, Privacy &amp; Everyday Accuracy
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6D6582] mt-0.5">
              Practical utilities designed for straightforward results, zero delays, and everyday convenience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] border border-[#EDE9FE] shadow-2xs hover:border-[#DDD6FE] hover:shadow-xs transition-all">
              <div>
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shadow-2xs">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                    0ms Latency
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-[#1E1035]">Ultra Fast Execution</h3>
                <p className="font-sans text-xs sm:text-[13px] text-[#6D6582] mt-1.5 leading-relaxed">
                  Every calculation executes immediately in your browser with zero network lag or waiting.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] border border-[#EDE9FE] shadow-2xs hover:border-[#DDD6FE] hover:shadow-xs transition-all">
              <div>
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]">
                    No Logins
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-[#1E1035]">Zero Registration</h3>
                <p className="font-sans text-xs sm:text-[13px] text-[#6D6582] mt-1.5 leading-relaxed">
                  Completely free and open. No email signup required, no logins, and zero paywalls.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] border border-[#EDE9FE] shadow-2xs hover:border-[#DDD6FE] hover:shadow-xs transition-all">
              <div>
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#9333EA] border border-[#DDD6FE] flex items-center justify-center shadow-2xs">
                    <FileCheck className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#9333EA] border border-[#DDD6FE]">
                    Open Math
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-[#1E1035]">Transparent Math</h3>
                <p className="font-sans text-xs sm:text-[13px] text-[#6D6582] mt-1.5 leading-relaxed">
                  Calculations include clear mathematical formulas, variable definitions, and breakdown explanations.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] border border-[#EDE9FE] shadow-2xs hover:border-[#DDD6FE] hover:shadow-xs transition-all">
              <div>
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE] flex items-center justify-center shadow-2xs">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]">
                    All Devices
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-[#1E1035]">Fully Responsive</h3>
                <p className="font-sans text-xs sm:text-[13px] text-[#6D6582] mt-1.5 leading-relaxed">
                  Seamlessly responsive layouts that work flawlessly on mobile phones, tablets, and large screens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. HELPFUL GUIDES & BLOG SECTION */}
        <section id="helpful-guides-section" aria-labelledby="guides-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#EDE9FE]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-2 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Knowledge Base &amp; Guides</span>
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
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors shrink-0 py-1"
            >
              <span>All articles ({GUIDES.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3 cards per line grid on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-1">
            {/* Standout Feature Card: Knowledge Hub & Guides */}
            <div className="group relative bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#7C3AED] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(124,58,237,0.14)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.22)] hover:-translate-y-0.5 transition-all duration-200 h-full overflow-hidden border border-purple-300/25">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="w-8.5 h-8.5 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25 shadow-2xs">
                    Knowledge Hub
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-200 bg-white/10 px-2.5 py-1 rounded-md mb-2.5">
                  <Sparkles className="w-3 h-3 text-purple-200" />
                  <span>Formulas &amp; Explanations</span>
                </div>

                <h3 className="font-heading font-bold text-base sm:text-lg text-white leading-snug mb-1.5">
                  Practical Guides &amp; Math Deep-Dives
                </h3>
                <p className="font-sans text-xs sm:text-[13px] text-purple-100/90 leading-relaxed line-clamp-3 mb-3">
                  Step-by-step tutorials explaining standard calculation formulas, loan amortizations, and text analysis methods.
                </p>
              </div>

              <div className="relative z-10 pt-2.5 mt-auto border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-purple-200">
                  {GUIDES.length}+ Articles
                </span>
                <Link
                  href="/guides"
                  className="inline-flex items-center gap-1 font-heading font-semibold text-xs text-[#4C1D95] bg-white hover:bg-purple-50 px-3 py-1 rounded-lg transition-all shadow-2xs focus:outline-hidden after:absolute after:inset-0"
                >
                  <span>Browse All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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

        {/* 7. NEW SECTION: Email Subscription for Tool Updates */}
        <section
          id="newsletter-section"
          aria-labelledby="newsletter-heading"
          className="relative rounded-3xl bg-gradient-to-br from-[#2E0854] via-[#4C1D95] to-[#7C3AED] text-white p-6 sm:p-10 lg:p-12 overflow-hidden shadow-[0_12px_40px_rgba(124,58,237,0.18)] border border-purple-400/20"
        >
          {/* Decorative Background Orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl pointer-events-none transform -translate-x-10 translate-y-10" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-white/15 text-white border border-white/25 backdrop-blur-xs shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Weekly Updates · Zero Spam</span>
            </div>

            <h2 id="newsletter-heading" className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
              Get New Tools &amp; Calculators Delivered to Your Inbox
            </h2>

            <p className="font-sans text-xs sm:text-sm text-purple-100/90 leading-relaxed max-w-lg mx-auto">
              We add new in-browser calculators, text formatters, and developer converters every week. Stay ahead with instant, privacy-friendly updates.
            </p>

            {subscribed ? (
              <div className="p-4 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md text-center max-w-md mx-auto space-y-1.5 animate-in fade-in duration-200">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500 text-white mx-auto shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-white">
                  You're Subscribed!
                </h3>
                <p className="font-sans text-xs text-purple-100">
                  Thank you! You'll be the first to know whenever a brand-new tool or converter is published.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="pt-2 max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <div className="flex items-center gap-2.5 px-3 py-2 w-full text-white">
                    <Mail className="w-4 h-4 text-purple-200 shrink-0" />
                    <input
                      type="email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      required
                      className="w-full bg-transparent text-white placeholder-purple-200/70 text-xs sm:text-sm font-sans focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-xl bg-white text-[#4C1D95] hover:bg-purple-50 font-heading font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Subscribe Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-purple-200/80 font-sans">
                  <span>✓ 100% Free Forever</span>
                  <span>•</span>
                  <span>✓ No Spam Guaranteed</span>
                  <span>•</span>
                  <span>✓ Unsubscribe Anytime</span>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* 8. AD SLOT 2 */}
        <AdSlot id="home-bottom-ad" type="bottom-leaderboard" />

        {/* 9. FAQ */}
        <FAQAccordion
          items={homeFaq}
          title="Frequently Asked Questions"
          description="Common questions about using our online tools and calculators."
        />
      </div>
    </div>
  );
}
