import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { SEOHelmet } from '../components/SEOHelmet';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { getActiveAdminSession, getAdminLoginRoute, logoutAdmin, type AdminSession } from '../services/adminAuth';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Image, KeyRound, LoaderCircle, RefreshCw, Save, ShieldCheck, Sparkles, ToggleLeft, ToggleRight, Wallet } from 'lucide-react';

type Provider = 'gemini' | 'openrouter' | 'groq';
type Config = { aiEnabled: boolean; imageUploadEnabled: boolean; primaryProvider: Provider; fallbackEnabled: boolean; monthlyBudgetUsd: number; providers: Record<Provider, { connected: boolean }>; updatedAt: string | null };
type Usage = { requests30d: number; successful: number; failed: number; imageRequests30d: number; estimatedCostUsd: number; providers: Record<string, number> };
const labels: Record<Provider, { name: string; description: string; url: string }> = {
  gemini: { name: 'Google Gemini', description: 'Advanced math explanations and question images', url: 'https://aistudio.google.com/apikey' },
  openrouter: { name: 'OpenRouter', description: 'Free model routing for text questions', url: 'https://openrouter.ai/keys' },
  groq: { name: 'Groq', description: 'Fast text-question fallback', url: 'https://console.groq.com/keys' },
};
const emptyConfig: Config = { aiEnabled: false, imageUploadEnabled: false, primaryProvider: 'gemini', fallbackEnabled: true, monthlyBudgetUsd: 0, providers: { gemini: { connected: false }, openrouter: { connected: false }, groq: { connected: false } }, updatedAt: null };

