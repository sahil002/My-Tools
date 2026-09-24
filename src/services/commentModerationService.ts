/**
 * OnlineTools Comments Moderation Service
 * Manages user feedback, reviews, questions, and moderation actions across all tools.
 * Persists to localStorage with cross-tab and event-driven updates.
 */

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface AdminCommentReply {
  text: string;
  repliedAt: string;
  author: string;
}

export interface ToolComment {
  id: string;
  toolSlug: string;
  toolName: string;
  authorName: string;
  authorEmail?: string;
  commentText: string;
  rating?: number; // 1 to 5 stars
  createdAt: string; // ISO 8601
  status: CommentStatus;
  reply?: AdminCommentReply;
  flagReason?: string; // e.g. "Flagged for external URL link", "Potential SEO spam"
  ipAddress?: string;
}

const STORAGE_KEY = 'onlinetools_comments_store_v1';
export const COMMENTS_CHANGED_EVENT = 'onlinetools_comments_changed';

// Seed comments providing a realistic cross-section of user interactions
const INITIAL_SEED_COMMENTS: ToolComment[] = [
  {
    id: 'cmt-101',
    toolSlug: 'percentage-calculator',
    toolName: 'Percentage Calculator',
    authorName: 'Fatima Noor',
    authorEmail: 'fatima.n@domain.com',
    commentText: 'Does this calculator support 3-way discount and sales tax calculation together in a single flow?',
    rating: 5,
    createdAt: '2026-09-19T01:30:00.000Z',
    status: 'pending',
    ipAddress: '192.168.1.42',
  },
  {
    id: 'cmt-102',
    toolSlug: 'password-generator',
    toolName: 'Password Generator',
    authorName: 'Alex Mercer',
    authorEmail: 'alex.m@example.com',
    commentText: 'The real-time entropy score is super helpful when testing password strength against enterprise audit criteria.',
    rating: 5,
    createdAt: '2026-09-18T22:15:00.000Z',
    status: 'approved',
    reply: {
      text: 'Thanks Alex! We calculate entropy using bits of uncertainty based on the selected character set and length.',
      repliedAt: '2026-09-18T23:00:00.000Z',
      author: 'Admin Team',
    },
    ipAddress: '172.56.21.90',
  },
  {
    id: 'cmt-103',
    toolSlug: 'json-formatter',
    toolName: 'JSON Formatter',
    authorName: 'Elena Rostova',
    authorEmail: 'elena@frontend.org',
    commentText: 'Instant copy and JSON validation caught a trailing comma bug in my production config. Saved me 30 minutes of troubleshooting!',
    rating: 5,
    createdAt: '2026-09-18T18:40:00.000Z',
    status: 'approved',
    ipAddress: '104.28.19.112',
  },
  {
    id: 'cmt-104',
    toolSlug: 'word-counter',
    toolName: 'Word Counter',
    authorName: 'Liam O’Connor',
    authorEmail: 'liam.copy@agency.co',
    commentText: 'The reading time estimation is very accurate. Would love an option to adjust reading speed (WPM) manually.',
    rating: 4,
    createdAt: '2026-09-18T16:20:00.000Z',
    status: 'approved',
    reply: {
      text: 'Great feedback Liam! We have queued a configurable WPM slider (defaulting to 200–250 WPM) for the next release.',
      repliedAt: '2026-09-18T17:05:00.000Z',
      author: 'Admin Team',
    },
    ipAddress: '82.165.197.1',
  },
  {
    id: 'cmt-105',
    toolSlug: 'loan-calculator',
    toolName: 'Loan Calculator',
    authorName: 'Marcus Cole',
    authorEmail: 'm.cole@finance.net',
    commentText: 'Can you please add an amortization schedule export to CSV feature? The monthly principal breakdown is very clear.',
    rating: 4,
    createdAt: '2026-09-18T14:10:00.000Z',
    status: 'pending',
    ipAddress: '24.180.11.45',
  },
  {
    id: 'cmt-106',
    toolSlug: 'percentage-calculator',
    toolName: 'Percentage Calculator',
    authorName: 'CryptoBot99',
    authorEmail: 'promo@freecoins-now.biz',
    commentText: 'Double your crypto balance with our verified automated multiplier! Visit bit.ly/free-crypto-now to claim instant payout.',
    createdAt: '2026-09-18T11:00:00.000Z',
    status: 'spam',
    flagReason: 'Automated referral link and suspicious financial keywords',
    ipAddress: '45.142.214.8',
  },
  {
    id: 'cmt-107',
    toolSlug: 'unit-converter',
    toolName: 'Unit Converter',
    authorName: 'Dr. Aris Thorne',
    authorEmail: 'athorne@physics.edu',
    commentText: 'Notice that temperature conversion between Celsius and Fahrenheit handles absolute precision to 4 decimals properly. Excellent utility.',
    rating: 5,
    createdAt: '2026-09-17T20:50:00.000Z',
    status: 'approved',
    ipAddress: '131.215.220.1',
  },
  {
    id: 'cmt-108',
    toolSlug: 'age-calculator',
    toolName: 'Age Calculator',
    authorName: 'Sophia Chen',
    authorEmail: 'sophia@chenfamily.us',
    commentText: 'Used this to calculate exact days, hours, and minutes until my daughter’s milestone birthday. Loved the countdown display!',
    rating: 5,
    createdAt: '2026-09-17T17:25:00.000Z',
    status: 'approved',
    ipAddress: '98.248.60.22',
  },
  {
    id: 'cmt-109',
    toolSlug: 'gpa-calculator',
    toolName: 'GPA Calculator',
    authorName: 'Jordan Vance',
    authorEmail: 'jvance@stateuni.edu',
    commentText: 'Does this account for weighted high school AP classes (5.0 scale) or only standard 4.0 collegiate scale?',
    rating: 3,
    createdAt: '2026-09-17T15:10:00.000Z',
    status: 'pending',
    ipAddress: '152.19.22.4',
  },
  {
    id: 'cmt-110',
    toolSlug: 'time-difference-calculator',
    toolName: 'Time Difference Calculator',
    authorName: 'Tariq Al-Mansoor',
    authorEmail: 'tariq@gulflogistics.ae',
    commentText: 'Accurate timezone and business hours calculator. Helps our distributed teams schedule cross-border handoffs without friction.',
    rating: 5,
    createdAt: '2026-09-16T19:40:00.000Z',
    status: 'approved',
    ipAddress: '194.170.1.20',
  },
  {
    id: 'cmt-111',
    toolSlug: 'case-converter',
    toolName: 'Case Converter',
    authorName: 'DevUser_92',
    commentText: 'asdfghjkl test test test random nonsense 12345',
    createdAt: '2026-09-16T14:05:00.000Z',
    status: 'rejected',
    flagReason: 'Low-quality test string / gibberish submission',
    ipAddress: '185.220.101.5',
  },
  {
    id: 'cmt-112',
    toolSlug: 'json-formatter',
    toolName: 'JSON Formatter',
    authorName: 'WebMasterSEO',
    authorEmail: 'rankings@backlinks-authority.pro',
    commentText: 'Buy high DA backlinks at cheapest rates. Increase your Google SERP ranking today!',
    createdAt: '2026-09-15T22:30:00.000Z',
    status: 'spam',
    flagReason: 'Commercial spam and external promotional keywords',
    ipAddress: '194.26.29.110',
  },
  {
    id: 'cmt-113',
    toolSlug: 'word-counter',
    toolName: 'Word Counter',
    authorName: 'Chloe Bennett',
    authorEmail: 'chloe.writes@literary.press',
    commentText: 'The syllable count and keyword density table makes checking Amazon KDP book descriptions effortless. Thank you for keeping it free and ad-light.',
    rating: 5,
    createdAt: '2026-09-15T18:15:00.000Z',
    status: 'approved',
    ipAddress: '73.189.44.12',
  },
  {
    id: 'cmt-114',
    toolSlug: 'loan-calculator',
    toolName: 'Loan Calculator',
    authorName: 'Brian Miller',
    authorEmail: 'bmiller@homeloans.org',
    commentText: 'Is property tax and homeowners insurance factored into the monthly estimate or only principal and interest?',
    rating: 4,
    createdAt: '2026-09-15T12:00:00.000Z',
    status: 'pending',
    ipAddress: '66.249.80.12',
  },
  {
    id: 'cmt-115',
    toolSlug: 'percentage-calculator',
    toolName: 'Percentage Calculator',
    authorName: 'Hannah Abbott',
    authorEmail: 'hannah@retailconsult.com',
    commentText: 'Clear step-by-step mathematical reasoning. Helps explain calculations to customers during seasonal sales consultations.',
    rating: 5,
    createdAt: '2026-09-14T09:30:00.000Z',
    status: 'approved',
    reply: {
      text: 'Glad to hear it Hannah! We specifically designed the step-by-step section to be transparent and verifiable.',
      repliedAt: '2026-09-14T11:20:00.000Z',
      author: 'Admin Team',
    },
    ipAddress: '86.12.90.150',
  },
];

