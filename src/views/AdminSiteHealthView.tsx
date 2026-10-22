import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { SEOHelmet } from '../components/SEOHelmet';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { getActiveAdminSession, AdminSession, getAdminLoginRoute } from '../services/adminAuth';
import { Activity, AlertTriangle, CheckCircle2, Clock3, ExternalLink, FileText, Globe, Link2, RefreshCw, Search, ShieldCheck, Wrench, XCircle } from 'lucide-react';

type RouteItem = { path: string; url: string; type: string; title: string; seoTitle: string; seoDescription: string };
type HealthData = { success: boolean; checkedAt: string; expectedRoutes: RouteItem[]; seoIssues: Array<{path:string;url:string;type:string;title:string;missing:string[]}>; sourceCounts: {categories:number;activeTools:number;publishedGuides:number}; error?: string };
type Check = { name: string; detail: string; status: 'pass' | 'warn' | 'fail' | 'pending'; fix: string };

const SITE = 'https://www.prbsolver.com';
const statusLabel = { pass: 'Healthy', warn: 'Needs attention', fail: 'Problem', pending: 'Not connected' };

export function AdminSiteHealthView() {
  const { navigate } = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [sitemapCount, setSitemapCount] = useState<number | null>(null);
  const [robotsText, setRobotsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState('');

  const runAudit = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const admin = await getActiveAdminSession(true);
      if (!admin) { navigate(getAdminLoginRoute()); return; }
      setSession(admin);
      const [healthRes, sitemapRes, robotsRes] = await Promise.all([
        fetch('/api/secure?route=admin-site-health', { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
        fetch('/sitemap.xml', { cache: 'no-store' }),
        fetch('/robots.txt', { cache: 'no-store' }),
      ]);
      const [healthJson, sitemapXml, robots] = await Promise.all([
        healthRes.json().catch(() => null),
        sitemapRes.text().catch(() => ''),
        robotsRes.text().catch(() => ''),
      ]);
      if (!healthRes.ok || !healthJson?.success) throw new Error(healthJson?.error || 'Website health audit could not read published records.');
      setHealth(healthJson as HealthData);
      setSitemapCount(sitemapRes.ok ? (sitemapXml.match(/<loc>[sS]*?<\/loc>/g) || []).length : null);
      setRobotsText(robotsRes.ok ? robots : '');
      setLastChecked(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audit failed. Please try again.');
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { void runAudit(); }, [runAudit]);

  const checks = useMemo<Check[]>(() => {
    const rows: Check[] = [];
    rows.push({
      name: 'Dynamic XML sitemap',
      detail: sitemapCount === null ? 'Could not read /sitemap.xml' : `${sitemapCount} URLs currently listed in sitemap.xml`,
      status: sitemapCount === null ? 'fail' : sitemapCount > 0 ? 'pass' : 'fail',
      fix: 'Ensure /sitemap.xml serves valid XML and includes all canonical public pages.',
    });
    rows.push({
      name: 'Robots.txt sitemap reference',
      detail: !robotsText ? 'Could not read /robots.txt' : robotsText.includes(`${SITE}/sitemap.xml`) ? 'Sitemap URL is declared in robots.txt' : 'Sitemap reference is missing or incorrect',
      status: !robotsText ? 'fail' : robotsText.includes(`${SITE}/sitemap.xml`) ? 'pass' : 'fail',
      fix: `Add the exact line: Sitemap: ${SITE}/sitemap.xml`,
    });
    if (health) {
      const expected = health.expectedRoutes.length;
      const missing = sitemapCount === null ? null : Math.max(0, expected - sitemapCount);
      rows.push({
        name: 'Sitemap coverage',
        detail: missing === null ? `${expected} expected public routes discovered` : missing === 0 ? `${expected} expected routes; no count gap detected` : `${expected} expected routes vs ${sitemapCount} sitemap entries (count gap ${missing})`,
        status: missing === null ? 'warn' : missing === 0 ? 'pass' : 'warn',
        fix: 'Compare the URL list below with sitemap.xml. A count match is a useful signal, not proof every URL matches.',
      });
      rows.push({
        name: 'SEO metadata completeness',
        detail: health.seoIssues.length ? `${health.seoIssues.length} published routes have missing or implicit SEO metadata` : 'No missing title/description found in database-managed routes',
        status: health.seoIssues.length ? 'warn' : 'pass',
        fix: 'Open the affected tool, category or guide in Admin and fill its SEO title and meta description.',
      });
    }
    rows.push({
      name: 'Google Search Console',
      detail: 'Live indexing and coverage data is not connected to this dashboard.',
      status: 'pending',
      fix: 'Connect Search Console API credentials in a secure server-side integration to report indexed, excluded and failed URLs. Sitemap inclusion alone cannot confirm indexing.',
    });
    return rows;
  }, [health, sitemapCount, robotsText]);

  const issues = useMemo(() => {
    const all: Array<{ key:string; severity:'high'|'medium'; title:string; detail:string; fix:string; path?:string }> = [];
    for (const c of checks) if (c.status === 'fail' || c.status === 'warn') {
      all.push({ key: c.name, severity: c.status === 'fail' ? 'high' : 'medium', title: c.name, detail: c.detail, fix: c.fix });
    }
    for (const item of health?.seoIssues || []) {
      all.push({ key: item.path, severity: 'medium', title: `SEO metadata: ${item.title || item.path}`, detail: `${item.path}: missing ${item.missing.join(', ')}`, fix: 'Edit the corresponding page in Admin and save an accurate SEO title and description.', path: item.path });
    }
    return all;
  }, [checks, health]);

  const counts = health?.sourceCounts;
  const expected = health?.expectedRoutes || [];
  const listedCount = sitemapCount ?? 0;
  const coverage = expected.length ? Math.min(100, Math.round(listedCount / expected.length * 100)) : 0;

  if (!session && loading) return <div className="min-h-screen grid place-items-center text-sm text-[#6D6582]">Loading website health…</div>;

  return (
    <div className="flex min-h-screen bg-[#FAF9FE] text-[#1E1035] font-sans">
      <SEOHelmet title="Website Health & SEO Control Center" description="Monitor PRBSolver sitemap coverage, robots.txt, metadata completeness and website issues." noindex />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} adminEmail={session?.user.email} />
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <AdminTopNav onMenuClick={() => setSidebarOpen(true)} title="Website Health & SEO" />
        <main className="w-full max-w-[1600px] mx-auto p-3 sm:p-6 lg:p-8 space-y-5">
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#7C3AED] text-xs font-bold uppercase tracking-wider"><Activity size={15}/> Site operations</div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">Website Health & SEO</h1>
              <p className="mt-2 text-sm text-[#6D6582] max-w-3xl leading-relaxed">Check published routes, sitemap and robots.txt, spot metadata gaps, and see what needs attention. This is a technical audit—not a guarantee of Google indexing.</p>
            </div>
            <button onClick={() => void runAudit()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60 min-h-11 shrink-0"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>{loading ? 'Checking…' : 'Run audit'}</button>
          </header>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Audit could not finish.</strong><p className="mt-1">{error}</p><p className="mt-2 text-xs">Check your admin session, Supabase database tables and Vercel API deployment, then run the audit again.</p></div>}

          <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              {label:'Expected public URLs',value:health?.expectedRoutes.length ?? '—',hint:'Static + published routes',icon:Globe},
              {label:'Sitemap URLs',value:sitemapCount ?? '—',hint:'Read from live XML',icon:FileText},
              {label:'SEO metadata issues',value:health?.seoIssues.length ?? '—',hint:'Database-managed pages',icon:Search},
              {label:'Detected issues',value:issues.length,hint:'Warnings + failures',icon:AlertTriangle},
            ].map((card) => { const Icon=card.icon; return <div key={card.label} className="rounded-2xl border border-[#EDE9FE] bg-white p-3 sm:p-5 shadow-sm min-w-0"><div className="flex items-center justify-between gap-2"><span className="text-[11px] sm:text-xs font-medium text-[#6D6582]">{card.label}</span><Icon size={17} className="text-[#7C3AED] shrink-0"/></div><div className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums">{card.value}</div><div className="mt-1 text-[10px] sm:text-xs text-[#6D6582]">{card.hint}</div></div>; })}
          </section>

          <section className="rounded-2xl border border-[#EDE9FE] bg-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><h2 className="font-bold text-lg">System checks</h2><p className="text-xs text-[#6D6582] mt-1">Last checked: {lastChecked ? new Date(lastChecked).toLocaleString() : 'Not yet checked'}</p></div><span className="text-xs text-[#6D6582]">{checks.filter(c=>c.status==='pass').length} healthy · {checks.filter(c=>c.status==='warn'||c.status==='fail').length} need attention · {checks.filter(c=>c.status==='pending').length} pending</span></div>
            <div className="mt-4 divide-y divide-[#EDE9FE]">
              {checks.map((check) => { const good=check.status==='pass'; const bad=check.status==='fail'; const Icon=good?CheckCircle2:bad?XCircle:check.status==='pending'?Clock3:AlertTriangle; return <div key={check.name} className="py-4 flex items-start gap-3"><Icon size={19} className={good?'text-emerald-600':bad?'text-red-600':check.status==='pending'?'text-slate-400':'text-amber-600'}/><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-sm">{check.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${good?'bg-emerald-50 text-emerald-700':bad?'bg-red-50 text-red-700':check.status==='pending'?'bg-slate-100 text-slate-600':'bg-amber-50 text-amber-700'}`}>{statusLabel[check.status]}</span></div><p className="mt-1 text-sm text-[#6D6582] break-words">{check.detail}</p>{!good&&<p className="mt-2 text-xs leading-relaxed"><strong>Suggested fix:</strong> {check.fix}</p>}</div></div>; })}
            </div>
          </section>

          <section className="rounded-2xl border border-[#EDE9FE] bg-white p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-lg">Published content inventory</h2><p className="text-xs text-[#6D6582] mt-1">Counts from Supabase and the static route registry.</p></div><ShieldCheck className="text-[#7C3AED] shrink-0" size={22}/></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {[['Active tools',counts?.activeTools ?? '—'],['Visible categories',counts?.categories ?? '—'],['Published guides',counts?.publishedGuides ?? '—']].map(([label,value])=><div key={String(label)} className="rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] p-4"><div className="text-xs text-[#6D6582]">{label}</div><div className="mt-1 text-xl font-bold">{value}</div></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-[#EDE9FE] bg-white overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[#EDE9FE]"><h2 className="font-bold text-lg">SEO metadata issues</h2><p className="mt-1 text-xs text-[#6D6582]">Only items returned by the published database query are included. Static-page metadata is not inferred as missing here.</p></div>
            {!health?.seoIssues.length ? <div className="p-6 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 size={17}/>No missing title or description detected in database-managed published pages.</div> : <div className="divide-y divide-[#EDE9FE]">{health.seoIssues.map(item=><div key={item.path} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3"><div className="flex-1 min-w-0"><div className="font-semibold text-sm">{item.title}</div><div className="text-xs text-[#6D6582] break-all mt-1">{item.path}</div><div className="text-xs text-amber-700 mt-2">Missing: {item.missing.join(', ')}</div></div><button onClick={()=>navigate(item.type==='guide'?'/admin/guides':item.type==='tool'?'/admin/tools':item.type==='category'?'/admin/categories':'/admin/seo')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DDD6FE] px-3 py-2 text-xs font-semibold hover:bg-[#F5F3FF] shrink-0">Open editor <ExternalLink size={13}/></button></div>)}</div>}
          </section>

          <section className="rounded-2xl border border-[#EDE9FE] bg-white overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[#EDE9FE]"><h2 className="font-bold text-lg">Expected public URLs</h2><p className="mt-1 text-xs text-[#6D6582]">Sitemap route coverage view; use the live sitemap link to compare exact URL entries.</p><a className="inline-flex mt-3 text-sm font-semibold text-[#7C3AED] underline" href="/sitemap.xml" target="_blank" rel="noreferrer">Open sitemap.xml</a></div>
            <div className="max-h-[560px] overflow-auto divide-y divide-[#EDE9FE]">
              {expected.map(item=><div key={item.path} className="p-3 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4"><div className="flex-1 min-w-0"><div className="text-sm font-semibold">{item.title}</div><div className="text-xs text-[#6D6582] break-all">{item.path}</div></div><a href={item.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#7C3AED] inline-flex items-center gap-1 shrink-0">Open page <ExternalLink size={12}/></a></div>)}
            </div>
          </section>
          <p className="text-[11px] leading-relaxed text-[#6D6582]">Note: route counts can differ if the same URL is registered from multiple sources or if a custom route has no matching frontend renderer. This audit does not yet query Google Search Console, inspect every page’s HTTP status, or test external links. Those need dedicated integrations and should not be reported as verified by this screen.</p>
        </main>
      </div>
    </div>
  );
}
