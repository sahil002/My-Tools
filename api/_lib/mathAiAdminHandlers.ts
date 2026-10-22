import type { IncomingMessage, ServerResponse } from 'http';
import { getAuthenticatedAdminFromRequest, parseJsonBody, sendJson } from './adminAuthServer.js';
import { getSupabaseServerClient } from './supabaseServer.js';
import { decryptProviderKey, encryptProviderKey } from './mathAiCrypto.js';

type Provider = 'gemini' | 'openrouter' | 'groq';
const providers: Provider[] = ['gemini', 'openrouter', 'groq'];
const configDefaults = { ai_enabled: false, image_upload_enabled: false, primary_provider: 'gemini' as Provider, fallback_enabled: true, monthly_budget_usd: 0 };

function safeConfig(row: any) {
  const stored = row?.provider_credentials && typeof row.provider_credentials === 'object' ? row.provider_credentials : {};
  const providerStatus: Record<string, { connected: boolean }> = {};
  for (const p of providers) providerStatus[p] = { connected: Boolean(stored[p]) };
  return {
    aiEnabled: Boolean(row?.ai_enabled),
    imageUploadEnabled: Boolean(row?.image_upload_enabled),
    primaryProvider: providers.includes(row?.primary_provider) ? row.primary_provider : 'gemini',
    fallbackEnabled: row?.fallback_enabled !== false,
    monthlyBudgetUsd: Number(row?.monthly_budget_usd || 0),
    providers: providerStatus,
    updatedAt: row?.updated_at || null,
  };
}

async function readUsage(supabase: any) {
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data, error } = await supabase.from('math_ai_usage')
    .select('provider,outcome,image_used,latency_ms,estimated_cost_usd,created_at')
    .gte('created_at', since).order('created_at', { ascending: false }).limit(2000);
  if (error) throw error;
  const rows = data || [];
  const summary = {
    requests30d: rows.length,
    successful: rows.filter((x: any) => x.outcome === 'success').length,
    failed: rows.filter((x: any) => x.outcome === 'error' || x.outcome === 'quota_limited').length,
    imageRequests30d: rows.filter((x: any) => x.image_used).length,
    estimatedCostUsd: rows.reduce((n: number, x: any) => n + Number(x.estimated_cost_usd || 0), 0),
    providers: {} as Record<string, number>,
  };
  for (const row of rows) summary.providers[row.provider] = (summary.providers[row.provider] || 0) + 1;
  return summary;
}

export async function handleAdminMathAI(req: IncomingMessage, res: ServerResponse) {
  const admin = getAuthenticatedAdminFromRequest(req);
  if (!admin) return sendJson(res, 401, { success: false, error: 'Authentication required.' });
  const supabase = getSupabaseServerClient(true);
  if (!supabase) return sendJson(res, 503, { success: false, error: 'Server database configuration is incomplete.' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('math_ai_config').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      const usage = await readUsage(supabase);
      return sendJson(res, 200, { success: true, config: safeConfig(data), usage });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
    }
    const body = await parseJsonBody<any>(req);
    if (!body || typeof body !== 'object') return sendJson(res, 400, { success: false, error: 'Invalid settings payload.' });
    const aiEnabled = body.aiEnabled === true;
    const imageUploadEnabled = body.imageUploadEnabled === true;
    const primaryProvider = providers.includes(body.primaryProvider) ? body.primaryProvider : 'gemini';
    const fallbackEnabled = body.fallbackEnabled !== false;
    const budget = Number(body.monthlyBudgetUsd || 0);
    if (!Number.isFinite(budget) || budget < 0 || budget > 10000) return sendJson(res, 400, { success: false, error: 'Monthly budget must be between $0 and $10,000.' });

    const { data: existing, error: readError } = await supabase.from('math_ai_config').select('provider_credentials').eq('id', 1).maybeSingle();
    if (readError) throw readError;
    const credentials: Record<string, string> = { ...(existing?.provider_credentials || {}) };
    const incomingKeys = body.apiKeys && typeof body.apiKeys === 'object' ? body.apiKeys : {};
    for (const provider of providers) {
      const candidate = typeof incomingKeys[provider] === 'string' ? incomingKeys[provider].trim() : '';
      if (candidate) {
        if (candidate.length < 12 || candidate.length > 500) return sendJson(res, 400, { success: false, error: 'One of the API keys is not a valid length.' });
        credentials[provider] = encryptProviderKey(candidate);
      }
      if (body.removeKeys?.[provider] === true) delete credentials[provider];
    }
    if (aiEnabled && !credentials[primaryProvider]) {
      return sendJson(res, 400, { success: false, error: 'Connect an API key for the selected primary provider before enabling AI.' });
    }
    if (imageUploadEnabled && (!aiEnabled || !credentials.gemini)) {
      return sendJson(res, 400, { success: false, error: 'Image upload requires AI to be enabled and a connected Gemini key.' });
    }
    const { error } = await supabase.from('math_ai_config').upsert({
      id: 1,
      ai_enabled: aiEnabled,
      image_upload_enabled: imageUploadEnabled,
      primary_provider: primaryProvider,
      fallback_enabled: fallbackEnabled,
      monthly_budget_usd: budget,
      provider_credentials: credentials,
      updated_at: new Date().toISOString(),
      updated_by: admin.email,
    }, { onConflict: 'id' });
    if (error) throw error;
    const { data: saved, error: savedError } = await supabase.from('math_ai_config').select('*').eq('id', 1).single();
    if (savedError) throw savedError;
    return sendJson(res, 200, { success: true, config: safeConfig(saved) });
  } catch (error) {
    console.error('[admin/math-ai] Failed:', error instanceof Error ? error.message : 'Unknown error');
    return sendJson(res, 500, { success: false, error: 'Unable to save or load AI settings. Check database and encryption configuration.' });
  }
}



export async function handleMathAIStatus(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (_req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, error: 'Method not allowed.' }));
  }
  const supabase = getSupabaseServerClient(true);
  if (!supabase) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, aiEnabled: false, imageUploadEnabled: false }));
  }
  try {
    const { data, error } = await supabase.from('math_ai_config').select('ai_enabled,image_upload_enabled').eq('id', 1).maybeSingle();
    if (error) throw error;
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      aiEnabled: Boolean(data?.ai_enabled),
      imageUploadEnabled: Boolean(data?.ai_enabled && data?.image_upload_enabled),
    }));
  } catch {
    // Fail closed: if configuration cannot be read, hide optional AI features.
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, aiEnabled: false, imageUploadEnabled: false }));
  }
}
