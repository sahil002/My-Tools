import { useState, useEffect } from 'react';
import { TOOLS } from '../data/tools';
import { ToolItem } from '../types';
import { getAllDBCustomTools, getDBStatusOverrides } from './toolStorageDB';
import { getToolsWithSupabaseFallback } from './supabaseDataService';

export const TOOLS_UPDATED_EVENT = 'onlinetools_tools_updated';

/**
 * Transforms custom DB tool records into standard ToolItem format
 */
export async function getMergedToolsList(): Promise<ToolItem[]> {
  try {
    const [customTools, overrides, supabaseTools] = await Promise.all([
      getAllDBCustomTools(),
      getDBStatusOverrides(),
      getToolsWithSupabaseFallback(),
    ]);

    // Use supabaseTools as base if available, else static TOOLS
    const baseTools = supabaseTools && supabaseTools.length > 0 ? supabaseTools : TOOLS;

    // Apply status overrides to base tools
    const updatedBase: ToolItem[] = baseTools.map((t) => {
      const override = overrides[t.id] || overrides[t.slug];
      if (override) {
        return {
          ...t,
          status: (override === 'active' ? 'active' : 'inactive') as 'active' | 'coming-soon' | 'inactive',
        };
      }
      return t;
    });

    // Map custom tools
    const customToolItems: ToolItem[] = customTools
      .filter((c) => c.status !== 'inactive')
      .map((c) => ({
        id: c.slug,
        slug: c.slug,
        name: c.name,
        category: c.category,
        description: c.description,
        iconName: c.iconName || 'Wrench',
        featured: c.featured || false,
        popular: c.popular || false,
        keywords: c.keywords || [],
        status: 'active' as const,
        relatedTools: [],
        relatedGuides: [],
        howToUse: ['Enter inputs into the interactive tool interface.'],
        conceptExplanation: c.longDescription || c.description,
      }));

    // Deduplicate by slug so 1 uploaded tool is never duplicated
    const toolMap = new Map<string, ToolItem>();
    for (const t of updatedBase) {
      if (t.slug) toolMap.set(t.slug.toLowerCase().trim(), t);
    }
    for (const c of customToolItems) {
      if (c.slug) toolMap.set(c.slug.toLowerCase().trim(), c);
    }

    return Array.from(toolMap.values());
  } catch (err) {
    console.warn('[ToolRegistry] Failed to fetch merged tools, falling back to static list:', err);
    return TOOLS;
  }
}

/**
 * Helper to retrieve immediate synchronous tools from localStorage to prevent zero-tool flash
 */
export function getSynchronousToolsList(): ToolItem[] {
  if (typeof window === 'undefined') return TOOLS;
  try {
    const raw = localStorage.getItem('ot_custom_tools_fallback');
    if (!raw) return TOOLS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return TOOLS;
    const customToolItems: ToolItem[] = parsed
      .filter((c: any) => c.status !== 'inactive')
      .map((c: any) => ({
        id: c.slug || c.id,
        slug: c.slug,
        name: c.name,
        category: c.category || 'calculators',
        description: c.description,
        iconName: c.iconName || 'Wrench',
        featured: c.featured || false,
        popular: c.popular || false,
        keywords: c.keywords || [],
        status: 'active' as const,
        relatedTools: [],
        relatedGuides: [],
        howToUse: ['Enter inputs into the interactive tool interface.'],
        conceptExplanation: c.longDescription || c.description,
      }));
    const toolMap = new Map<string, ToolItem>();
    for (const t of TOOLS) {
      if (t.slug) toolMap.set(t.slug.toLowerCase().trim(), t);
    }
    for (const c of customToolItems) {
      if (c.slug) toolMap.set(c.slug.toLowerCase().trim(), c);
    }
    return Array.from(toolMap.values());
  } catch {
    return TOOLS;
  }
}

/**
 * React hook to get all tools (built-in + uploaded custom tools) with live auto-refresh
 */
export function useMergedTools(): { tools: ToolItem[]; isLoading: boolean } {
  const [tools, setTools] = useState<ToolItem[]>(() => getSynchronousToolsList());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      try {
        const merged = await getMergedToolsList();
        if (isMounted) {
          setTools(merged);
        }
      } catch {
        // keep fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    refresh();

    // Listen for updates from tool upload or admin actions
    window.addEventListener(TOOLS_UPDATED_EVENT, refresh);
    return () => {
      isMounted = false;
      window.removeEventListener(TOOLS_UPDATED_EVENT, refresh);
    };
  }, []);

  return { tools, isLoading };
}
