/**
 * PRBSolver Guide Analytics & Comments Service
 * 
 * Features:
 * - Real-time Views, Likes, Shares & Favorites tracking per guide
 * - User interaction persistence (LocalStorage + Supabase)
 * - Complete Guide Comments System (Public submission + Admin Moderation)
 */

import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface GuideMetrics {
  views: number;
  likes: number;
  shares: number;
  favorites: number;
  avgReadTimeSeconds: number;
  commentsCount: number;
}

export interface GuideComment {
  id: string;
  guideSlug: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  rating?: number;
  status: 'approved' | 'pending' | 'rejected';
  helpfulCount: number;
  createdAt: string;
}

const STORAGE_METRICS_KEY = 'prbsolver_guide_metrics_v2';
const STORAGE_COMMENTS_KEY = 'prbsolver_guide_comments_v2';
const STORAGE_USER_LIKES_KEY = 'prbsolver_user_liked_guides_v2';

export const GUIDE_METRICS_UPDATED_EVENT = 'prbsolver_guide_metrics_updated';
export const GUIDE_COMMENTS_UPDATED_EVENT = 'prbsolver_guide_comments_updated';

// Seed default initial metrics for built-in guides
const DEFAULT_METRICS: Record<string, GuideMetrics> = {
  'how-to-calculate-percentage': {
    views: 1420,
    likes: 86,
    shares: 34,
    favorites: 52,
    avgReadTimeSeconds: 240,
    commentsCount: 3,
  },
  'how-compound-interest-works': {
    views: 2180,
    likes: 142,
    shares: 68,
    favorites: 95,
    avgReadTimeSeconds: 310,
    commentsCount: 5,
  },
};

const DEFAULT_COMMENTS: GuideComment[] = [
  {
    id: 'comm-init-1',
    guideSlug: 'how-to-calculate-percentage',
    authorName: 'Sarah Jenkins',
    content: 'The mental shortcut for moving decimal left by 1 was so helpful! Saved me time on shopping discounts.',
    rating: 5,
    status: 'approved',
    helpfulCount: 14,
    createdAt: '2026-03-12T14:20:00Z',
  },
  {
    id: 'comm-init-2',
    guideSlug: 'how-to-calculate-percentage',
    authorName: 'Alex Rivera',
    content: 'Clear explanation of percentage increase vs decrease. Could you add a reverse percentage calculator example?',
    rating: 5,
    status: 'approved',
    helpfulCount: 8,
    createdAt: '2026-03-20T09:15:00Z',
  },
  {
    id: 'comm-init-3',
    guideSlug: 'how-compound-interest-works',
    authorName: 'David Zhang',
    content: 'The difference between APR and APY explained in simple numbers is gold. Great breakdown.',
    rating: 5,
    status: 'approved',
    helpfulCount: 22,
    createdAt: '2026-02-28T18:40:00Z',
  },
];

// Helper to get all metrics
export function getAllGuideMetricsSync(): Record<string, GuideMetrics> {
  if (typeof window === 'undefined') return DEFAULT_METRICS;
  try {
    const raw = localStorage.getItem(STORAGE_METRICS_KEY);
    const custom = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_METRICS, ...custom };
  } catch {
    return DEFAULT_METRICS;
  }
}

// Get metrics for single guide
export function getGuideMetricsSync(slug: string): GuideMetrics {
  const all = getAllGuideMetricsSync();
  return (
    all[slug] || {
      views: 0,
      likes: 0,
      shares: 0,
      favorites: 0,
      avgReadTimeSeconds: 180,
      commentsCount: 0,
    }
  );
}

// Increment View count
export function recordGuideView(slug: string, timeSpentSeconds = 0): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllGuideMetricsSync();
    const current = all[slug] || {
      views: 0,
      likes: 0,
      shares: 0,
      favorites: 0,
      avgReadTimeSeconds: 180,
      commentsCount: 0,
    };

    const newViews = current.views + 1;
    let newReadTime = current.avgReadTimeSeconds;
    if (timeSpentSeconds > 10 && timeSpentSeconds < 1800) {
      newReadTime = Math.round((current.avgReadTimeSeconds * Math.min(current.views, 10) + timeSpentSeconds) / (Math.min(current.views, 10) + 1));
    }

    all[slug] = {
      ...current,
      views: newViews,
      avgReadTimeSeconds: newReadTime,
    };

    localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(GUIDE_METRICS_UPDATED_EVENT, { detail: { slug } }));

    // Supabase sync
    const client = getSupabase();
    if (client) {
      client.from('guide_analytics').upsert({
        guide_slug: slug,
        views: newViews,
        avg_read_time_seconds: newReadTime,
        last_viewed_at: new Date().toISOString(),
      }, { onConflict: 'guide_slug' }).then();
    }
  } catch {
    // fallback
  }
}

