import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

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

  const geminiKey = String(process.env.GEMINI_API_KEY || '').trim();
  const openRouterKey = String(process.env.OPENROUTER_API_KEY || '').trim();
  const groqKey = String(process.env.GROQ_API_KEY || '').trim();
  const hasGemini = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');
  const hasOpenRouter = Boolean(openRouterKey);
  const hasGroq = Boolean(groqKey);

  if (!hasGemini && !hasOpenRouter && !hasGroq) {
    return send(res, 503, { success: false, error: 'The advanced question service is not configured yet. Supported questions can still use the free built-in solver. Please try again later.' });
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
  const errors: string[] = [];

  // Vision questions use Gemini only: generic free-model routes do not guarantee image support.
  if (hasGemini) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const parts: any[] = [{ text: prompt + '\n\nStudent question:\n' + questionText }];
      if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }],
        config: { responseMimeType: 'application/json', temperature: 0.15, maxOutputTokens: 7000 },
      });
      const solution = cleanSolution(parseJsonResponse(response.text || ''));
      if (solution) return send(res, 200, { success: true, solution, provider: 'gemini' });
      errors.push('Gemini returned an incomplete response');
    } catch (error: any) {
      errors.push('Gemini request failed: ' + String(error?.message || error).slice(0, 160));
    }
  }

  // Text-only free fallbacks; never send student images to unverified vision models.
  if (!image && hasOpenRouter) {
    try {
      const parsed = await callCompatibleProvider({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: openRouterKey,
        model: 'openrouter/free',
        prompt,
        question: questionText,
        headers: { 'HTTP-Referer': 'https://www.prbsolver.com', 'X-Title': 'PRBSolver Math Problem Solver' },
      });
      const solution = cleanSolution(parsed);
      if (solution) return send(res, 200, { success: true, solution, provider: 'openrouter' });
      errors.push('OpenRouter returned an incomplete response');
    } catch (error: any) {
      errors.push('OpenRouter request failed: ' + String(error?.message || error).slice(0, 160));
    }
  }

  if (!image && hasGroq) {
    try {
      const parsed = await callCompatibleProvider({
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: groqKey,
        model: 'openai/gpt-oss-20b',
        prompt,
        question: questionText,
      });
      const solution = cleanSolution(parsed);
      if (solution) return send(res, 200, { success: true, solution, provider: 'groq' });
      errors.push('Groq returned an incomplete response');
    } catch (error: any) {
      errors.push('Groq request failed: ' + String(error?.message || error).slice(0, 160));
    }
  }

  console.error('[math-solver] Eligible providers failed:', errors.join(' | ').slice(0, 700));
  if (image && !hasGemini) {
    return send(res, 503, { success: false, error: 'Image solving is not available right now. Please type the question, or try again when the image-solving service is available.' });
  }
  return send(res, 503, { success: false, error: 'Free advanced solving services are busy or have reached their limits. Please try again later; supported built-in questions still work without AI.' });
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