/**
 * Loads all comments from local storage, bootstrapping with seed data if uninitialized.
 */
export function getAllCommentsFromStorage(): ToolComment[] {
  if (typeof window === 'undefined') return INITIAL_SEED_COMMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_COMMENTS));
      return INITIAL_SEED_COMMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_COMMENTS));
    return INITIAL_SEED_COMMENTS;
  } catch (err) {
    console.error('Failed to read comments from localStorage', err);
    return INITIAL_SEED_COMMENTS;
  }
}

/**
 * Persists comments to localStorage and emits an update event.
 */
function saveCommentsToStorage(comments: ToolComment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    window.dispatchEvent(new CustomEvent(COMMENTS_CHANGED_EVENT, { detail: { comments } }));
  } catch (err) {
    console.error('Failed to save comments to localStorage', err);
  }
}

/**
 * Retrieves comments with flexible filtering.
 */
export function getComments(filters?: {
  toolSlug?: string;
  status?: string;
  dateRange?: string; // 'all' | 'today' | '7days' | '30days'
  search?: string;
}): ToolComment[] {
  let comments = getAllCommentsFromStorage();

  if (!filters) {
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Filter by tool slug
  if (filters.toolSlug && filters.toolSlug !== 'all') {
    comments = comments.filter((c) => c.toolSlug === filters.toolSlug);
  }

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    comments = comments.filter((c) => c.status === filters.status);
  }

  // Filter by date range
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (filters.dateRange === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startMs = startOfToday.getTime();
      comments = comments.filter((c) => new Date(c.createdAt).getTime() >= startMs);
    } else if (filters.dateRange === '7days') {
      const threshold = now - 7 * dayMs;
      comments = comments.filter((c) => new Date(c.createdAt).getTime() >= threshold);
    } else if (filters.dateRange === '30days') {
      const threshold = now - 30 * dayMs;
      comments = comments.filter((c) => new Date(c.createdAt).getTime() >= threshold);
    }
  }

  // Search keyword (authorName, email, commentText, toolName)
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    comments = comments.filter(
      (c) =>
        c.authorName.toLowerCase().includes(q) ||
        (c.authorEmail && c.authorEmail.toLowerCase().includes(q)) ||
        c.commentText.toLowerCase().includes(q) ||
        c.toolName.toLowerCase().includes(q)
    );
  }

  return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Returns approved comments for a specific tool to display on public frontend pages.
 */
