import { useState, useEffect } from 'react';
import { CategoryInfo } from '../types';
import {
  getAllCategoriesFromStorage,
  CATEGORIES_UPDATED_EVENT,
} from '../services/categoryStorageDB';

export {
  getAllCategoriesFromStorage,
  saveCategoryToStorage,
  deleteCategoryFromStorage,
  seedTemplateCategories,
  clearAllCategoriesFromStorage,
  DEFAULT_TEMPLATE_CATEGORIES,
} from '../services/categoryStorageDB';

/**
 * Returns active categories from storage
 */
export const CATEGORIES: CategoryInfo[] = getAllCategoriesFromStorage();

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  const all = getAllCategoriesFromStorage();
  return all.find((c) => c.slug === slug || c.id === slug);
}

/**
 * React hook to listen to real-time category updates from Admin
 */
export function useCategories(): CategoryInfo[] {
  const [categories, setCategories] = useState<CategoryInfo[]>(() => getAllCategoriesFromStorage());

  useEffect(() => {
    const handleUpdate = () => {
      setCategories(getAllCategoriesFromStorage());
    };

    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleUpdate);
  }, []);

  return categories;
}
