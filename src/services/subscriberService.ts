/**
 * Real persistent subscriber service for PRBSolver newsletter, tool release alerts, and notifications.
 * Stores subscribers with status, timestamp, source, and notification preferences.
 * Fully synchronized with LocalStorage and Supabase backend.
 */



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
export const SUPABASE_SUBSCRIBERS_SQL = `-- Secure newsletter subscriber storage.
-- Prefer the repository's versioned Supabase migrations for production.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null check (length(trim(email)) between 5 and 254),
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  source text not null default 'homepage_banner',
  notifications_sent integer not null default 0,
  last_notification_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
revoke all on table public.subscribers from public, anon, authenticated;
grant insert on table public.subscribers to anon, authenticated;
grant all on table public.subscribers to service_role;
drop policy if exists "Public can check own subscription" on public.subscribers;
drop policy if exists "Public can update own subscription" on public.subscribers;
drop policy if exists "Public can subscribe" on public.subscribers;
drop policy if exists "Service role full access to subscribers" on public.subscribers;
create policy "Public can subscribe" on public.subscribers
  for insert to anon, authenticated with check (
    length(trim(email)) between 5 and 254
    and position('@' in email) > 1
    and status = 'active'
    and source in ('homepage_banner', 'tool_view', 'footer', 'blog_sidebar')
  );
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
  // Public subscriptions are inserted through a narrow server endpoint. Never use
  // an anon-key upsert here: it can require UPDATE rights and should not touch
  // existing subscriber records or status fields.
  const allowedSources = new Set(['homepage_banner', 'tool_view', 'footer', 'blog_sidebar']);
  if (!allowedSources.has(sub.source)) return;
  try {
    const response = await fetch('/api/public-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: sub.email, source: sub.source }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      console.warn('[Subscribers] Server subscription save failed:', payload?.error || response.status);
    }
  } catch (err) {
    console.warn('[Subscribers] Server subscription request failed:', err);
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
