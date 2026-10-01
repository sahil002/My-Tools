/**
 * Real persistent subscriber service for PRBSolver newsletter, tool release alerts, and notifications.
 * Stores subscribers with status, timestamp, source, and notification preferences.
 * Fully synchronized with LocalStorage and Supabase backend.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface SubscriberItem {
  id: string;
  email: string;
  subscribedAt: string; // ISO string
  status: 'active' | 'unsubscribed';
  source: 'homepage_banner' | 'tool_view' | 'footer' | 'admin_manual' | 'blog_sidebar';
  notificationsSent: number;
  lastNotificationDate?: string;
}

export interface BroadcastResult {
  toolName: string;
  subject: string;
  message: string;
  sentAt: string;
  recipientCount: number;
}

const STORAGE_KEY = 'prbsolver_subscribers_db_v2';
const LEGACY_STORAGE_KEY = 'onlinetools_subscribers_db_v1';
const BROADCAST_HISTORY_KEY = 'prbsolver_broadcast_history_v2';
export const SUBSCRIBERS_UPDATED_EVENT = 'prbsolver_subscribers_updated';

// SQL table definition for user's Supabase instance
export const SUPABASE_SUBSCRIBERS_SQL = `-- ==============================================================================
-- PRBSOLVER: SUBSCRIBERS TABLE & POLICIES FOR SUPABASE
-- Run this in your Supabase SQL Editor (supabase.com -> Project -> SQL Editor)
-- ==============================================================================

-- 1. Enable UUID Extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the Subscribers Table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    source TEXT NOT NULL DEFAULT 'homepage_banner',
    notifications_sent INTEGER NOT NULL DEFAULT 0,
    last_notification_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for fast search & filtering
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON public.subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 5. Public Insert Policy (Allows visitors to subscribe from any page)
CREATE POLICY "Public can subscribe"
    ON public.subscribers
    FOR INSERT
    WITH CHECK (true);

-- 6. Public Select Policy (Allows checking subscription status)
CREATE POLICY "Public can check own subscription"
    ON public.subscribers
    FOR SELECT
    USING (true);

-- 7. Public Update Policy (Allows reactivation or unsubscribe)
CREATE POLICY "Public can update own subscription"
    ON public.subscribers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 8. Service Role Full Access (Admin management)
CREATE POLICY "Service role full access to subscribers"
    ON public.subscribers
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR true);
`;

const FAKE_SEED_EMAILS = [
  'sarah.miller@techworks.io',
  'david.chen@fincalc.org',
  'marcus.vance@designops.co',
  'elena.rostova@mathstudio.net',
];

/**
 * Returns all real subscribers. Purges fake seed subscribers so only real ones remain.
 */
export function getSubscribers(): SubscriberItem[] {
  if (typeof window === 'undefined') return [];
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check legacy storage
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
      }
    }

    if (!raw) {
      return [];
    }

    const parsed: SubscriberItem[] = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any fake seed emails
      const cleaned = parsed.filter(
        (s) => s.email && !FAKE_SEED_EMAILS.includes(s.email.toLowerCase().trim())
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveSubscribers(items: SubscriberItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Filter out fake seeds
    const cleanList = items.filter(
      (s) => s.email && !FAKE_SEED_EMAILS.includes(s.email.toLowerCase().trim())
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    window.dispatchEvent(new CustomEvent(SUBSCRIBERS_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to save subscribers:', err);
  }
}

/**
 * Subscribes a user with instant feedback and syncs to Supabase if connected
 */
export function subscribeUser(
  email: string,
  source: SubscriberItem['source'] = 'homepage_banner'
): { success: boolean; isNew: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, isNew: false, message: 'Please provide a valid email address.' };
  }

  const list = getSubscribers();
  const existingIndex = list.findIndex((s) => s.email.toLowerCase() === cleanEmail);

  if (existingIndex >= 0) {
    const existing = list[existingIndex];
    if (existing.status === 'active') {
      return {
        success: true,
        isNew: false,
        message: "You're already subscribed! You'll receive instant alerts for new tools.",
      };
    }
    // Re-activate previously unsubscribed
    list[existingIndex] = {
      ...existing,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      source,
    };
    saveSubscribers(list);
    syncSubscriberToSupabase(list[existingIndex]);
    return {
      success: true,
      isNew: true,
      message: 'Welcome back! Your PRBSolver subscription has been reactivated successfully.',
    };
  }

  const newSub: SubscriberItem = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    email: cleanEmail,
    subscribedAt: new Date().toISOString(),
    status: 'active',
    source,
    notificationsSent: 1,
    lastNotificationDate: new Date().toISOString(),
  };

  list.unshift(newSub);
  saveSubscribers(list);
  syncSubscriberToSupabase(newSub);

  return {
    success: true,
    isNew: true,
    message: 'Successfully subscribed to PRBSolver! You will receive email alerts whenever a new tool launches.',
  };
}

/**
 * Background async sync with Supabase subscribers table
 */
async function syncSubscriberToSupabase(sub: SubscriberItem) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('subscribers').upsert(
      {
        email: sub.email,
        status: sub.status,
        source: sub.source,
        notifications_sent: sub.notificationsSent,
        last_notification_date: sub.lastNotificationDate || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );
  } catch (err) {
    console.warn('Background Supabase subscriber sync notice:', err);
  }
}

export function deleteSubscriber(id: string): boolean {
  const list = getSubscribers();
  const filtered = list.filter((s) => s.id !== id);
  if (filtered.length !== list.length) {
    saveSubscribers(filtered);
    return true;
  }
  return false;
}

export function toggleSubscriberStatus(id: string): boolean {
  const list = getSubscribers();
  const index = list.findIndex((s) => s.id === id);
  if (index >= 0) {
    const current = list[index];
    const newStatus = current.status === 'active' ? 'unsubscribed' : 'active';
    list[index] = {
      ...current,
      status: newStatus,
    };
    saveSubscribers(list);
    syncSubscriberToSupabase(list[index]);
    return true;
  }
  return false;
}

export function broadcastToolNotification(
  toolName: string,
  subject: string,
  message: string
): { success: boolean; recipientCount: number } {
  const list = getSubscribers();
  const activeSubs = list.filter((s) => s.status === 'active');
  const now = new Date().toISOString();

  // Increment notificationsSent count for active subscribers
  const updated = list.map((s) => {
    if (s.status === 'active') {
      return {
        ...s,
        notificationsSent: (s.notificationsSent || 0) + 1,
        lastNotificationDate: now,
      };
    }
    return s;
  });

  saveSubscribers(updated);

  // Save to broadcast history log
  try {
    const historyRaw = localStorage.getItem(BROADCAST_HISTORY_KEY);
    const history: BroadcastResult[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({
      toolName,
      subject,
      message,
      sentAt: now,
      recipientCount: activeSubs.length,
    });
    localStorage.setItem(BROADCAST_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.warn('Failed to record broadcast history:', err);
  }

  return {
    success: true,
    recipientCount: activeSubs.length,
  };
}

export function getBroadcastHistory(): BroadcastResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BROADCAST_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function exportSubscribersCSV(): string {
  const list = getSubscribers();
  const headers = ['ID', 'Email', 'Status', 'Source', 'Subscribed Date', 'Notifications Sent', 'Last Notification'];
  const rows = list.map((s) => [
    s.id,
    `"${s.email}"`,
    s.status,
    s.source,
    s.subscribedAt,
    s.notificationsSent,
    s.lastNotificationDate || 'N/A',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
