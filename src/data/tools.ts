import { ToolItem } from '../types';

/**
 * Standard tool catalog. Starts fresh/empty per user request so that
 * all categories and tools are managed, created, or uploaded via the Admin Dashboard.
 */
export const TOOLS: ToolItem[] = [];

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TOOLS.find((tool) => tool.slug === slug || tool.id === slug);
}

export function getPopularTools(): ToolItem[] {
  return TOOLS.filter((tool) => tool.popular);
}

export function getFeaturedTools(): ToolItem[] {
  return TOOLS.filter((tool) => tool.featured);
}

export function getToolsByCategory(category: string): ToolItem[] {
  return TOOLS.filter((tool) => tool.category === category);
}

export function searchTools(query: string): ToolItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q))
  );
}
