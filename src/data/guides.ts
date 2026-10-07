import { GuideArticle } from '../types';

export const GUIDES: GuideArticle[] = [];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  const cleanSlug = (slug || '').toLowerCase().trim();
  if (typeof window !== 'undefined') {
    try {
      const rawDeleted = localStorage.getItem('ot_deleted_guides_v2');
      const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (deletedList.map((s) => s.toLowerCase().trim()).includes(cleanSlug)) {
        return undefined;
      }

      const raw = localStorage.getItem('ot_custom_guides_v2');
      if (raw) {
        const custom: GuideArticle[] = JSON.parse(raw);
        const found = custom.find((g) => g.slug.toLowerCase().trim() === cleanSlug);
        if (found) return found;
      }
    } catch {
      // fallback
    }
  }

  // Check if deleted
  if (typeof window !== 'undefined') {
    try {
      const rawDeleted = localStorage.getItem('ot_deleted_guides_v2');
      const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (deletedList.map((s) => s.toLowerCase().trim()).includes(cleanSlug)) return undefined;
    } catch {
      // ignore
    }
  }

  return GUIDES.find((g) => g.slug.toLowerCase().trim() === cleanSlug);
}

export function getGuidesByCategory(category: string): GuideArticle[] {
  let all = GUIDES;
  if (typeof window !== 'undefined') {
    try {
      const rawDeleted = localStorage.getItem('ot_deleted_guides_v2');
      const deletedSet = new Set<string>(
        rawDeleted ? (JSON.parse(rawDeleted) as string[]).map((s) => s.toLowerCase().trim()) : []
      );

      const raw = localStorage.getItem('ot_custom_guides_v2');
      const custom: GuideArticle[] = raw ? JSON.parse(raw) : [];
      const map = new Map<string, GuideArticle>();
      GUIDES.forEach((g) => {
        if (!deletedSet.has(g.slug.toLowerCase().trim())) map.set(g.slug, g);
      });
      custom.forEach((g) => {
        if (!deletedSet.has(g.slug.toLowerCase().trim())) map.set(g.slug, g);
      });
      all = Array.from(map.values());
    } catch {
      // fallback
    }
  }
  return all.filter((g) => g.category === category);
}
