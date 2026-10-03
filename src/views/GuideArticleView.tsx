import { useState, useEffect } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { FAQAccordion } from '../components/FAQAccordion';
import { GuideCard } from '../components/GuideCard';
import { SEOHelmet } from '../components/SEOHelmet';
import { AdSlotPlaceholder } from '../components/AdSlotPlaceholder';
import { Link } from '../context/RouterContext';
import { getGuideBySlug, GUIDES } from '../data/guides';
import { TOOLS } from '../data/tools';
import { getCategoryBySlug } from '../data/categories';
import { getSiteUrl } from '../data/siteConfig';
import {
  Clock,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Calculator,
  Share2,
  Copy,
  Check,
  Twitter,
  Linkedin,
  Sparkles,
  BookOpen,
  Mail,
  CheckCircle2,
  Bookmark,
  Heart,
  MessageSquare,
  Star,
  Send,
  Eye,
} from 'lucide-react';
import { subscribeUser } from '../services/subscriberService';
import {
  getGuideMetricsSync,
  recordGuideView,
  recordGuideShare,
  toggleGuideLike,
  isGuideLikedByUser,
  toggleGuideFavorite,
  isGuideFavoritedByUser,
  getApprovedCommentsForGuide,
  submitGuideComment,
  GuideComment,
  GUIDE_METRICS_UPDATED_EVENT,
  GUIDE_COMMENTS_UPDATED_EVENT,
} from '../services/guideAnalyticsService';

interface GuideArticleViewProps {
  slug: string;
}

