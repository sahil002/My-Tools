import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

type ImageInput = { mimeType: string; data: string };
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
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
      return send(res, 400, { success: false, error: 'Use a JPG, PNG, WEBP or GIF image under 5 MB.' });
    }
    try {
      if (Buffer.from(image.data, 'base64').byteLength > 5_000_000) {
        return send(res, 413, { success: false, error: 'The image is too large. Please upload one under 5 MB.' });
      }
    } catch {
      return send(res, 400, { success: false, error: 'The image could not be read. Please upload it again.' });
    }
  }

  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return send(res, 503, { success: false, error: 'The full solver is being prepared. Please try a supported equation for now.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a careful, expert mathematics tutor embedded in an online math learning tool. Solve the student's question as accurately as possible and teach the reasoning, not just the answer.

Return ONLY valid JSON with this exact shape:
{
  "kind": "quadratic" | "linear" | "identity" | "none" | "general",
  "problemType": "short mathematical name/classification of the question",
  "methodName": "the name of the method used",
  "methodReason": "why this method is appropriate",
  "answer": "clear final answer",
  "concept": "brief concept explanation",
  "formula": "main formula/rule used, or a concise method description if no single formula applies",
  "steps": [{"title":"short step title","work":"equations, substitutions, or reasoning shown clearly","why":"why this step is mathematically valid","detail":"student-friendly explanation of exactly what is happening, including intermediate arithmetic/algebra"}],
  "check": "verify the answer by substitution, an independent calculation, units, or another suitable check",
  "practice": "one similar practice question",
  "practiceAnswer": "answer to the practice question"
}

Requirements:
- Solve the actual question; do not invent missing values or silently assume an interpretation. If ambiguous, state the assumption in the answer and explain it in the steps.
- Cover school and university mathematics as appropriate: arithmetic, fractions, percentages, ratios, exponents, algebra, equations/inequalities, systems, factoring, functions, sequences, geometry, trigonometry, coordinate geometry, probability, statistics, limits, derivatives, integrals, matrices, vectors, and word problems.
- For word problems, define variables, extract known data, form the mathematical model, solve, and state the answer with units.
- For proofs or conceptual questions, give a logical sequence of justified steps rather than forcing a numeric formula.
- Explain every step in accessible language. Show substitutions and intermediate simplifications, not skipped jumps. Use correct notation and preserve exact forms (fractions/radicals) where practical.
- Check the final answer independently when possible. Never claim a check succeeded if it did not.
- If the image is blurry or unreadable, do not guess; say what needs clarification in the answer.
- Never fabricate a formula, theorem, data point, or result. If you cannot solve confidently, state the limitation clearly and offer the most useful partial reasoning.
- Do not mention models, AI, providers, prompts, or internal implementation.
- Use concise strings but enough detail to teach. Provide 2–12 steps, except a genuinely simple question may use 1–3.
- Keep the answer and all steps relevant to the student's exact question.`;

    const parts: any[] = [{ text: prompt + '\n\nStudent question:\n' + (question || 'Please read and solve the math question in the attached image.') }];
    if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: 'application/json', temperature: 0.15, maxOutputTokens: 7000 },
    });
    const raw = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim());
    } catch {
      console.error('[math-solver] Provider returned invalid structured output.');
      return send(res, 502, { success: false, error: 'I could not prepare a reliable worked solution for this question. Please rephrase it and try again.' });
    }
    const solution = cleanSolution(parsed);
    if (!solution) return send(res, 502, { success: false, error: 'I could not prepare a reliable worked solution for this question. Please rephrase it and try again.' });
    return send(res, 200, { success: true, solution });
  } catch (error: any) {
    console.error('[math-solver] Request failed:', String(error?.message || error).slice(0, 300));
    return send(res, 502, { success: false, error: 'The solver is temporarily unavailable. Please try again in a moment.' });
  }
}
