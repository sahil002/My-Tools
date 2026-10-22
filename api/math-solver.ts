import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';
import { getSupabaseServerClient } from './_lib/supabaseServer.js';
import { decryptProviderKey } from './_lib/mathAiCrypto.js';
import { handleAdminMathAI, handleMathAIStatus } from './_lib/mathAiAdminHandlers.js';

type ImageInput = { mimeType: string; data: string };
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function send(res: ServerResponse, status: number, payload: unknown) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.writeHead(status).end(JSON.stringify(payload));
}

async function readBody(req: IncomingMessage, maxBytes = 8_000_000): Promise<any> {
  let raw = '';
  for await (const chunk of req as any) {
    raw += chunk.toString();
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
      throw Object.assign(new Error('The request is too large. Use a smaller image.'), { statusCode: 413 });
    }
  }
  try { return JSON.parse(raw || '{}'); }
  catch { throw Object.assign(new Error('Please check your question and try again.'), { statusCode: 400 }); }
}

function cleanSolution(value: any) {
  const kind = ['quadratic', 'linear', 'identity', 'none', 'general'].includes(value?.kind) ? value.kind : 'general';
  const steps = Array.isArray(value?.steps) ? value.steps.slice(0, 24).map((step: any) => ({
    title: String(step?.title || 'Working step').slice(0, 180),
    work: String(step?.work || '').slice(0, 1200),
    why: String(step?.why || 'This step applies a mathematical rule to move toward the solution.').slice(0, 1200),
    detail: String(step?.detail || step?.explanation || step?.why || '').slice(0, 2400),
  })).filter((step: any) => step.work || step.detail) : [];
  if (!String(value?.answer || '').trim() || steps.length === 0) return null;
  return {
    kind,
    answer: String(value.answer).slice(0, 3000),
    steps,
    check: String(value.check || 'Review the working and substitute the result back into the original question where applicable.').slice(0, 2000),
    concept: String(value.concept || 'This question uses the mathematical method described below.').slice(0, 1200),
    formula: String(value.formula || 'See the method and working steps below.').slice(0, 800),
    practice: String(value.practice || '').slice(0, 500),
    practiceAnswer: String(value.practiceAnswer || '').slice(0, 500),
    methodName: String(value.methodName || '').slice(0, 180),
    problemType: String(value.problemType || '').slice(0, 180),
    methodReason: String(value.methodReason || '').slice(0, 1200),
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const requestUrl = new URL(req.url || '/api/math-solver', 'http://localhost');
  const action = requestUrl.searchParams.get('action');
  if (action === 'admin-config') return handleAdminMathAI(req, res);
  if (action === 'status') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();
    return handleMathAIStatus(req, res);
  }
  // Uploaded tools run inside a sandboxed iframe (opaque "null" origin). This endpoint
  // is intentionally public without cookies; API credentials stay server-side.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { success: false, error: 'Method not allowed.' });
  }

  const ipHeader = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  const ip = ipHeader.split(',')[0].trim().slice(0, 100);
  const now = Date.now();
  const bucket = requestCounts.get(ip);
  if (bucket && bucket.resetAt > now && bucket.count >= 12) {
    return send(res, 429, { success: false, error: 'You have tried several questions in a short time. Please wait a minute and try again.' });
  }
  requestCounts.set(ip, !bucket || bucket.resetAt <= now ? { count: 1, resetAt: now + 60_000 } : { count: bucket.count + 1, resetAt: bucket.resetAt });

  let body: any;
  try { body = await readBody(req); }
  catch (error: any) { return send(res, error.statusCode || 400, { success: false, error: error.message || 'Invalid request.' }); }

  const question = String(body?.question || '').trim().slice(0, 10000);
  const image = body?.image as ImageInput | null;
  if (body?.action === 'health') {
    return send(res, 200, { success: true, service: 'PRBSolver Math Solver API', version: 1 });
  }
  if (!question && !image) return send(res, 400, { success: false, error: 'Enter a question or upload a clear image of it.' });
  if (image) {
    if (!imageTypes.has(image.mimeType) || typeof image.data !== 'string' || image.data.length > 7_000_000) {
      return send(res, 400, { success: false, error: 'Use a JPG, PNG or WEBP image under 5 MB.' });
    }
    try {
      if (Buffer.from(image.data, 'base64').byteLength > 5_000_000) {
        return send(res, 413, { success: false, error: 'The image is too large. Please upload one under 5 MB.' });
      }
    } catch {
      return send(res, 400, { success: false, error: 'The image could not be read. Please upload it again.' });
    }
  }

  const supabase = getSupabaseServerClient(true);
  if (!supabase) return send(res, 503, { success: false, error: 'The advanced solver is not configured yet. Supported questions can still use the free built-in solver.' });

  let config: any;
  try {
    const { data, error } = await supabase.from('math_ai_config').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    config = data;
  } catch (error) {
    console.error('[math-solver] Unable to read AI settings:', error instanceof Error ? error.message : 'unknown');
    return send(res, 503, { success: false, error: 'Advanced solving settings are temporarily unavailable. Please try again later.' });
  }
  if (!config?.ai_enabled) {
    await logUsage(supabase, { provider: 'local', outcome: 'disabled', imageUsed: Boolean(image), inputChars: question.length });
    return send(res, 403, { success: false, error: 'AI solving is turned off. Please use a supported built-in question or try a simpler question.' });
  }
  if (image && !config.image_upload_enabled) {
    await logUsage(supabase, { provider: 'none', outcome: 'disabled', imageUsed: true, inputChars: question.length });
    return send(res, 403, { success: false, error: 'Question image upload is disabled right now. Please type the question instead.' });
  }

  const stored = config.provider_credentials && typeof config.provider_credentials === 'object' ? config.provider_credentials : {};
  const keys: Record<string, string> = {};
  for (const provider of ['gemini', 'openrouter', 'groq']) {
    if (stored[provider]) {
      try { keys[provider] = decryptProviderKey(String(stored[provider])); }
      catch (error) { console.error('[math-solver] Credential decrypt failed for', provider); }
    }
  }
  const primary = ['gemini', 'openrouter', 'groq'].includes(config.primary_provider) ? config.primary_provider : 'gemini';
  const order = config.fallback_enabled
    ? [primary, ...['gemini', 'openrouter', 'groq'].filter(p => p !== primary)]
    : [primary];
  const eligible = order.filter(p => keys[p] && (!image || p === 'gemini'));
  if (!eligible.length) {
    await logUsage(supabase, { provider: 'none', outcome: 'quota_limited', imageUsed: Boolean(image), inputChars: question.length, errorCode: 'no_connected_provider' });
    return send(res, 503, { success: false, error: image ? 'Image solving needs a connected Gemini key and enabled image uploads.' : 'No connected provider is available. Connect an API key in Admin → Math AI Control Center.' });
  }

  const prompt = `You are a careful, expert mathematics tutor embedded in an online math learning tool. Solve the student's question accurately and teach the reasoning, not just the answer.

Return ONLY valid JSON with this shape:
{
  "kind": "quadratic" | "linear" | "identity" | "none" | "general",
  "problemType": "short mathematical name/classification",
  "methodName": "method used",
  "methodReason": "why this method fits",
  "answer": "clear final answer",
  "concept": "brief concept explanation",
  "formula": "main formula or rule",
  "steps": [{"title":"step title","work":"equations and reasoning","why":"why the step is valid","detail":"student-friendly explanation of what happens"}],
  "check": "verification using substitution, independent calculation, units, or another suitable check",
  "practice": "similar practice question",
  "practiceAnswer": "practice answer"
}
Rules:
- Do not invent missing values. If ambiguous, state the assumption or ask for clarification.
- Cover arithmetic, fractions, percentages, ratios, exponents, algebra, equations, inequalities, systems, factoring, functions, sequences, geometry, trigonometry, coordinate geometry, probability, statistics, limits, derivatives, integrals, matrices, vectors, proofs, and word problems.
- For word problems, define variables, extract known data, form a model, solve, and state units.
- Show intermediate steps and preserve exact forms where practical.
- Verify independently when possible; never claim a check succeeded if it did not.
- If an image is unreadable, do not guess.
- Do not mention providers or internal implementation.
- Return 2–12 meaningful steps where appropriate. If uncertain, state the limitation honestly.`;

  const questionText = question || 'Read and solve the math question in the attached image.';
  const startedAt = Date.now();
  const errors: string[] = [];
  for (const provider of eligible) {
    try {
      let parsed: any = null;
      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: keys.gemini });
        const parts: any[] = [{ text: prompt + '\n\nStudent question:\n' + questionText }];
        if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts }],
          config: { responseMimeType: 'application/json', temperature: 0.15, maxOutputTokens: 7000 },
        });
        parsed = parseJsonResponse(response.text || '');
      } else if (provider === 'openrouter') {
        parsed = await callCompatibleProvider({
          url: 'https://openrouter.ai/api/v1/chat/completions', key: keys.openrouter, model: 'openrouter/free',
          prompt, question: questionText,
          headers: { 'HTTP-Referer': 'https://www.prbsolver.com', 'X-Title': 'PRBSolver Math Problem Solver' },
        });
      } else if (provider === 'groq') {
        parsed = await callCompatibleProvider({
          url: 'https://api.groq.com/openai/v1/chat/completions', key: keys.groq, model: 'openai/gpt-oss-20b',
          prompt, question: questionText,
        });
      }
      const solution = cleanSolution(parsed);
      if (!solution) throw new Error('Provider returned an incomplete response');
      await logUsage(supabase, { provider, outcome: 'success', imageUsed: Boolean(image), latencyMs: Date.now() - startedAt, inputChars: question.length });
      return send(res, 200, { success: true, solution });
    } catch (error: any) {
      const message = String(error?.message || error).slice(0, 160);
      errors.push(provider + ': ' + message);
      const lower = message.toLowerCase();
      const limited = /429|rate.?limit|quota|resource_exhausted|too many requests/.test(lower);
      await logUsage(supabase, { provider, outcome: limited ? 'quota_limited' : 'error', imageUsed: Boolean(image), latencyMs: Date.now() - startedAt, inputChars: question.length, errorCode: limited ? 'rate_limited' : 'provider_error' });
    }
  }
  console.error('[math-solver] Providers failed:', errors.join(' | ').slice(0, 700));
  return send(res, 503, { success: false, error: 'The connected free AI services are busy or have reached their limits. Please try again shortly. Supported built-in questions still work without AI.' });
}

