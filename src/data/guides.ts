import { GuideArticle } from '../types';

/** Production guide registry. Guides are managed through the Admin Panel and persisted in Supabase. */
export const GUIDES: GuideArticle[] = [];

export function getGuideBySlug(_slug: string): GuideArticle | undefined {
  return undefined;
}

export function getGuidesByCategory(_category: string): GuideArticle[] {
  return [];
}
