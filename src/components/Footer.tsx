import { Link } from '../context/RouterContext';
import { CATEGORIES } from '../data/categories';
import { getPopularTools } from '../data/tools';
import { GUIDES } from '../data/guides';
import { useSiteSettings } from '../services/siteSettingsService';
import {
  Shield,
  Heart,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  Layers,
  HelpCircle,
} from 'lucide-react';

export function Footer() {
  const settings = useSiteSettings();
  const siteName = settings.general.siteName || 'PRBSolver';
  const logoSrc = settings.general.logoUrl || '/logo.png';
  const popularTools = getPopularTools().slice(0, 5);
  const guidesList = GUIDES.slice(0, 4);

  return (
    <footer className="bg-gradient-to-b from-[#FAF5FF] via-[#FAF9FE] to-[#FFFFFF] border-t border-[#EDE9FE] shadow-[0_-4px_24px_rgba(124,58,237,0.03)] mt-16 text-sm text-[#1E1035] transition-colors duration-200">
      {/* 1. Value Proposition Banner Strip */}
      <div className="border-b border-[#EDE9FE]/80 bg-white/60 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-heading font-bold text-[#1E1035]">150+ Online Tools</p>
                <p className="text-[11px] text-[#6D6582]">Run instantly in browser</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-heading font-bold text-[#1E1035]">100% Client-Side</p>
                <p className="text-[11px] text-[#6D6582]">Your data never leaves device</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-heading font-bold text-[#1E1035]">Zero Sign-Up</p>
                <p className="text-[11px] text-[#6D6582]">Free access with no paywalls</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-heading font-bold text-[#1E1035]">Verified Formulas</p>
                <p className="text-[11px] text-[#6D6582]">Mathematical accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Links Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 mb-12">
          {/* Brand Identity & Mission (4 columns) */}
          <div className="md:col-span-4 space-y-3.5">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-heading font-extrabold text-base text-[#1E1035] hover:text-[#7C3AED] transition-colors"
            >
              <img
                src={logoSrc}
                alt={siteName}
                className="w-9 h-9 rounded-xl object-contain shadow-xs border border-[#DDD6FE]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
                }}
              />
              <div className="leading-tight">
                <span className="font-extrabold tracking-tight font-heading text-lg text-[#1E1035]">
                  PRB<span className="text-[#7C3AED]">Solver</span>
                </span>
                <span className="block text-[10px] font-sans font-medium text-[#6D6582]">
                  {settings.general.tagline || 'Simple Tools. Real Problems. Solved.'}
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-[13px] text-[#6D6582] leading-relaxed font-sans max-w-sm">
              Free web calculators, unit converters, developer helpers, and educational references designed to solve real everyday problems. Fast, private, and 100% free in your browser.
            </p>

            {/* System Status Pill */}
            <div className="pt-1 flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[11px] font-heading font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>All Calculators &amp; Tools Operational</span>
              </div>
            </div>
          </div>

          {/* Column 2: Popular Tools (2 columns) */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#1E1035] mb-3.5 flex items-center gap-1.5">
              <span>Popular Tools</span>
            </h3>
            <ul className="space-y-2.5 text-xs">
              {popularTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/${tool.category}/${tool.slug}`}
                    className="text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium block truncate"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  href="/tools"
                  className="font-heading font-semibold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1 text-xs"
                >
                  <span>Explore All 150+ Tools</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories (2 columns) */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#1E1035] mb-3.5 flex items-center gap-1.5">
              <span>Categories</span>
            </h3>
            <ul className="space-y-2.5 text-xs">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/${cat.slug}`}
                    className="text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium block"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Guides & Knowledge Hub (2 columns) */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#1E1035] mb-3.5 flex items-center gap-1.5">
              <span>Knowledge Hub</span>
            </h3>
            <ul className="space-y-2.5 text-xs">
              {guidesList.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="text-[#6D6582] hover:text-[#7C3AED] transition-colors truncate block font-medium"
                    title={guide.title}
                  >
                    {guide.title.length > 22 ? `${guide.title.slice(0, 22)}...` : guide.title}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  href="/guides"
                  className="font-heading font-semibold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1 text-xs"
                >
                  <span>All Guides ({GUIDES.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Company & Legal (2 columns) */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#1E1035] mb-3.5">
              Company &amp; Legal
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/about" className="text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/request-a-tool" className="text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium">
                  Request a Tool
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="text-[#6D6582] hover:text-[#7C3AED] transition-colors font-medium">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Bottom Copyright Bar */}
        <div className="pt-8 border-t border-[#EDE9FE] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6D6582]">
          <div className="flex items-center gap-2">
            <span>{settings.general.copyrightText || `© ${new Date().getFullYear()} PRBSolver. All rights reserved.`}</span>
            <span>Crafted for everyday speed and accuracy.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[#9D95B3]">Privacy-First · Zero Client Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
