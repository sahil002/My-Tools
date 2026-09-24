import { Link } from '../context/RouterContext';
import { CATEGORIES } from '../data/categories';
import { getPopularTools } from '../data/tools';
import { GUIDES } from '../data/guides';
import { Wrench, Shield, Heart, Sparkles, ArrowRight } from 'lucide-react';

export function Footer() {
  const popularTools = getPopularTools().slice(0, 5);
  const guidesList = GUIDES.slice(0, 5);

  return (
    <footer className="bg-gradient-to-b from-[#FAF5FF] via-[#FAF9FE] to-[#FFFFFF] border-t border-[#EDE9FE] shadow-[0_-4px_24px_rgba(124,58,237,0.03)] mt-16 text-sm text-[#1E1035] transition-colors duration-200">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 py-12 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Column 1: Brand & Bio */}
          <div className="col-span-2 md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 font-heading font-extrabold text-base text-[#1E1035] hover:text-[#7C3AED] mb-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center text-xs shadow-xs">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-extrabold tracking-tight font-heading text-lg">
                Online<span className="text-[#7C3AED]">Tools</span>
              </span>
            </Link>
            <p className="text-xs text-[#6D6582] leading-relaxed max-w-sm mb-4 font-sans">
              Comprehensive web utilities, financial calculators, text formatters, and developer converters. Built to save you time with instantaneous results.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#6D6582]">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span className="font-medium">100% Free · Client-Side Processing</span>
            </div>
          </div>

          {/* Column 2: Popular Tools */}
          <div>
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#1E1035] mb-3">
              Popular Tools
            </h3>
            <ul className="space-y-2 text-xs">
              {popularTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/${tool.category}/${tool.slug}`}
                    className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/tools" className="font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:underline flex items-center gap-1">
                  <span>Browse All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#1E1035] mb-3">
              Categories
            </h3>
            <ul className="space-y-2 text-xs">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/${cat.slug}`} className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Guides */}
          <div>
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#1E1035] mb-3">
              Guides
            </h3>
            <ul className="space-y-2 text-xs">
              {guidesList.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="text-[#1E1035] hover:text-[#7C3AED] transition-colors truncate block font-medium"
                  >
                    {guide.title.length > 25 ? `${guide.title.slice(0, 25)}...` : guide.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/guides" className="font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:underline flex items-center gap-1">
                  <span>All Guides</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Company & Legal */}
          <div>
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#1E1035] mb-3">
              Company
            </h3>
            <ul className="space-y-2 text-xs mb-4">
              <li>
                <Link href="/about" className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/request-a-tool" className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium">
                  Request a Tool
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium">
                  Contact
                </Link>
              </li>
            </ul>

            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#1E1035] mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy-policy" className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#EDE9FE] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6D6582]">
          <p>© {new Date().getFullYear()} Online Tools. Crafted for speed and precision.</p>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="text-[#1E1035] hover:text-[#7C3AED] transition-colors font-medium"
            >
              About
            </Link>
            <span>•</span>
            <Link
              href="/panel-access"
              className="inline-flex items-center gap-1 text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium"
            >
              <Shield className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Admin Access</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