export function AdminMathAIControlView() {
  const { navigate } = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState<Config>(emptyConfig);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({ gemini: '', openrouter: '', groq: '' });
  const [removeKeys, setRemoveKeys] = useState<Partial<Record<Provider, boolean>>>({});
  const [visibleKey, setVisibleKey] = useState<Provider | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await fetch('/api/math-solver?action=admin-config', { credentials: 'include', cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Could not load AI settings.');
      setConfig({ ...emptyConfig, ...json.config });
      setUsage(json.usage || null);
      setNotice(null);
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : 'Could not load AI settings.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getActiveAdminSession().then(current => {
      if (!active) return;
      if (!current) { navigate(getAdminLoginRoute()); return; }
      setSession(current);
      void load();
    }).catch(() => navigate(getAdminLoginRoute()));
    return () => { active = false; };
  }, [navigate, load]);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch('/api/math-solver?action=admin-config', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, apiKeys, removeKeys }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Could not save AI settings.');
      setConfig({ ...emptyConfig, ...json.config });
      setApiKeys({ gemini: '', openrouter: '', groq: '' });
      setRemoveKeys({});
      setNotice({ ok: true, text: 'AI settings saved securely.' });
      await load(false);
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : 'Could not save AI settings.' });
    } finally {
      setSaving(false);
    }
  };

  const connectProvider = async (provider: Provider) => {
    const key = apiKeys[provider].trim();
    if (!key) {
      setNotice({ ok: false, text: 'Paste the provider API key first.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch('/api/math-solver?action=admin-config', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, apiKeys: { [provider]: key }, removeKeys: {} }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Could not connect provider.');
      setConfig({ ...emptyConfig, ...json.config });
      setApiKeys(current => ({ ...current, [provider]: '' }));
      setNotice({ ok: true, text: labels[provider].name + ' key encrypted and connected.' });
      await load(false);
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : 'Could not connect provider.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] text-[#6D6582]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading secure AI settings…</div>;

  const Toggle = ({ checked, onChange, label, help }: { checked: boolean; onChange: (value: boolean) => void; label: string; help: string }) => <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${checked ? 'border-[#C4B5FD] bg-[#F5F3FF]' : 'border-[#EDE9FE] bg-white'}`}><span><span className="block text-sm font-bold text-[#1E1035]">{label}</span><span className="mt-1 block text-xs leading-5 text-[#6D6582]">{help}</span></span>{checked ? <ToggleRight className="h-8 w-8 shrink-0 text-[#7C3AED]" /> : <ToggleLeft className="h-8 w-8 shrink-0 text-[#9D95B3]" />}</button>;

  return <div className="min-h-screen flex bg-[#FAF9FE] text-[#1E1035]">
    <SEOHelmet title="Math AI Control Center | Admin" description="Securely control AI providers, image uploads and math solver usage." />
    <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} adminEmail={session?.user.email || 'admin'} />
    <div className="min-w-0 flex-1 flex flex-col">
      <AdminTopNav pageTitle="Math AI Control Center" adminTheme="light" onToggleTheme={() => {}} onToggleSidebar={() => setSidebarOpen(true)} onOpenPasswordModal={() => {}} onLogout={() => { void logoutAdmin(); navigate(getAdminLoginRoute()); }} />
      <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">PRBSolver / Administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Math AI Control Center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6D6582]">Manage AI access, provider connections, image uploads and usage without editing source code.</p></div><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DDD6FE] bg-white px-4 py-2.5 text-sm font-semibold text-[#6D28D9]"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh usage</button></header>
        {notice && <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${notice.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{notice.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}<span>{notice.text}</span></div>}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[{ label: 'Requests · last 30 days', value: usage?.requests30d ?? 0, icon: Sparkles }, { label: 'Successful answers', value: usage?.successful ?? 0, icon: CheckCircle2 }, { label: 'Failed / limited', value: usage?.failed ?? 0, icon: AlertCircle }, { label: 'Estimated cost', value: `$${(usage?.estimatedCostUsd ?? 0).toFixed(4)}`, icon: Wallet }].map(item => <div key={item.label} className="rounded-2xl border border-[#EDE9FE] bg-white p-4"><item.icon className="h-5 w-5 text-[#7C3AED]" /><p className="mt-3 text-xs font-medium text-[#6D6582]">{item.label}</p><p className="mt-1 text-2xl font-bold text-[#1E1035]">{item.value}</p></div>)}
        </section>
        <section className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3 rounded-2xl border border-[#EDE9FE] bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="h-5 w-5 text-[#7C3AED]" /> Feature controls</h2>
            <Toggle checked={config.aiEnabled} onChange={v => setConfig(c => ({ ...c, aiEnabled: v, imageUploadEnabled: v ? c.imageUploadEnabled : false }))} label="AI solving" help="OFF: supported local math engine only. ON: route advanced questions through your selected provider." />
            <Toggle checked={config.imageUploadEnabled} onChange={v => setConfig(c => ({ ...c, imageUploadEnabled: v && c.aiEnabled }))} label="Question image upload" help="OFF: upload control is hidden and server rejects image requests." />
            <Toggle checked={config.fallbackEnabled} onChange={v => setConfig(c => ({ ...c, fallbackEnabled: v }))} label="Free provider fallback" help="Try another connected provider after rate limits or provider errors." />
            <label className="block text-sm font-semibold">Monthly spend ceiling (USD; 0 = no paid budget)</label><input type="number" min="0" max="10000" step="0.5" value={config.monthlyBudgetUsd} onChange={e => setConfig(c => ({ ...c, monthlyBudgetUsd: Number(e.target.value) }))} className="w-full rounded-xl border border-[#DDD6FE] px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]" /><p className="text-xs leading-5 text-[#6D6582]">This is a guardrail setting for future cost enforcement; current free-only providers do not require billing. Keep it at $0 for launch.</p>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#EDE9FE] bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound className="h-5 w-5 text-[#7C3AED]" /> Provider connections</h2>
            <label className="block text-sm font-semibold">Primary provider<select value={config.primaryProvider} onChange={e => setConfig(c => ({ ...c, primaryProvider: e.target.value as Provider }))} className="mt-2 w-full rounded-xl border border-[#DDD6FE] bg-white px-3 py-2.5 text-sm">{(Object.keys(labels) as Provider[]).map(p => <option key={p} value={p}>{labels[p].name}</option>)}</select></label>
            {(Object.keys(labels) as Provider[]).map(provider => <div key={provider} className="rounded-xl border border-[#EDE9FE] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold text-[#1E1035]">{labels[provider].name}</p><p className="mt-1 text-xs text-[#6D6582]">{labels[provider].description}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.providers[provider]?.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FAF9FE] text-[#6D6582]'}`}>{config.providers[provider]?.connected ? 'Connected' : 'Not connected'}</span></div><div className="mt-3 flex gap-2"><input type={visibleKey === provider ? 'text' : 'password'} autoComplete="new-password" value={apiKeys[provider]} onChange={e => setApiKeys(k => ({ ...k, [provider]: e.target.value }))} placeholder={config.providers[provider]?.connected ? 'Key saved securely · enter new key to replace' : 'Paste provider API key'} className="min-w-0 flex-1 rounded-xl border border-[#DDD6FE] px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]" /><button type="button" onClick={() => setVisibleKey(p => p === provider ? null : provider)} aria-label={visibleKey === provider ? 'Hide key' : 'Show key'} className="rounded-xl border border-[#DDD6FE] px-3 text-[#6D6582]">{visibleKey === provider ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><a href={labels[provider].url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-[#DDD6FE] px-3 text-xs font-semibold text-[#6D28D9]">Get key</a><button type="button" onClick={() => void connectProvider(provider)} disabled={saving || !apiKeys[provider].trim()} className="rounded-xl bg-[#7C3AED] px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{config.providers[provider]?.connected ? 'Replace key' : 'Connect key'}</button></div>{config.providers[provider]?.connected && <label className="mt-3 flex items-center gap-2 text-xs text-red-700"><input type="checkbox" checked={Boolean(removeKeys[provider])} onChange={e => setRemoveKeys(r => ({ ...r, [provider]: e.target.checked }))} /> Disconnect and delete saved key</label>}</div>)}
            <p className="flex items-start gap-2 rounded-xl bg-[#FAF9FE] p-3 text-xs leading-5 text-[#6D6582]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED]" /> Keys are encrypted server-side before being stored. They are never returned to the browser. Configure the encryption secret in the Preview deployment environment.</p>
          </div>
        </section>
        <section className="rounded-2xl border border-[#EDE9FE] bg-white p-5"><h2 className="text-lg font-bold">Provider activity · last 30 days</h2><p className="mt-1 text-sm text-[#6D6582]">Aggregated counts only; question text is not stored in usage records.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(usage?.providers || {}).map(([provider, count]) => <div key={provider} className="rounded-xl bg-[#FAF9FE] p-3"><p className="text-xs uppercase tracking-wide text-[#6D6582]">{provider}</p><p className="mt-1 text-xl font-bold">{count}</p></div>)}{!Object.keys(usage?.providers || {}).length && <p className="text-sm text-[#6D6582]">No requests recorded yet.</p>}</div><p className="mt-3 flex items-center gap-2 text-xs text-[#6D6582]"><Image className="h-4 w-4 text-[#7C3AED]" /> Image questions: {usage?.imageRequests30d ?? 0}</p></section>
        <div className="flex justify-end"><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white hover:bg-[#6D28D9] disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving securely…' : 'Save AI settings'}</button></div>
      </main>
    </div>
  </div>;
}
