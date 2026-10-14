import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from './supabaseServer.js';

export interface SharedRateLimitState {
  isLocked: boolean;
  secondsLeft: number;
  remainingAttempts: number;
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function normalizeState(data: any): SharedRateLimitState {
  const row = Array.isArray(data) ? data[0] : data;
  return {
    isLocked: Boolean(row?.is_locked),
    secondsLeft: Math.max(0, Number(row?.seconds_left || 0)),
    remainingAttempts: Math.max(0, Number(row?.remaining_attempts || 0)),
  };
}

async function callRateLimitRpc(
  db: SupabaseClient,
  key: string,
  action: 'check' | 'fail' | 'reset',
  maxAttempts: number,
  windowSeconds: number,
): Promise<SharedRateLimitState> {
  const { data, error } = await db.rpc('admin_rate_limit_action', {
    p_key_hash: hashKey(key),
    p_action: action,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error('[adminRateLimit] Persistent rate limit RPC failed:', error.message);
    throw new Error('Persistent administrator rate limiting is unavailable.');
  }
  return normalizeState(data);
}

function getRateLimitDb(): SupabaseClient {
  const db = getSupabaseServerClient(true);
  if (!db) throw new Error('Secure administrator storage is not configured.');
  return db;
}

export async function checkSharedRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<SharedRateLimitState> {
  return callRateLimitRpc(getRateLimitDb(), key, 'check', maxAttempts, windowSeconds);
}

export async function recordSharedRateLimitFailure(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<SharedRateLimitState> {
  return callRateLimitRpc(getRateLimitDb(), key, 'fail', maxAttempts, windowSeconds);
}

export async function resetSharedRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<void> {
  await callRateLimitRpc(getRateLimitDb(), key, 'reset', maxAttempts, windowSeconds);
}