export function getApprovedCommentsForTool(toolSlug: string): ToolComment[] {
  const all = getAllCommentsFromStorage();
  return all
    .filter((c) => c.toolSlug === toolSlug && c.status === 'approved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Adds a new comment (default status is 'pending' for moderation).
 */
export function addComment(params: {
  toolSlug: string;
  toolName: string;
  authorName: string;
  authorEmail?: string;
  commentText: string;
  rating?: number;
}): ToolComment {
  const comments = getAllCommentsFromStorage();

  // Basic client-side spam detection check
  const textLower = params.commentText.toLowerCase();
  let status: CommentStatus = 'pending';
  let flagReason: string | undefined = undefined;

  if (
    textLower.includes('http://') ||
    textLower.includes('https://') ||
    textLower.includes('.biz') ||
    textLower.includes('bit.ly') ||
    textLower.includes('crypto') ||
    textLower.includes('viagra') ||
    textLower.includes('backlink')
  ) {
    status = 'spam';
    flagReason = 'Automatic heuristic flagged external link or prohibited commercial terms';
  }

  const newComment: ToolComment = {
    id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    toolSlug: params.toolSlug,
    toolName: params.toolName,
    authorName: params.authorName.trim(),
    authorEmail: params.authorEmail?.trim() || undefined,
    commentText: params.commentText.trim(),
    rating: params.rating,
    createdAt: new Date().toISOString(),
    status,
    flagReason,
  };

  comments.unshift(newComment);
  saveCommentsToStorage(comments);
  return newComment;
}

/**
 * Updates a comment's moderation status.
 */
export function updateCommentStatus(id: string, status: CommentStatus): boolean {
  const comments = getAllCommentsFromStorage();
  const index = comments.findIndex((c) => c.id === id);
  if (index === -1) return false;

  comments[index] = {
    ...comments[index],
    status,
  };
  saveCommentsToStorage(comments);
  return true;
}

/**
 * Adds or updates an official admin reply to a comment.
 * By default, replying also approves the comment if it was pending.
 */
export function replyToComment(
  id: string,
  replyText: string,
  author: string = 'Admin Team',
  approveIfPending: boolean = true
): boolean {
  const comments = getAllCommentsFromStorage();
  const index = comments.findIndex((c) => c.id === id);
  if (index === -1) return false;

  const current = comments[index];
  const newStatus = approveIfPending && current.status === 'pending' ? 'approved' : current.status;

  comments[index] = {
    ...current,
    status: newStatus,
    reply: {
      text: replyText.trim(),
      repliedAt: new Date().toISOString(),
      author,
    },
  };

  saveCommentsToStorage(comments);
  return true;
}

/**
 * Removes an existing reply from a comment.
 */
export function removeCommentReply(id: string): boolean {
  const comments = getAllCommentsFromStorage();
  const index = comments.findIndex((c) => c.id === id);
  if (index === -1) return false;

  delete comments[index].reply;
  saveCommentsToStorage(comments);
  return true;
}

/**
 * Deletes a comment permanently.
 */
export function deleteComment(id: string): boolean {
  const comments = getAllCommentsFromStorage();
  const filtered = comments.filter((c) => c.id !== id);
  if (filtered.length === comments.length) return false;

  saveCommentsToStorage(filtered);
  return true;
}

/**
 * Bulk updates moderation status for an array of comment IDs.
 */
export function bulkUpdateStatus(ids: string[], status: CommentStatus): number {
  if (!ids.length) return 0;
  const idSet = new Set(ids);
  const comments = getAllCommentsFromStorage();
  let updatedCount = 0;

  const updated = comments.map((c) => {
    if (idSet.has(c.id)) {
      updatedCount++;
      return { ...c, status };
    }
    return c;
  });

  if (updatedCount > 0) {
    saveCommentsToStorage(updated);
  }
  return updatedCount;
}

/**
 * Bulk deletes comments by ID list.
 */
export function bulkDelete(ids: string[]): number {
  if (!ids.length) return 0;
  const idSet = new Set(ids);
  const comments = getAllCommentsFromStorage();
  const filtered = comments.filter((c) => !idSet.has(c.id));
  const deletedCount = comments.length - filtered.length;

  if (deletedCount > 0) {
    saveCommentsToStorage(filtered);
  }
  return deletedCount;
}

/**
 * Computes high-level counts for admin badges and status tabs.
 */
export function getCommentsStats(): {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
} {
  const comments = getAllCommentsFromStorage();
  return {
    total: comments.length,
    pending: comments.filter((c) => c.status === 'pending').length,
    approved: comments.filter((c) => c.status === 'approved').length,
    rejected: comments.filter((c) => c.status === 'rejected').length,
    spam: comments.filter((c) => c.status === 'spam').length,
  };
}

/**
 * Returns a list of unique tools that currently have comments.
 */
export function getToolsWithComments(): { slug: string; name: string; count: number }[] {
  const comments = getAllCommentsFromStorage();
  const map = new Map<string, { slug: string; name: string; count: number }>();

  for (const c of comments) {
    const existing = map.get(c.toolSlug);
    if (existing) {
      existing.count++;
    } else {
      map.set(c.toolSlug, { slug: c.toolSlug, name: c.toolName, count: 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