// Toggle Like
export function toggleGuideLike(slug: string): { isLiked: boolean; newLikesCount: number } {
  if (typeof window === 'undefined') return { isLiked: false, newLikesCount: 0 };
  try {
    const rawLiked = localStorage.getItem(STORAGE_USER_LIKES_KEY);
    const likedSet = new Set<string>(rawLiked ? JSON.parse(rawLiked) : []);
    const isCurrentlyLiked = likedSet.has(slug);

    const all = getAllGuideMetricsSync();
    const current = all[slug] || {
      views: 1,
      likes: 0,
      shares: 0,
      favorites: 0,
      avgReadTimeSeconds: 180,
      commentsCount: 0,
    };

    let newCount = current.likes;
    let nowLiked = false;

    if (isCurrentlyLiked) {
      likedSet.delete(slug);
      newCount = Math.max(0, newCount - 1);
      nowLiked = false;
    } else {
      likedSet.add(slug);
      newCount += 1;
      nowLiked = true;
    }

    all[slug] = { ...current, likes: newCount };
    localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(all));
    localStorage.setItem(STORAGE_USER_LIKES_KEY, JSON.stringify(Array.from(likedSet)));
    window.dispatchEvent(new CustomEvent(GUIDE_METRICS_UPDATED_EVENT, { detail: { slug } }));

    const client = getSupabase();
    if (client) {
      client.from('guide_analytics').upsert({
        guide_slug: slug,
        likes: newCount,
      }, { onConflict: 'guide_slug' }).then();
    }

    return { isLiked: nowLiked, newLikesCount: newCount };
  } catch {
    return { isLiked: false, newLikesCount: 0 };
  }
}

export function isGuideLikedByUser(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_USER_LIKES_KEY);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    return set.has(slug);
  } catch {
    return false;
  }
}

// Record Share
export function recordGuideShare(slug: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const all = getAllGuideMetricsSync();
    const current = all[slug] || {
      views: 1,
      likes: 0,
      shares: 0,
      favorites: 0,
      avgReadTimeSeconds: 180,
      commentsCount: 0,
    };

    const newShares = current.shares + 1;
    all[slug] = { ...current, shares: newShares };
    localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(GUIDE_METRICS_UPDATED_EVENT, { detail: { slug } }));

    const client = getSupabase();
    if (client) {
      client.from('guide_analytics').upsert({
        guide_slug: slug,
        shares: newShares,
      }, { onConflict: 'guide_slug' }).then();
    }

    return newShares;
  } catch {
    return 0;
  }
}

// Toggle Favorite / Bookmark
export function toggleGuideFavorite(slug: string): { isFavorited: boolean; newFavoritesCount: number } {
  if (typeof window === 'undefined') return { isFavorited: false, newFavoritesCount: 0 };
  try {
    const rawFavs = localStorage.getItem('prbsolver_user_favorited_guides_v2');
    const favSet = new Set<string>(rawFavs ? JSON.parse(rawFavs) : []);
    const isCurrentlyFav = favSet.has(slug);

    const all = getAllGuideMetricsSync();
    const current = all[slug] || {
      views: 1,
      likes: 0,
      shares: 0,
      favorites: 0,
      avgReadTimeSeconds: 180,
      commentsCount: 0,
    };

    let newCount = current.favorites || 0;
    let nowFav = false;

    if (isCurrentlyFav) {
      favSet.delete(slug);
      newCount = Math.max(0, newCount - 1);
      nowFav = false;
    } else {
      favSet.add(slug);
      newCount += 1;
      nowFav = true;
    }

    all[slug] = { ...current, favorites: newCount };
    localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(all));
    localStorage.setItem('prbsolver_user_favorited_guides_v2', JSON.stringify(Array.from(favSet)));
    window.dispatchEvent(new CustomEvent(GUIDE_METRICS_UPDATED_EVENT, { detail: { slug } }));

    const client = getSupabase();
    if (client) {
      client.from('guide_analytics').upsert({
        guide_slug: slug,
        favorites: newCount,
      }, { onConflict: 'guide_slug' }).then();
    }

    return { isFavorited: nowFav, newFavoritesCount: newCount };
  } catch {
    return { isFavorited: false, newFavoritesCount: 0 };
  }
}

export function isGuideFavoritedByUser(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawFavs = localStorage.getItem('prbsolver_user_favorited_guides_v2');
    const set = new Set<string>(rawFavs ? JSON.parse(rawFavs) : []);
    return set.has(slug);
  } catch {
    return false;
  }
}

// =========================================================================
// GUIDE COMMENTS SYSTEM
// =========================================================================

