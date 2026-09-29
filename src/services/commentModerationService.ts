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
import {
  submitToolComment as submitCommentToSupabase,
  updateToolCommentStatus as updateCommentStatusInSupabase,
  deleteToolComment as deleteCommentInSupabase,
} from './supabaseDataService';

// Seed comments providing a realistic cross-section of user interactions
const INITIAL_SEED_COMMENTS: ToolComment[] = [];

/**
 * Loads all comments from local storage, bootstrapping with seed data if uninitialized.
 */
export function getAllCommentsFromStorage(): ToolComment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_COMMENTS));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(c => c && typeof c.id === "string" && !c.id.startsWith("cmt-1"));
      return cleaned;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_COMMENTS));
    return [];
  } catch (err) {
    console.error('Failed to read comments from localStorage', err);
    return [];
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

  // Sync to Supabase in background
  submitCommentToSupabase({
    tool_slug: params.toolSlug,
    author_name: params.authorName,
    author_email: params.authorEmail,
    comment: params.commentText,
    rating: params.rating,
  }).catch(() => {});

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

  const supabaseStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
  updateCommentStatusInSupabase(id, supabaseStatus).catch(() => {});

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
  deleteCommentInSupabase(id).catch(() => {});
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