export function GuideArticleView({ slug }: GuideArticleViewProps) {
  const guide = getGuideBySlug(slug);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);

  // Engagement states
  const [metrics, setMetrics] = useState(() => getGuideMetricsSync(slug));
  const [isLiked, setIsLiked] = useState(() => isGuideLikedByUser(slug));
  const [isFavorited, setIsFavorited] = useState(() => isGuideFavoritedByUser(slug));
  const [comments, setComments] = useState<GuideComment[]>(() => getApprovedCommentsForGuide(slug));

  // Comment Form state
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentNotice, setCommentNotice] = useState<string | null>(null);

  // Track page view and active reading duration
  useEffect(() => {
    const startTime = Date.now();
    recordGuideView(slug, 0);

    const handleMetricsUpdate = (e: any) => {
      if (!e.detail?.slug || e.detail.slug === slug) {
        setMetrics(getGuideMetricsSync(slug));
      }
    };
    const handleCommentsUpdate = () => {
      setComments(getApprovedCommentsForGuide(slug));
    };

    window.addEventListener(GUIDE_METRICS_UPDATED_EVENT, handleMetricsUpdate);
    window.addEventListener(GUIDE_COMMENTS_UPDATED_EVENT, handleCommentsUpdate);

    return () => {
      window.removeEventListener(GUIDE_METRICS_UPDATED_EVENT, handleMetricsUpdate);
      window.removeEventListener(GUIDE_COMMENTS_UPDATED_EVENT, handleCommentsUpdate);
      const seconds = Math.round((Date.now() - startTime) / 1000);
      if (seconds >= 4) {
        recordGuideView(slug, seconds);
      }
    };
  }, [slug]);

  if (!guide) {
    return (
      <div className="py-20 text-center font-sans max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto shadow-2xs">
          <BookOpen className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-[#1E1035]">Article Not Found</h1>
        <p className="text-xs sm:text-sm text-[#6D6582]">
          The guide you requested does not exist or has been relocated to another topic.
        </p>
        <Link
          href="/guides"
          className="inline-block px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-semibold transition-all shadow-xs"
        >
          Explore All Guides &amp; Tutorials
        </Link>
      </div>
    );
  }

  const category = getCategoryBySlug(guide.category);
  const categoryName = category ? category.name : guide.category;

  const relatedToolsList = TOOLS.filter(
    (t) => guide.relatedTools?.includes(t.id) || guide.relatedTools?.includes(t.slug)
  );
  const relatedGuidesList = GUIDES.filter(
    (g) => guide.relatedGuides?.includes(g.slug) && g.slug !== guide.slug
  );

  const baseUrl = getSiteUrl().replace(/\/+$/, '');
  const breadcrumbItems = [
    { label: 'Guides & Articles', path: '/guides' },
    { label: categoryName, path: `/${guide.category}` },
    { label: guide.title, path: `/guides/${guide.slug}` },
  ];

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      recordGuideShare(guide.slug);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleLike = () => {
    const res = toggleGuideLike(guide.slug);
    setIsLiked(res.isLiked);
    setMetrics((prev) => ({ ...prev, likes: res.newLikesCount }));
  };

  const handleFavorite = () => {
    const res = toggleGuideFavorite(guide.slug);
    setIsFavorited(res.isFavorited);
    setMetrics((prev) => ({ ...prev, favorites: res.newFavoritesCount }));
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await submitGuideComment({
        guideSlug: guide.slug,
        authorName: commentAuthor,
        authorEmail: commentEmail,
        content: commentContent,
        rating: commentRating,
      });

      if (res.success && res.comment) {
        setComments((prev) => [res.comment!, ...prev]);
        setCommentContent('');
        setCommentNotice('Thank you! Your comment has been posted.');
        setTimeout(() => setCommentNotice(null), 4000);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

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

  // Article + FAQ Schema
  const articleSchema: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      author: {
        '@type': 'Organization',
        name: guide.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'PRBSolver',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
      },
      datePublished: guide.publishedDate,
      dateModified: guide.updatedDate || guide.publishedDate,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/guides/${guide.slug}`,
      },
    },
  ];

  if (guide.faq && guide.faq.length > 0) {
    articleSchema.push({
      '@type': 'FAQPage',
      mainEntity: guide.faq.map((f) => ({
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
    <article className="space-y-8 max-w-4xl mx-auto font-sans">
      <SEOHelmet
        title={`${guide.title} | PRBSolver Guides`}
        description={guide.description}
        canonicalPath={`/guides/${guide.slug}`}
        ogType="article"
        breadcrumbs={breadcrumbItems}
        schema={articleSchema}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Article Header */}
      <header className="border-b border-[#EDE9FE] pb-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Link
            href={`/${guide.category}`}
            className="text-[11px] font-heading font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE] hover:bg-[#EDE9FE] transition-colors"
          >
            {categoryName}
          </Link>
          <span className="text-[#9D95B3]">•</span>
          <span className="text-[#6D6582] flex items-center gap-1 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
            {guide.readingTime}
          </span>
          <span className="text-[#9D95B3]">•</span>
          <span className="text-[#6D6582] flex items-center gap-1 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-[#6D6582]" />
            Updated {guide.updatedDate}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-heading font-extrabold text-[#1E1035] tracking-tight leading-[1.2]">
          {guide.title}
        </h1>

        <p className="text-sm sm:text-base font-sans text-[#6D6582] leading-relaxed">
          {guide.description}
        </p>

        {/* Author Bio & Social Share / Engagement Bar */}
        <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border-t border-[#EDE9FE]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {guide.author.charAt(0)}
            </div>
            <div>
              <span className="block font-heading font-bold text-[#1E1035] leading-tight">{guide.author}</span>
              <span className="text-[10px] text-[#9D95B3]">Reviewed by PRBSolver Editorial Desk</span>
            </div>
          </div>

          {/* Interactive Engagement Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] text-[#6D6582] text-xs font-mono">
              <Eye className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{metrics.views.toLocaleString()}</span>
            </span>

            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-heading font-semibold transition-all cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-2xs'
                  : 'bg-white border-[#EDE9FE] text-[#6D6582] hover:text-rose-600 hover:border-rose-200'
              }`}
              title="Like this guide"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{metrics.likes}</span>
            </button>

            <button
              type="button"
              onClick={handleFavorite}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-heading font-semibold transition-all cursor-pointer ${
                isFavorited
                  ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-2xs'
                  : 'bg-white border-[#EDE9FE] text-[#6D6582] hover:text-amber-600 hover:border-amber-200'
              }`}
              title="Bookmark / Save to Favorites"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{metrics.favorites || 0}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE9FE] bg-white hover:bg-[#F5F3FF] text-[#6D6582] hover:text-[#7C3AED] transition-colors cursor-pointer text-xs font-heading font-semibold"
              title="Share article link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : `${metrics.shares} Shares`}</span>
            </button>

            <a
              href="#guide-comments-section"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE9FE] bg-white hover:bg-[#F5F3FF] text-[#6D6582] hover:text-[#7C3AED] transition-colors text-xs font-heading font-semibold"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{comments.length}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Quick Answer Summary Callout Box */}
      {guide.quickAnswer && (
        <div className="p-5 bg-gradient-to-r from-[#FAF8FE] via-[#F5F3FF] to-[#FAF8FE] border-2 border-[#DDD6FE] rounded-2xl shadow-xs space-y-1.5">
          <div className="text-xs font-heading font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            <span>Key Takeaway &amp; Quick Formula</span>
          </div>
          <p className="text-xs sm:text-sm text-[#1E1035] leading-relaxed font-sans font-medium">
            {guide.quickAnswer}
          </p>
        </div>
      )}

      {/* Formula Highlight Box */}
      {guide.formula && (
        <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="text-xs font-heading font-bold uppercase tracking-wider text-[#6D6582] flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Core Mathematical Formula</span>
          </div>
          <div className="p-3.5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl font-mono text-sm sm:text-base font-bold text-[#7C3AED] break-all">
            {guide.formula}
          </div>
        </div>
      )}

      {/* Table of Contents Box */}
      {guide.sections && guide.sections.length > 0 && (
        <nav aria-label="Table of Contents" className="p-4 sm:p-5 bg-white border border-[#EDE9FE] rounded-2xl shadow-2xs space-y-2.5">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#1E1035] flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Table of Contents</span>
          </span>
          <ul className="space-y-1 text-xs text-[#6D6582] pl-2">
            {guide.sections.map((sec, i) => (
              <li key={i}>
                <a
                  href={`#sec-${i}`}
                  className="hover:text-[#7C3AED] transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[#9D95B3] font-mono text-[11px]">{i + 1}.</span>
                  <span>{sec.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Main Content Sections (Supports WordPress Rich HTML & Structured Sections) */}
      {guide.contentHtml ? (
        <div
          className="article-body prose prose-purple max-w-none text-sm sm:text-base leading-relaxed text-[#1E1035] space-y-4 font-sans"
          dangerouslySetInnerHTML={{ __html: guide.contentHtml }}
        />
      ) : (
        <div className="space-y-8 text-sm sm:text-base text-[#1E1035] leading-relaxed font-sans">
          {guide.sections.map((sec, idx) => (
            <section key={idx} id={`sec-${idx}`} className="space-y-3 pt-2">
              {sec.title && (
                <h2 className="text-lg sm:text-xl font-heading font-extrabold text-[#1E1035] tracking-tight">
                  {sec.title}
                </h2>
              )}
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-[#6D6582] text-xs sm:text-sm leading-relaxed font-sans">
                  {p}
                </p>
              ))}

              {sec.listItems && (
                <ul className="space-y-2 text-xs sm:text-sm text-[#1E1035] pl-2 list-none my-3 font-sans">
                  {sec.listItems.map((item, lIdx) => (
                    <li key={lIdx} className="flex items-start gap-2 text-[#6D6582]">
                      <span className="text-[#7C3AED] font-bold mt-0.5">•</span>
                      <span className="text-[#1E1035]">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {sec.table && (
                <div className="overflow-x-auto my-4 border border-[#EDE9FE] rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs divide-y divide-[#EDE9FE]">
                    <thead className="bg-[#FAF9FE] text-[#1E1035] font-heading font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        {sec.table.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-3 sm:p-3.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE9FE] text-[#6D6582] font-sans">
                      {sec.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#FAF9FE]/80 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 sm:p-3.5 font-medium">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Relevant Tool CTA Box */}
      {relatedToolsList.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-[#FAF8FE] via-[#F5F3FF] to-[#FAF8FE] border border-[#DDD6FE] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div>
            <div className="text-xs font-heading font-semibold uppercase tracking-wider text-[#7C3AED] mb-1 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#7C3AED]" />
              <span>Interactive Utility Ready</span>
            </div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-[#1E1035]">
              Calculate instantly with the {relatedToolsList[0].name}
            </h3>
            <p className="text-xs font-sans text-[#6D6582] mt-0.5">
              Test your numbers in real time with our client-side in-browser calculator.
            </p>
          </div>
          <Link
            href={`/${relatedToolsList[0].category}/${relatedToolsList[0].slug}`}
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-semibold transition-all shrink-0 inline-flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <span>Open Calculator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* In-Article AdSlot */}
      <AdSlotPlaceholder
        id="guide-in-article-ad"
        type="in-article"
        showExplanation
      />

      {/* Practical Examples */}
      {guide.practicalExamples && guide.practicalExamples.length > 0 && (
        <section className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight flex items-center gap-2">
            <Lightbulb className="w-4.5 h-4.5 text-[#7C3AED]" />
            <span>Practical Step-by-Step Examples</span>
          </h2>
          <div className="space-y-4">
            {guide.practicalExamples.map((eg, idx) => (
              <div key={idx} className="p-4 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-xs sm:text-sm space-y-2">
                <h3 className="font-heading font-bold text-[#1E1035]">{eg.title}</h3>
                <p className="text-xs font-sans text-[#6D6582]">{eg.scenario}</p>
                <div className="space-y-1.5 text-xs font-sans text-[#1E1035] pl-3 border-l-2 border-[#7C3AED] my-2">
                  {eg.steps.map((st, sIdx) => (
                    <div key={sIdx}>{st}</div>
                  ))}
                </div>
                <div className="pt-1 text-xs font-heading font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                  Result: {eg.result}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Common Mistakes */}
      {guide.commonMistakes && guide.commonMistakes.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs space-y-2.5">
          <h2 className="text-sm sm:text-base font-heading font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Common Calculation Pitfalls to Avoid</span>
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm font-sans text-[#6D6582]">
            {guide.commonMistakes.map((cm, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-600 font-bold shrink-0">✕</span>
                <span className="text-[#1E1035]">{cm}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Guides */}
      {relatedGuidesList.length > 0 && (
        <section className="pt-4 border-t border-[#EDE9FE] space-y-4">
          <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035]">
            Related Educational Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedGuidesList.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {guide.faq && guide.faq.length > 0 && (
        <FAQAccordion
          items={guide.faq}
          title="Frequently Asked Questions"
          description="Common technical and mathematical inquiries about this topic."
        />
      )}

      {/* Reader Discussion & Comments System */}
      <section id="guide-comments-section" className="bg-white border border-[#EDE9FE] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#EDE9FE] pb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-[#1E1035]">
                Reader Discussion &amp; Feedback ({comments.length})
              </h2>
              <p className="text-xs text-[#6D6582]">Join the conversation, ask a calculation question, or share your tips.</p>
            </div>
          </div>

          <span className="text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] px-3 py-1 rounded-full border border-[#DDD6FE]">
            Community Moderated
          </span>
        </div>

        {/* Comments Feed */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#FAF9FE] border border-[#EDE9FE] text-[#6D6582] text-xs space-y-1">
              <MessageSquare className="w-6 h-6 text-[#9D95B3] mx-auto opacity-50" />
              <p className="font-heading font-semibold text-[#1E1035]">No comments posted yet.</p>
              <p className="text-[#9D95B3]">Be the very first reader to share feedback or ask a question about this guide!</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-[#FAF9FE] border border-[#EDE9FE] space-y-2 hover:border-[#DDD6FE] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[10px] font-bold">
                      {c.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-heading font-bold text-xs text-[#1E1035]">{c.authorName}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                      Verified Reader
                    </span>
                  </div>
                  {c.rating && (
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                      {Array.from({ length: c.rating }).map((_, rIdx) => (
                        <Star key={rIdx} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#1E1035] leading-relaxed pl-8">&ldquo;{c.content}&rdquo;</p>
                <div className="text-[10px] text-[#9D95B3] pl-8">
                  {new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Leave a Comment Form */}
        <form onSubmit={handleCommentSubmit} className="p-5 rounded-2xl bg-[#FAF9FE] border border-[#DDD6FE] space-y-3.5">
          <h3 className="text-xs font-heading font-bold text-[#1E1035] flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Leave a Comment or Question</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-heading font-semibold text-[#6D6582] mb-1">Your Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Henderson"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl outline-none text-[#1E1035]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-heading font-semibold text-[#6D6582] mb-1">Your Email (optional)</label>
              <input
                type="email"
                placeholder="alex@domain.com"
                value={commentEmail}
                onChange={(e) => setCommentEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl outline-none text-[#1E1035]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-heading font-semibold text-[#6D6582] mb-1">Article Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCommentRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star className={`w-4 h-4 ${star <= commentRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
              <span className="text-[11px] text-[#6D6582] ml-2 font-medium">{commentRating} of 5 Stars</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-heading font-semibold text-[#6D6582] mb-1">Your Comment / Question *</label>
            <textarea
              required
              rows={3}
              placeholder="Write your feedback, question, or tips..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full p-3 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs outline-none text-[#1E1035]"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] text-[#9D95B3]">Your email is never shared publicly.</span>
            <button
              type="submit"
              disabled={isSubmittingComment}
              className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>

          {commentNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{commentNotice}</span>
            </div>
          )}
        </form>
      </section>

      {/* Newsletter Subscribe Box at bottom of article */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#FAF9FE] border border-[#DDD6FE] flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xs">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-xs font-heading font-bold text-[#7C3AED] uppercase tracking-wider">
              PRBSolver Newsletter
            </span>
          </div>
          <h3 className="text-base font-heading font-extrabold text-[#1E1035]">
            Enjoyed this guide? Get new formulas delivered to your inbox.
          </h3>
          <p className="text-xs text-[#6D6582]">
            100% free tool release announcements and step-by-step guides.
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto">
          <input
            type="email"
            required
            placeholder="Your email address..."
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            className="px-3.5 py-2 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none min-w-[200px]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl cursor-pointer shrink-0 shadow-xs"
          >
            Subscribe
          </button>
        </form>
      </section>
      {newsletterStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{newsletterStatus}</span>
        </div>
      )}
    </article>
  );
}
