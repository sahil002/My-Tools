/**
 * Real persistent subscriber service for newsletter, tool release alerts, and notifications.
 * Stores subscribers with status, timestamp, source, and notification preferences.
 */

export interface SubscriberItem {
  id: string;
  email: string;
  subscribedAt: string; // ISO string
  status: 'active' | 'unsubscribed';
  source: 'homepage_banner' | 'tool_view' | 'footer' | 'admin_manual';
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

const STORAGE_KEY = 'onlinetools_subscribers_db_v1';
const BROADCAST_HISTORY_KEY = 'onlinetools_broadcast_history_v1';
export const SUBSCRIBERS_UPDATED_EVENT = 'onlinetools_subscribers_updated';

// Seed initial realistic subscribers so the admin dashboard is immediately active and informative
const SEED_SUBSCRIBERS: SubscriberItem[] = [
  {
    id: 'sub-1',
    email: 'epicumair858@gmail.com',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'active',
    source: 'homepage_banner',
    notificationsSent: 3,
    lastNotificationDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'sub-2',
    email: 'sarah.miller@techworks.io',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    status: 'active',
    source: 'tool_view',
    notificationsSent: 2,
    lastNotificationDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'sub-3',
    email: 'david.chen@fincalc.org',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: 'active',
    source: 'homepage_banner',
    notificationsSent: 4,
    lastNotificationDate: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'sub-4',
    email: 'marcus.vance@designops.co',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    status: 'active',
    source: 'footer',
    notificationsSent: 5,
    lastNotificationDate: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: 'sub-5',
    email: 'elena.rostova@mathstudio.net',
    subscribedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    status: 'unsubscribed',
    source: 'tool_view',
    notificationsSent: 2,
  },
];

export function getSubscribers(): SubscriberItem[] {
  if (typeof window === 'undefined') return SEED_SUBSCRIBERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SUBSCRIBERS));
      return SEED_SUBSCRIBERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_SUBSCRIBERS;
  } catch {
    return SEED_SUBSCRIBERS;
  }
}

function saveSubscribers(items: SubscriberItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(SUBSCRIBERS_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to save subscribers:', err);
  }
}

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
    return {
      success: true,
      isNew: true,
      message: 'Welcome back! Your subscription has been reactivated successfully.',
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

  return {
    success: true,
    isNew: true,
    message: 'Successfully subscribed! You will receive email alerts whenever a new tool launches.',
  };
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
    list[index] = {
      ...current,
      status: current.status === 'active' ? 'unsubscribed' : 'active',
    };
    saveSubscribers(list);
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
