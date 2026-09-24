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
import { getCategoryTheme } from '../utils/categoryColors';
import {
  Clock,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Calculator
} from 'lucide-react';

interface GuideArticleViewProps {
  slug: string;
}

export function GuideArticleView({ slug }: GuideArticleViewProps) {
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-heading font-bold text-[#131A2B]">Guide Not Found</h1>
        <p className="mt-2 text-sm font-sans text-[#5B6577]">
          The guide you requested could not be found.
        </p>
        <Link
          href="/guides"
          className="mt-4 inline-block px-4 py-2 bg-[#2563EB] text-[#FFFFFF] rounded-xl text-sm font-heading font-semibold hover:bg-[#1D4ED8] transition-colors shadow-2xs"
        >
          View All Guides
        </Link>
      </div>
    );
  }

  const category = getCategoryBySlug(guide.category);
  const categoryName = category ? category.name : guide.category;
  const theme = getCategoryTheme(guide.category);

  const relatedToolsList = TOOLS.filter((t) => guide.relatedTools.includes(t.id) || guide.relatedTools.includes(t.slug));
  const relatedGuidesList = GUIDES.filter((g) => guide.relatedGuides.includes(g.slug) && g.slug !== guide.slug);

  const baseUrl = getSiteUrl().replace(/\/+$/, '');
  const breadcrumbItems = [
    { label: 'Guides', path: '/guides' },
    { label: categoryName, path: `/${guide.category}` },
    { label: guide.title, path: `/guides/${guide.slug}` },
  ];

  // Article + FAQ Schema
  const articleSchema: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      author: {
        '@type': 'Organization',
        name: guide.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'Online Tools',
        url: baseUrl,
        logo: `${baseUrl}/favicon.svg`
      },
      datePublished: guide.publishedDate,
      dateModified: guide.updatedDate || guide.publishedDate,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/guides/${guide.slug}`
      }
    }
  ];

  if (guide.faq && guide.faq.length > 0) {
    articleSchema.push({
      '@type': 'FAQPage',
      mainEntity: guide.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer
        }
      }))
    });
  }

  return (
    <article className="space-y-8 max-w-4xl mx-auto">
      <SEOHelmet
        title={`${guide.title} – Practical Guide`}
        description={guide.description}
        canonicalPath={`/guides/${guide.slug}`}
        ogType="article"
        breadcrumbs={breadcrumbItems}
        schema={articleSchema}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Article Header */}
      <header className="border-b border-[#EDE9FE] pb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-heading font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]">
            {categoryName}
          </span>
          <span className="text-xs text-[#9D95B3]">•</span>
          <span className="text-xs font-sans text-[#6D6582] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
            {guide.readingTime}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-heading font-extrabold text-[#1E1035] tracking-tight leading-tight">
          {guide.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-sans text-[#6D6582]">
          <span className="flex items-center gap-1 font-heading font-semibold text-[#1E1035]">
            <User className="w-3.5 h-3.5 text-[#7C3AED]" />
            {guide.author}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#6D6582]" />
            Updated {guide.updatedDate}
          </span>
        </div>
      </header>

      {/* Quick Answer Summary Callout Box */}
      <div className="p-4 sm:p-5 bg-[#FAF9FE] border border-[#DDD6FE] rounded-2xl">
        <div className="text-xs font-heading font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5 mb-1.5">
          <CheckCircle className="w-4 h-4 text-[#7C3AED]" />
          Quick Answer & Summary
        </div>
        <p className="text-xs sm:text-sm text-[#1E1035] leading-relaxed font-sans font-medium">
          {guide.quickAnswer}
        </p>
      </div>

      {/* Formula Highlight if available */}
      {guide.formula && (
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-heading font-semibold uppercase tracking-wider text-[#6D6582] mb-1.5">
            Key Mathematical Formula
          </div>
          <div className="p-3 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl font-mono text-xs sm:text-sm font-bold text-[#7C3AED] break-all">
            {guide.formula}
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="space-y-6 text-sm sm:text-base text-[#1E1035] leading-relaxed font-sans">
        {guide.sections.map((sec, idx) => (
          <section key={idx} className="space-y-2.5">
            {sec.title && (
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
                {sec.title}
              </h2>
            )}
            {sec.paragraphs.map((p, pIdx) => (
              <p key={pIdx} className="text-[#6D6582] text-xs sm:text-sm leading-relaxed font-sans">
                {p}
              </p>
            ))}

            {sec.listItems && (
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#1E1035] pl-5 list-disc my-2 font-sans">
                {sec.listItems.map((item, lIdx) => (
                  <li key={lIdx} className="text-[#6D6582]">
                    <span className="text-[#1E1035]">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {sec.table && (
              <div className="overflow-x-auto my-3 border border-[#EDE9FE] rounded-xl bg-[#FFFFFF]">
                <table className="w-full text-left text-xs sm:text-sm divide-y divide-[#EDE9FE]">
                  <thead className="bg-[#FAF9FE] text-[#1E1035] font-heading font-semibold">
                    <tr>
                      {sec.table.headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-2.5 sm:p-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE] text-[#6D6582] font-sans">
                    {sec.table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#FAF9FE]/60">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 sm:p-3">{cell}</td>
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

      {/* Relevant Tool CTA Box */}
      {relatedToolsList.length > 0 && (
        <div className="p-5 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div>
            <div className="text-xs font-heading font-semibold uppercase tracking-wider text-[#7C3AED] mb-1 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#7C3AED]" />
              Try the Interactive Tool
            </div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-[#1E1035]">
              Calculate instantly with our {relatedToolsList[0].name}
            </h3>
            <p className="text-xs sm:text-sm font-sans text-[#6D6582] mt-0.5">
              Test your own numbers in real time with our zero-delay browser calculator.
            </p>
          </div>
          <Link
            href={`/${relatedToolsList[0].category}/${relatedToolsList[0].slug}`}
            className="px-3.5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-[#FFFFFF] rounded-xl text-xs font-heading font-semibold transition-colors shrink-0 inline-flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <span>Open {relatedToolsList[0].name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* AdSense clean placement between sections */}
      <AdSlotPlaceholder
        id="guide-in-article-ad"
        type="in-article"
        showExplanation
      />

      {/* Practical Examples */}
      {guide.practicalExamples && guide.practicalExamples.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs">
          <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight mb-3 flex items-center gap-2">
            <Lightbulb className="w-4.5 h-4.5 text-[#7C3AED]" />
            Practical Step-by-Step Examples
          </h2>
          <div className="space-y-3">
            {guide.practicalExamples.map((eg, idx) => (
              <div key={idx} className="p-3.5 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-xs sm:text-sm">
                <h3 className="font-heading font-semibold text-[#1E1035]">{eg.title}</h3>
                <p className="text-xs font-sans text-[#6D6582] mt-1 mb-2">{eg.scenario}</p>
                <div className="space-y-1 text-xs font-sans text-[#1E1035] pl-2.5 border-l-2 border-[#7C3AED] my-2">
                  {eg.steps.map((st, sIdx) => (
                    <div key={sIdx}>{st}</div>
                  ))}
                </div>
                <div className="mt-2 text-xs font-heading font-bold text-[#16A34A]">
                  Result: {eg.result}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Common Mistakes */}
      {guide.commonMistakes && guide.commonMistakes.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 shadow-2xs">
          <h2 className="text-sm sm:text-base font-heading font-bold text-[#1E1035] mb-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            Common Calculation Pitfalls
          </h2>
          <ul className="space-y-1.5 text-xs sm:text-sm font-sans text-[#6D6582]">
            {guide.commonMistakes.map((cm, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                <span>{cm}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Guides */}
      {relatedGuidesList.length > 0 && (
        <section className="pt-4 border-t border-[#EDE9FE]">
          <h2 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] mb-3">
            Related Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedGuidesList.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </section>
      )}

      {/* BOTTOM LEADERBOARD AD PLACEMENT */}
      <AdSlotPlaceholder
        id="guide-bottom-leaderboard"
        type="bottom-leaderboard"
        showExplanation
      />

      {/* FAQ */}
      {guide.faq && guide.faq.length > 0 && (
        <FAQAccordion
          items={guide.faq}
          title="Questions Answered in this Guide"
        />
      )}
    </article>
  );
}