async function logUsage(supabase: any, event: { provider: string; outcome: string; imageUsed: boolean; latencyMs?: number; inputChars: number; errorCode?: string }) {
  try {
    await supabase.from('math_ai_usage').insert({
      provider: event.provider,
      outcome: event.outcome,
      image_used: event.imageUsed,
      latency_ms: event.latencyMs == null ? null : Math.max(0, Math.round(event.latencyMs)),
      input_chars: Math.max(0, event.inputChars),
      estimated_cost_usd: 0,
      error_code: event.errorCode || null,
    });
  } catch (error) {
    console.error('[math-solver] Usage log write failed:', error instanceof Error ? error.message : 'unknown');
  }
}

function parseJsonResponse(raw: string): any {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}

async function callCompatibleProvider(args: {
  url: string; key: string; model: string; prompt: string; question: string;
  headers?: Record<string, string>;
}) {
  const response = await fetch(args.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${args.key}`, 'Content-Type': 'application/json', ...(args.headers || {}) },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: 'system', content: args.prompt + '\nReturn only a valid JSON object, without markdown fences.' },
        { role: 'user', content: args.question },
      ],
      temperature: 0.15,
      max_tokens: 7000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload: any = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('Empty provider response');
  const parsed = parseJsonResponse(content);
  if (!parsed) throw new Error('Provider returned invalid JSON');
  return parsed;
}
