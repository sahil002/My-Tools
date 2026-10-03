import { useState, useEffect, useId } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { CATEGORIES } from '../data/categories';
import { getSiteUrl } from '../data/siteConfig';
import { Link } from '../context/RouterContext';
import { getAllMergedGuidesSync, GUIDES_UPDATED_EVENT } from '../services/guideStorageDB';
import {
  Search,
  X,
  BookOpen,
  Sparkles,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Mail,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { subscribeUser } from '../services/subscriberService';

export function GuidesDirectoryView() {
  const searchInputId = useId();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    }
    return '';
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);

  const [allGuides, setAllGuides] = useState(getAllMergedGuidesSync);

  useEffect(() => {
    const handleUpdate = () => {
      setAllGuides(getAllMergedGuidesSync());
    };
    window.addEventListener(GUIDES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(GUIDES_UPDATED_EVENT, handleUpdate);
  }, []);

  // Dynamic filter against the central guides registry
  const filteredGuides = allGuides.filter((guide) => {
    const matchesCategory =
      selectedCategory === 'all' || guide.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      guide.title.toLowerCase().includes(q) ||
      guide.description.toLowerCase().includes(q) ||
      guide.category.toLowerCase().includes(q) ||
      (guide.relatedTools &&
        guide.relatedTools.some((toolId) => toolId.toLowerCase().includes(q)));

    return matchesCategory && matchesSearch;
  });

  const featuredGuide = allGuides.find((g) => g.slug === 'how-compound-interest-works') || allGuides[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    const res = subscribeUser(newsletterEmail, 'blog_sidebar');
    setNewsletterStatus(res.message);
    if (res.success) {
      setNewsletterEmail('');
      setTimeout(() => setNewsletterStatus(null), 4000);
    }
  };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guides & Mathematical Tutorials – PRBSolver',
    description:
      'In-depth, mathematically grounded guides, formulas, worked calculations, and clear step-by-step instructions for everyday online utilities.',
    url: `${getSiteUrl()}/guides`,
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      <SEOHelmet
        title="Guides &amp; Tutorials – Step-by-Step Formulas &amp; Practical Explanations | PRBSolver"
        description="In-depth, mathematically grounded guides, formulas, worked calculations, and clear step-by-step instructions for everyday online utilities."
        canonicalPath="/guides"
        breadcrumbs={[{ label: 'Guides', path: '/guides' }]}
        schema={schema}
      />

      {/* 1. Breadcrumb: Home → Guides */}
      <Breadcrumbs items={[{ label: 'Guides & Articles', path: '/guides' }]} />

      {/* 2. Publication Header */}
      <header className="border-b border-[#EDE9FE] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE] shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs font-heading font-bold text-[#7C3AED] uppercase tracking-wider">
            PRBSolver Knowledge Base
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-[#1E1035] tracking-tight">
          Guides, Formulas &amp; Mathematical Tutorials
        </h1>
        <p className="text-xs sm:text-sm font-sans text-[#6D6582] max-w-3xl leading-relaxed">
          Clear mathematical explanations, practical formulas, worked calculation examples, and instructions designed to help you solve real everyday problems.
        </p>
      </header>

      {/* 3. Search & Filter Bar */}
      <section aria-label="Search and filter articles" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Prominent Search */}
          <div className="relative flex-1 max-w-lg">
            <Search
              className="w-4 h-4 text-[#7C3AED] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides by title, formula, or topic..."
              className="w-full bg-white border border-[#DDD6FE] rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#1E1035] placeholder-[#9D95B3] outline-none focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all font-sans shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9D95B3] hover:text-[#1E1035] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-[#6D6582] font-heading font-medium self-end sm:self-center">
            Showing <strong className="text-[#1E1035]">{filteredGuides.length}</strong> of {allGuides.length} guides
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-semibold transition-all cursor-pointer shrink-0 border ${
              selectedCategory === 'all'
                ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
                : 'bg-white text-[#6D6582] border-[#EDE9FE] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
            }`}
          >
            All Categories ({allGuides.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = allGuides.filter((g) => g.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-semibold transition-all cursor-pointer shrink-0 border ${
                  selectedCategory === cat.id
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
                    : 'bg-white text-[#6D6582] border-[#EDE9FE] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Articles Grid */}
      {filteredGuides.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#EDE9FE] rounded-3xl space-y-3 shadow-2xs">
          <BookOpen className="w-10 h-10 text-[#9D95B3] mx-auto" />
          <h3 className="font-heading font-bold text-base text-[#1E1035]">No Guides Match Your Search</h3>
          <p className="text-xs text-[#6D6582] max-w-sm mx-auto">
            Try adjusting your search terms or selecting &apos;All Categories&apos; to view all tutorials.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <article
              key={guide.slug}
              className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(124,58,237,0.03)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] hover:border-[#DDD6FE] transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                    {guide.category}
                  </span>
                  <span className="text-[#9D95B3] flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-[#7C3AED]" />
                    {guide.readingTime}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-base text-[#1E1035] group-hover:text-[#7C3AED] transition-colors leading-snug">
                  <Link href={`/guides/${guide.slug}`}>
                    {guide.title}
                  </Link>
                </h3>

                <p className="text-xs text-[#6D6582] line-clamp-3 leading-relaxed font-sans">
                  {guide.description}
                </p>

                {guide.formula && (
                  <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-[11px] font-mono text-[#7C3AED] truncate font-bold">
                    Formula: {guide.formula}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#EDE9FE] flex items-center justify-between text-xs">
                <span className="text-[#9D95B3] font-medium truncate max-w-[140px]">
                  By {guide.author}
                </span>

                <Link
                  href={`/guides/${guide.slug}`}
                  className="font-heading font-bold text-xs text-[#7C3AED] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 6. Newsletter Subscription Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#FAF9FE] border border-[#EDE9FE] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-1.5 max-w-lg">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-xs font-heading font-bold text-[#7C3AED] uppercase tracking-wider">
              PRBSolver Newsletter &amp; Formula Alerts
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-heading font-extrabold text-[#1E1035] tracking-tight">
            Never Miss a New Calculator or Step-by-Step Guide
          </h2>
          <p className="text-xs text-[#6D6582] leading-relaxed">
            Get instant email notifications whenever we release a new free mathematical utility or comprehensive explanation. 100% spam-free.
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            placeholder="Enter your email address..."
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            className="px-4 py-2.5 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none min-w-[260px] shadow-2xs"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            Subscribe Free
          </button>
        </form>
      </section>
      {newsletterStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{newsletterStatus}</span>
        </div>
      )}
    </div>
  );
}
