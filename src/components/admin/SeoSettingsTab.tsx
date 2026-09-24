import React, { useState } from 'react';
import {
  SeoAnalyticsSettings,
  DEFAULT_ROBOTS_TXT,
  triggerSitemapRegeneration,
  generateLiveSitemapXml,
} from '../../services/siteSettingsService';
import {
  SearchCheck,
  FileCode,
  RefreshCw,
  CheckCircle2,
  Copy,
  Download,
  Check,
  ExternalLink,
  Code2,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface SeoSettingsTabProps {
  settings: SeoAnalyticsSettings;
  onChange: (updated: SeoAnalyticsSettings) => void;
}

export function SeoSettingsTab({ settings, onChange }: SeoSettingsTabProps) {
  const [regenerating, setRegenerating] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(false);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [xmlContent, setXmlContent] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFieldChange = <K extends keyof SeoAnalyticsSettings>(
    field: K,
    value: SeoAnalyticsSettings[K]
  ) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  const handleTriggerRegeneration = async () => {
    setRegenerating(true);
    setRegenSuccess(false);
    try {
      const res = await triggerSitemapRegeneration();
      if (res.success) {
        onChange({
          ...settings,
          sitemapLastGenerated: res.timestamp,
          sitemapTotalUrls: res.urlCount,
        });
        setRegenSuccess(true);
        setTimeout(() => setRegenSuccess(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setRegenerating(false);
    }
  };

  const handleOpenXmlPreview = () => {
    const { xml } = generateLiveSitemapXml();
    setXmlContent(xml);
    setShowXmlModal(true);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyRobotsPreset = (type: 'production' | 'staging' | 'permissive') => {
    if (type === 'production') {
      handleFieldChange('robotsTxt', DEFAULT_ROBOTS_TXT);
    } else if (type === 'staging') {
      handleFieldChange(
        'robotsTxt',
        `# robots.txt - Staging Environment (Crawlers Blocked)
User-agent: *
Disallow: /
`
      );
    } else {
      handleFieldChange(
        'robotsTxt',
        `# robots.txt - Fully Permissive
User-agent: *
Allow: /

Sitemap: https://onlinetools.app/sitemap.xml
`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Robots.txt Editor */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#2563EB]" />
              <span>Robots.txt Crawler Directives</span>
            </h2>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
              Direct search engine spiders on which paths to index or omit (e.g. admin panels, staging routes).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">Preset:</span>
            <button
              type="button"
              onClick={() => applyRobotsPreset('production')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#1B233A] hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] cursor-pointer"
            >
              Standard Safe
            </button>
            <button
              type="button"
              onClick={() => applyRobotsPreset('staging')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#1B233A] hover:bg-[#E4E8EF] dark:hover:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] cursor-pointer"
            >
              Block All
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('robotsTxt', DEFAULT_ROBOTS_TXT)}
              className="p-1 rounded-md text-[#5B6577] hover:text-[#131A2B] dark:hover:text-[#F4F6F9] transition-colors"
              title="Reset to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <textarea
              id="settings-robots-txt"
              rows={8}
              value={settings.robotsTxt}
              onChange={(e) => handleFieldChange('robotsTxt', e.target.value)}
              className="w-full font-mono text-xs p-3.5 rounded-xl bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB] leading-relaxed"
            />
          </div>
          <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
            This file is served automatically at <span className="font-mono font-semibold">/robots.txt</span>. Disallowed directories should always include private endpoints like <span className="font-mono">/admin</span> and <span className="font-mono">/panel-access</span>.
          </p>
        </div>
      </section>

      {/* 2. Sitemap Generation & Statistics */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <span>XML Sitemap Engine</span>
            </h2>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
              Live XML sitemap dynamically indexing all active calculators, converters, categories, and developer tools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenXmlPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#1B233A] text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A] cursor-pointer transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Preview XML</span>
            </button>

            <button
              type="button"
              id="regenerate-sitemap-btn"
              onClick={handleTriggerRegeneration}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>{regenerating ? 'Regenerating...' : 'Regenerate Sitemap'}</span>
            </button>
          </div>
        </div>

        {regenSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">
              Sitemap regenerated and validated successfully. Total indexed URLs updated.
            </span>
          </div>
        )}

        {/* Sitemap Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6577] dark:text-[#9AA5B8]">
              Total Indexed URLs
            </p>
            <p className="text-xl font-bold font-mono text-[#131A2B] dark:text-[#F4F6F9] mt-1">
              {settings.sitemapTotalUrls}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>100% compliant with sitemaps.org</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6577] dark:text-[#9AA5B8]">
              Last Generated Timestamp
            </p>
            <p className="text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9] mt-2">
              {new Date(settings.sitemapLastGenerated).toLocaleString()}
            </p>
            <p className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8] mt-1">
              Auto-refreshed on tool catalog changes
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6577] dark:text-[#9AA5B8]">
              Public Live Endpoint
            </p>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline mt-2"
            >
              <span>/sitemap.xml</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8] mt-1">
              Included in Google Search Console ping
            </p>
          </div>
        </div>
      </section>

      {/* 3. Search Engine Webmaster Verification & Analytics IDs */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3">
          <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
            <SearchCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Search Console Verification & Analytics IDs</span>
          </h2>
          <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
            Configure site ownership tokens and tracking IDs injected into HTML head tags.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Google Search Console */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-gsc-id"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              Google Search Console Verification Token
            </label>
            <input
              id="settings-gsc-id"
              type="text"
              value={settings.googleSearchConsoleVerificationId}
              onChange={(e) => handleFieldChange('googleSearchConsoleVerificationId', e.target.value)}
              placeholder="google-site-verification=..."
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
            <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
              Injected as &lt;meta name="google-site-verification" content="..."&gt; in &lt;head&gt;.
            </p>
          </div>

          {/* Google Analytics 4 */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-ga-id"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              Google Analytics 4 Measurement ID
            </label>
            <input
              id="settings-ga-id"
              type="text"
              value={settings.googleAnalyticsMeasurementId}
              onChange={(e) => handleFieldChange('googleAnalyticsMeasurementId', e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
            <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
              Collects privacy-conscious traffic analytics for tool utilization rates.
            </p>
          </div>

          {/* Google Tag Manager */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-gtm-id"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              Google Tag Manager Container ID (Optional)
            </label>
            <input
              id="settings-gtm-id"
              type="text"
              value={settings.googleTagManagerId}
              onChange={(e) => handleFieldChange('googleTagManagerId', e.target.value)}
              placeholder="GTM-XXXXXXX"
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Bing Webmaster */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-bing-id"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              Bing Webmaster Verification ID (Optional)
            </label>
            <input
              id="settings-bing-id"
              type="text"
              value={settings.bingWebmasterVerificationId}
              onChange={(e) => handleFieldChange('bingWebmasterVerificationId', e.target.value)}
              placeholder="92F1A8C..."
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>
      </section>

      {/* XML Preview Modal */}
      {showXmlModal && (
        <div
          id="sitemap-xml-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                  Live XML Sitemap Inspection
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowXmlModal(false)}
                  className="p-1 text-[#5B6577] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] p-3">
              <pre className="font-mono text-[11px] text-[#131A2B] dark:text-[#F4F6F9] whitespace-pre-wrap leading-relaxed">
                {xmlContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
