import type { IncomingMessage } from 'http';

/** Server-only trigger for a fresh Vercel production build after a published change. */
export async function triggerPublicContentRebuild(req: IncomingMessage, reason: string): Promise<boolean> {
  const hook = process.env.VERCEL_PRODUCTION_DEPLOY_HOOK_URL?.trim();
  if (!hook) {
    console.warn('[rebuild] VERCEL_PRODUCTION_DEPLOY_HOOK_URL is not configured.');
    return false;
  }
  let parsed: URL;
  try { parsed = new URL(hook); } catch {
    console.error('[rebuild] Production deploy hook URL is invalid.');
    return false;
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.vercel.com') || parsed.username || parsed.password) {
    console.error('[rebuild] Refusing an unsafe or unexpected deploy hook URL.');
    return false;
  }
  const host = String(req.headers.host || '').toLowerCase();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').toLowerCase();
  const productionHost = [host, forwardedHost].some((value) => value === 'www.prbsolver.com' || value === 'prbsolver.com');
  if (!productionHost) return false;
  try {
    const response = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'PRBSolver published content', reason: reason.slice(0, 80) }),
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error('[rebuild] Vercel deploy hook returned HTTP', response.status);
      return false;
    }
    console.info('[rebuild] Vercel production rebuild triggered:', reason);
    return true;
  } catch (error) {
    console.error('[rebuild] Vercel production rebuild request failed:', error instanceof Error ? error.message : 'unknown error');
    return false;
  }
}
