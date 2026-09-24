/**
 * Strict Purple-Variant Theme System:
 * All tools and categories use cohesive variations of purple:
 * - Royal Purple (#7C3AED, tint #F5F3FF)
 * - Deep Violet (#6D28D9, tint #EDE9FE)
 * - Vibrant Orchid (#9333EA, tint #FAF5FF)
 * - Rich Plum (#5B21B6, tint #F3EEFF)
 */

export type CategoryThemeKey = 'finance' | 'developer' | 'ecommerce' | 'business';

export interface CategoryColorDef {
  key: CategoryThemeKey;
  label: string;
  color: string;      // Primary purple variant
  bg: string;         // Light purple tint background
  topBorder: string;  // Tailwind class or style
  badgeClass: string;
  iconClass: string;
  resultTintClass: string;
}

export const CATEGORY_COLORS: Record<CategoryThemeKey, CategoryColorDef> = {
  finance: {
    key: 'finance',
    label: 'Finance',
    color: '#6D28D9',
    bg: '#F5F3FF',
    topBorder: 'border-t-[#6D28D9]',
    badgeClass: 'bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]',
    iconClass: 'bg-[#F5F3FF] text-[#6D28D9]',
    resultTintClass: 'bg-[#F5F3FF] border border-[#DDD6FE]',
  },
  developer: {
    key: 'developer',
    label: 'Developer',
    color: '#7C3AED',
    bg: '#F3EEFF',
    topBorder: 'border-t-[#7C3AED]',
    badgeClass: 'bg-[#F3EEFF] text-[#7C3AED] border border-[#DDD6FE]',
    iconClass: 'bg-[#F3EEFF] text-[#7C3AED]',
    resultTintClass: 'bg-[#F3EEFF] border border-[#DDD6FE]',
  },
  ecommerce: {
    key: 'ecommerce',
    label: 'E-commerce',
    color: '#9333EA',
    bg: '#FAF5FF',
    topBorder: 'border-t-[#9333EA]',
    badgeClass: 'bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]',
    iconClass: 'bg-[#FAF5FF] text-[#9333EA]',
    resultTintClass: 'bg-[#FAF5FF] border border-[#E9D5FF]',
  },
  business: {
    key: 'business',
    label: 'Business',
    color: '#5B21B6',
    bg: '#EDE9FE',
    topBorder: 'border-t-[#5B21B6]',
    badgeClass: 'bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]',
    iconClass: 'bg-[#EDE9FE] text-[#5B21B6]',
    resultTintClass: 'bg-[#EDE9FE] border border-[#DDD6FE]',
  },
};

/**
 * Maps category or tool slug to purple-variant theme
 */
export function getCategoryTheme(categoryOrSlug?: string): CategoryColorDef {
  const norm = (categoryOrSlug || '').toLowerCase().trim();

  if (
    norm.includes('finance') ||
    norm.includes('loan') ||
    norm.includes('emi') ||
    norm.includes('tax') ||
    norm.includes('gst') ||
    norm.includes('mortgage') ||
    norm.includes('interest')
  ) {
    return CATEGORY_COLORS.finance;
  }

  if (
    norm.includes('dev') ||
    norm.includes('json') ||
    norm.includes('code') ||
    norm.includes('format') ||
    norm.includes('base64') ||
    norm.includes('regex')
  ) {
    return CATEGORY_COLORS.developer;
  }

  if (
    norm.includes('ecom') ||
    norm.includes('commerce') ||
    norm.includes('margin') ||
    norm.includes('profit') ||
    norm.includes('discount') ||
    norm.includes('shipping') ||
    norm.includes('retail')
  ) {
    return CATEGORY_COLORS.ecommerce;
  }

  if (norm.includes('percent') || norm.includes('calc')) {
    return CATEGORY_COLORS.finance;
  }

  return CATEGORY_COLORS.business;
}