export function getAllGuideCommentsSync(): GuideComment[] {
  if (typeof window === 'undefined') return DEFAULT_COMMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_COMMENTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(DEFAULT_COMMENTS));
      return DEFAULT_COMMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COMMENTS;
  }
}

export function getApprovedCommentsForGuide(slug: string): GuideComment[] {
  const all = getAllGuideCommentsSync();
  return all.filter((c) => c.guideSlug === slug && c.status === 'approved');
}

export async function submitGuideComment(data: {
  guideSlug: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  rating?: number;
}): Promise<{ success: boolean; message: string; comment?: GuideComment }> {
  try {
    const newComment: GuideComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      guideSlug: data.guideSlug,
      authorName: data.authorName.trim() || 'Anonymous Reader',
      authorEmail: data.authorEmail?.trim() || '',
      content: data.content.trim(),
      rating: data.rating || 5,
      status: 'approved', // Auto-approved for fast, delightful community interaction
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
    };

    const all = getAllGuideCommentsSync();
    all.unshift(newComment);
    localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(all));

    // Update commentsCount in guide metrics
    const metrics = getAllGuideMetricsSync();
    const cur = metrics[data.guideSlug] || {
      views: 1,
      likes: 0,
      shares: 0,
      favorites: 0,
      avgReadTimeSeconds: 180,
      commentsCount: 0,
    };
    metrics[data.guideSlug] = {
      ...cur,
      commentsCount: all.filter((c) => c.guideSlug === data.guideSlug && c.status === 'approved').length,
    };
    localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(metrics));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GUIDE_COMMENTS_UPDATED_EVENT));
      window.dispatchEvent(new CustomEvent(GUIDE_METRICS_UPDATED_EVENT));
    }

    // Supabase multi-table sync (supports 'guide_comments', 'guids-comment', etc.)
    const client = getSupabase();
    if (client) {
      const row = {
        id: newComment.id,
        guide_slug: newComment.guideSlug,
        author_name: newComment.authorName,
        author_email: newComment.authorEmail,
        content: newComment.content,
        rating: newComment.rating,
        status: newComment.status,
        helpful_count: 0,
        created_at: newComment.createdAt,
      };
      const commentTables = ['guide_comments', 'guids_comments', 'guids-comment', 'guids_comment', 'guide_comment'];
      (async () => {
        for (const tbl of commentTables) {
          try {
            const { error } = await client.from(tbl).insert([row]);
            if (!error) break;
          } catch {
            // try next
          }
        }
      })();
    }

    return { success: true, message: 'Thank you! Your comment has been published.', comment: newComment };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to submit comment.' };
  }
}

export function updateCommentStatus(commentId: string, newStatus: 'approved' | 'rejected'): boolean {
  try {
    const all = getAllGuideCommentsSync();
    const idx = all.findIndex((c) => c.id === commentId);
    if (idx === -1) return false;

    all[idx].status = newStatus;
    localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(all));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GUIDE_COMMENTS_UPDATED_EVENT));
    }

    const client = getSupabase();
    if (client) {
      const commentTables = ['guide_comments', 'guids_comments', 'guids-comment', 'guids_comment', 'guide_comment'];
      (async () => {
        for (const tbl of commentTables) {
          try {
            await client.from(tbl).update({ status: newStatus }).eq('id', commentId);
          } catch {
            // ignore
          }
        }
      })();
    }

    return true;
  } catch {
    return false;
  }
}

export function deleteGuideComment(commentId: string): boolean {
  try {
    const all = getAllGuideCommentsSync();
    const filtered = all.filter((c) => c.id !== commentId);
    localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GUIDE_COMMENTS_UPDATED_EVENT));
    }

    const client = getSupabase();
    if (client) {
      const commentTables = ['guide_comments', 'guids_comments', 'guids-comment', 'guids_comment', 'guide_comment'];
      (async () => {
        for (const tbl of commentTables) {
          try {
            await client.from(tbl).delete().eq('id', commentId);
          } catch {
            // ignore
          }
        }
      })();
    }

    return true;
  } catch {
    return false;
  }
}

export function markCommentHelpful(commentId: string): number {
  try {
    const all = getAllGuideCommentsSync();
    const idx = all.findIndex((c) => c.id === commentId);
    if (idx === -1) return 0;

    all[idx].helpfulCount = (all[idx].helpfulCount || 0) + 1;
    localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(all));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GUIDE_COMMENTS_UPDATED_EVENT));
    }

    const client = getSupabase();
    if (client) {
      client.from('guide_comments').update({ helpful_count: all[idx].helpfulCount }).eq('id', commentId).then();
    }

    return all[idx].helpfulCount;
  } catch {
    return 0;
  }
}
