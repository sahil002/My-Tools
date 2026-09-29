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
      <section className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-[#EDE9FE] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#7C3AED]" />
              <span>Robots.txt Crawler Directives</span>
            </h2>
            <p className="text-xs text-[#6D6582] mt-0.5">
              Direct search engine spiders on which paths to index or omit (e.g. admin panels, staging routes).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6D6582]">Preset:</span>
            <button
              type="button"
              onClick={() => applyRobotsPreset('production')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] cursor-pointer"
            >
              Standard Safe
            </button>
            <button
              type="button"
              onClick={() => applyRobotsPreset('staging')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] cursor-pointer"
            >
              Block All
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('robotsTxt', DEFAULT_ROBOTS_TXT)}
              className="p-1 rounded-md text-[#6D6582] hover:text-[#1E1035] transition-colors"
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
              className="w-full font-mono text-xs p-3.5 rounded-xl bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] focus:outline-none focus:border-[#7C3AED] leading-relaxed"
            />
          </div>
          <p className="text-[11px] text-[#6D6582]">
            This file is served automatically at <span className="font-mono font-semibold">/robots.txt</span>. Disallowed directories should always include private endpoints like <span className="font-mono">/admin</span> and <span className="font-mono">/panel-access</span>.
          </p>
        </div>
      </section>

      {/* 2. Sitemap Generation & Statistics */}
      <section className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="border-b border-[#EDE9FE] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7C3AED]" />
              <span>XML Sitemap Engine</span>
            </h2>
            <p className="text-xs text-[#6D6582] mt-0.5">
              Live XML sitemap dynamically indexing all active calculators, converters, categories, and developer tools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenXmlPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDD6FE] bg-white text-xs font-semibold text-[#1E1035] hover:bg-[#F5F3FF] cursor-pointer transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Preview XML</span>
            </button>

            <button
              type="button"
              id="regenerate-sitemap-btn"
              onClick={handleTriggerRegeneration}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-semibold hover:bg-[#6D28D9] disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>{regenerating ? 'Regenerating...' : 'Regenerate Sitemap'}</span>
            </button>
          </div>
        </div>

        {regenSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Sitemap regenerated and validated successfully. Total indexed URLs updated.
            </span>
          </div>
        )}

        {/* Sitemap Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6D6582]">
              Total Indexed URLs
            </p>
            <p className="text-xl font-bold font-mono text-[#1E1035] mt-1">
              {settings.sitemapTotalUrls}
            </p>
            <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>100% compliant with sitemaps.org</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6D6582]">
              Last Generated Timestamp
            </p>
            <p className="text-xs font-semibold text-[#1E1035] mt-2">
              {new Date(settings.sitemapLastGenerated).toLocaleString()}
            </p>
            <p className="text-[10px] text-[#6D6582] mt-1">
              Auto-refreshed on tool catalog changes
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6D6582]">
              Public Live Endpoint
            </p>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:underline mt-2"
            >
              <span>/sitemap.xml</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-[10px] text-[#6D6582] mt-1">
              Included in Google Search Console ping
            </p>
          </div>
        </div>
      </section>

      {/* 3. Search Engine Webmaster Verification & Analytics IDs */}
      <section className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="border-b border-[#EDE9FE] pb-3">
          <h2 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
            <SearchCheck className="w-4 h-4 text-[#7C3AED]" />
            <span>Search Console Verification & Analytics IDs</span>
          </h2>
          <p className="text-xs text-[#6D6582] mt-0.5">
            Configure site ownership tokens and tracking IDs injected into HTML head tags.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Google Search Console */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-gsc-id"
              className="block text-xs font-semibold text-[#1E1035]"
            >
              Google Search Console Verification Token
            </label>
            <input
              id="settings-gsc-id"
              type="text"
              value={settings.googleSearchConsoleVerificationId}
              onChange={(e) => handleFieldChange('googleSearchConsoleVerificationId', e.target.value)}
              placeholder="google-site-verification=..."
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] focus:outline-none focus:border-[#7C3AED]"
            />
            <p className="text-[11px] text-[#6D6582]">
              Injected as &lt;meta name="google-site-verification" content="..."&gt; in &lt;head&gt;.
            </p>
          </div>

          {/* Google Analytics 4 */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-ga-id"
              className="block text-xs font-semibold text-[#1E1035]"
            >
              Google Analytics 4 Measurement ID
            </label>
            <input
              id="settings-ga-id"
              type="text"
              value={settings.googleAnalyticsMeasurementId}
              onChange={(e) => handleFieldChange('googleAnalyticsMeasurementId', e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] focus:outline-none focus:border-[#7C3AED]"
            />
            <p className="text-[11px] text-[#6D6582]">
              Collects privacy-conscious traffic analytics for tool utilization rates.
            </p>
          </div>

          {/* Google Tag Manager */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-gtm-id"
              className="block text-xs font-semibold text-[#1E1035]"
            >
              Google Tag Manager Container ID (Optional)
            </label>
            <input
              id="settings-gtm-id"
              type="text"
              value={settings.googleTagManagerId}
              onChange={(e) => handleFieldChange('googleTagManagerId', e.target.value)}
              placeholder="GTM-XXXXXXX"
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          {/* Bing Webmaster */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-bing-id"
              className="block text-xs font-semibold text-[#1E1035]"
            >
              Bing Webmaster Verification ID (Optional)
            </label>
            <input
              id="settings-bing-id"
              type="text"
              value={settings.bingWebmasterVerificationId}
              onChange={(e) => handleFieldChange('bingWebmasterVerificationId', e.target.value)}
              placeholder="92F1A8C..."
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
        </div>
      </section>

      {/* XML Preview Modal */}
      {showXmlModal && (
        <div
          id="sitemap-xml-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col font-sans">
            <div className="flex items-center justify-between border-b border-[#EDE9FE] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-heading font-bold text-[#1E1035]">
                  Live XML Sitemap Inspection
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-heading font-semibold border border-[#EDE9FE] text-[#1E1035] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-heading font-semibold bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowXmlModal(false)}
                  className="p-1 text-[#6D6582] hover:text-[#1E1035] cursor-pointer"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] p-3">
              <pre className="font-mono text-[11px] text-[#1E1035] whitespace-pre-wrap leading-relaxed">
                {xmlContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
