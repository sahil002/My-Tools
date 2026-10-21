import { useState, useEffect } from 'react';
import { DynamicIcon } from '../components/DynamicIcon';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { CategoryInfo } from '../types';
import {
  getAllCategoriesFromStorage,
  saveCategoryToStorage,
  deleteCategoryFromStorage,
  clearAllCategoriesFromStorage,
  CATEGORIES_UPDATED_EVENT,
  syncCategoriesFromSupabase,
} from '../services/categoryStorageDB';
import { useMergedTools } from '../services/toolRegistryService';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  X,
  Wrench,
  Calculator,
  FileText,
  ArrowLeftRight,
  Code,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';

const COMMON_ICONS = [
  'Calculator', 'Percent', 'Calendar', 'CalendarClock', 'CalendarDays', 'Clock', 'Timer',
  'FileText', 'TextCursor', 'Type', 'BookOpen', 'BookOpenCheck', 'GraduationCap',
  'ArrowLeftRight', 'ArrowDownUp', 'RefreshCw', 'Globe', 'Languages',
  'Code', 'FileCode', 'Braces', 'Database', 'Network', 'Search',
  'Layers', 'Grid2X2', 'BriefcaseBusiness', 'Wallet', 'Coins', 'CircleDollarSign',
  'PiggyBank', 'Landmark', 'Receipt', 'BadgePercent', 'ShoppingCart', 'Scale', 'Gauge',
  'Image', 'HeartPulse', 'ClipboardCheck', 'ListChecks', 'Sparkles', 'ShieldCheck',
  'Shield', 'Wrench', 'Zap', 'Calculator',
].filter((icon, index, list) => list.indexOf(icon) === index);

const ICON_KEYWORDS: Array<{ terms: string[]; icon: string }> = [
  { terms: ['finance', 'business', 'money', 'investment', 'profit', 'loan', 'salary', 'tax', 'budget', 'ecommerce', 'commerce', 'pay', 'cost', 'margin', 'roas'], icon: 'Wallet' },
  { terms: ['calculator', 'calculation', 'math', 'percentage', 'ratio', 'fraction'], icon: 'Calculator' },
  { terms: ['text', 'writing', 'word', 'character', 'case', 'sentence', 'content', 'copy'], icon: 'TextCursor' },
  { terms: ['converter', 'conversion', 'convert', 'unit', 'measurement'], icon: 'ArrowLeftRight' },
  { terms: ['date', 'time', 'calendar', 'age', 'duration', 'timezone', 'business-day'], icon: 'CalendarClock' },
  { terms: ['education', 'educational', 'student', 'grade', 'gpa', 'school', 'study', 'learning'], icon: 'GraduationCap' },
  { terms: ['developer', 'development', 'code', 'json', 'api', 'programming', 'debug'], icon: 'Code' },
  { terms: ['seo', 'search', 'keyword', 'ranking'], icon: 'Search' },
  { terms: ['image', 'photo', 'design', 'media', 'graphics'], icon: 'Image' },
  { terms: ['health', 'medical', 'fitness', 'wellness'], icon: 'HeartPulse' },
  { terms: ['productivity', 'task', 'checklist', 'workflow'], icon: 'ClipboardCheck' },
  { terms: ['security', 'privacy', 'protection', 'safe'], icon: 'ShieldCheck' },
];

function suggestCategoryIcon(categoryName: string): string {
  const normalized = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const words = new Set(normalized.split(/\s+/).filter(Boolean));
  for (const rule of ICON_KEYWORDS) {
    if (rule.terms.some((term) => words.has(term) || normalized.includes(term))) return rule.icon;
  }
  return 'Grid2X2';
}


export function AdminCategoriesView() {
  const [categories, setCategories] = useState<CategoryInfo[]>(() => getAllCategoriesFromStorage());
  const { tools } = useMergedTools();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [iconName, setIconName] = useState('Grid2X2');
  const [iconMode, setIconMode] = useState<'auto' | 'manual'>('auto');
  const [iconSearch, setIconSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCategories = () => {
    setCategories(getAllCategoriesFromStorage());
  };

  useEffect(() => {
    window.addEventListener(CATEGORIES_UPDATED_EVENT, loadCategories);
    void syncCategoriesFromSupabase(true).then(loadCategories);
    return () => window.removeEventListener(CATEGORIES_UPDATED_EVENT, loadCategories);
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setParentCategoryId('');
    setIconName('Grid2X2');
    setIconMode('auto');
    setIconSearch('');
    setSeoTitle('');
    setSeoDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryInfo) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setParentCategoryId(cat.parentCategoryId || '');
    setIconName(cat.iconName || suggestCategoryIcon(cat.name));
    setIconMode(cat.iconMode || 'auto');
    setIconSearch('');
    setSeoTitle(cat.seoTitle || '');
    setSeoDescription(cat.seoDescription || '');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (iconMode === 'auto') setIconName(suggestCategoryIcon(val));
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || isSaving) return;
    setIsSaving(true);

    const catData: CategoryInfo = {
      id: slug.trim(),
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      parentCategoryId: parentCategoryId || null,
      iconName: iconName || suggestCategoryIcon(name),
      iconMode,
      isVisible: editingCategory?.isVisible !== false,
      seoTitle: seoTitle.trim() || `${name.trim()} – Free Online Tools`,
      seoDescription: seoDescription.trim() || description.trim(),
      toolCount: tools.filter((t) => t.category === slug.trim()).length,
    };

    try {
      await saveCategoryToStorage(catData);
      setIsModalOpen(false);
      setSuccessMessage(editingCategory ? 'Category updated successfully!' : 'New category created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : 'Unable to save category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (cat: CategoryInfo) => {
    const updated = { ...cat, isVisible: cat.isVisible === false };
    try {
      await saveCategoryToStorage(updated);
      setSuccessMessage(updated.isVisible ? `“${cat.name}” is now visible on the website.` : `“${cat.name}” is hidden from the website.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : 'Unable to update category visibility.');
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      await deleteCategoryFromStorage(id);
      setSuccessMessage(`Category "${catName}" removed.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };



  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all categories to start 100% fresh?')) {
      clearAllCategoriesFromStorage();
      setSuccessMessage('All categories cleared.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#FAF9FE] text-[#1E1035] overflow-hidden font-sans">
      <AdminSidebar currentPath="/admin/categories" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminTopNav />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-1.5 shadow-2xs">
                <Layers className="w-3.5 h-3.5" />
                <span>Categories Management</span>
              </div>
              <h1 className="text-2xl font-heading font-extrabold text-[#1E1035] tracking-tight">
                Tool Categories
              </h1>
              <p className="text-xs text-[#6D6582] mt-0.5">
                Organize, create, and manage navigation categories for your public website and mega menu.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">


              {categories.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-heading font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-heading font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Search bar & Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-full lg:w-72">
              <Search className="w-4 h-4 text-[#9D95B3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#EDE9FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none shadow-2xs"
              />
            </div>

            <div className="text-xs text-[#6D6582] font-heading font-medium">
              Total Categories: <span className="font-bold text-[#1E1035]">{categories.length}</span>
            </div>
          </div>

          {/* Categories Table / Empty State */}
          {categories.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#EDE9FE] rounded-2xl space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-[#1E1035]">No Categories Yet</h3>
                <p className="text-xs text-[#6D6582] mt-1 max-w-sm mx-auto">
                  Start fresh by creating a real category for the tools you plan to publish.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-heading font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Create First Category
                </button>

              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9FE] border-b border-[#EDE9FE] text-[#6D6582] font-heading uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Slug / URL</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Tools Count</th>
                      <th className="py-3 px-4 text-center">Visibility</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE]">
                    {filtered.map((cat) => {
                      const normalizeCat = (val?: string) => (val || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      const cSlug = normalizeCat(cat.slug);
                      const cId = normalizeCat(cat.id);
                      const cName = normalizeCat(cat.name);

                      const matched = tools.filter((t) => {
                        const tCat = normalizeCat(t.category);
                        if (!tCat) return false;
                        return (
                          tCat === cSlug ||
                          tCat === cId ||
                          tCat === cName ||
                          (cSlug.length > 2 && tCat.includes(cSlug)) ||
                          (tCat.length > 2 && cSlug.includes(tCat)) ||
                          (cName.length > 2 && tCat.includes(cName)) ||
                          (tCat.length > 2 && cName.includes(tCat))
                        );
                      });

                      const toolCount = matched.length > 0 ? matched.length : (categories.length === 1 && tools.length > 0 ? tools.length : 0);
                      return (
                        <tr key={cat.id} className="hover:bg-[#FAF9FE] transition-colors">
                          <td className="py-3 px-4 font-heading font-bold text-[#1E1035]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                                <DynamicIcon name={cat.iconName || suggestCategoryIcon(cat.name)} className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="block leading-tight">{cat.name}</span>
                                <span className="text-[10px] text-[#9D95B3] font-normal">Icon: {cat.iconName || 'Grid2X2'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#7C3AED]">
                            /{cat.slug}
                          </td>
                          <td className="py-3 px-4 text-[#6D6582] max-w-xs truncate">
                            {cat.description || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                              {toolCount} tools
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => void handleToggleVisibility(cat)}
                              title={cat.isVisible === false ? 'Show category on website' : 'Hide category from website'}
                              aria-label={cat.isVisible === false ? `Show ${cat.name} category` : `Hide ${cat.name} category`}
                              className={`inline-flex items-center justify-center p-2 rounded-lg border transition-colors cursor-pointer ${cat.isVisible === false ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`}
                            >
                              {cat.isVisible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <span className="sr-only">{cat.isVisible === false ? 'Hidden' : 'Visible'}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(cat)}
                                className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                                title="Edit Category"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cat.id, cat.name)}
                                className="p-1.5 rounded-lg text-[#6D6582] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1035]/50 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
        >
          <div className="bg-white border border-[#EDE9FE] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-sm text-[#1E1035]">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#FAF9FE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-heading font-semibold text-[#1E1035] block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Media Tools"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                />
              </div>

              <div>
                <label className="font-heading font-semibold text-[#1E1035] block mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. media-tools"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs font-mono text-[#1E1035] outline-none"
                />
              </div>

              <div>
                <label className="font-heading font-semibold text-[#1E1035] block mb-1">
                  Parent Category
                </label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                >
                  <option value="">Main category (top level)</option>
                  {categories
                    .filter((cat) => !cat.parentCategoryId && cat.id !== editingCategory?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <p className="text-[11px] text-[#6D6582] mt-1">
                  Choose a parent to create a subcategory. Leave empty for a main category.
                </p>
              </div>

              <div>
                <label className="font-heading font-semibold text-[#1E1035] block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of tools in this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="font-heading font-semibold text-[#1E1035] block">
                    Choose Category Icon
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIconMode('auto'); setIconName(suggestCategoryIcon(name)); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#EDE9FE] text-[11px] font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Use suggested icon
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                  <div className="w-11 h-11 rounded-xl bg-white border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shrink-0">
                    <DynamicIcon name={iconName} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1E1035]">{name.trim() || 'Category preview'}</p>
                    <p className="text-[11px] text-[#6D6582]">Selected: {iconName} · {iconMode === 'auto' ? 'Automatic suggestion' : 'Manual selection'}</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9D95B3]" />
                  <input
                    type="search"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Search icons..."
                    aria-label="Search category icons"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-[#EDE9FE] focus:border-[#7C3AED] rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {COMMON_ICONS.filter((icon) => icon.toLowerCase().includes(iconSearch.trim().toLowerCase())).map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => { setIconName(icon); setIconMode('manual'); }}
                      aria-label={`Select ${icon} icon`}
                      aria-pressed={iconName === icon}
                      title={icon}
                      className={`flex flex-col items-center justify-center gap-1.5 min-h-[62px] p-2 rounded-xl border text-[10px] font-medium cursor-pointer transition-all ${iconName === icon ? 'bg-[#F5F3FF] text-[#7C3AED] border-[#7C3AED] ring-1 ring-[#7C3AED]/20' : 'bg-white text-[#6D6582] border-[#EDE9FE] hover:border-[#DDD6FE]'}`}
                    >
                      <DynamicIcon name={icon} className="w-4 h-4" />
                      <span className="max-w-full truncate">{icon}</span>
                    </button>
                  ))}
                </div>
                {COMMON_ICONS.filter((icon) => icon.toLowerCase().includes(iconSearch.trim().toLowerCase())).length === 0 && (
                  <p className="text-xs text-[#6D6582] py-2">No icons match that search.</p>
                )}
              </div>

              <div className="pt-2 border-t border-[#EDE9FE] space-y-2">
                <label className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider block">
                  SEO Meta (Optional)
                </label>
                <input
                  type="text"
                  placeholder="SEO Title (e.g. Media Tools – Free Online Converters)"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                />
                <input
                  type="text"
                  placeholder="Meta Description..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF9FE] border border-[#DDD6FE] focus:border-[#7C3AED] rounded-xl text-xs text-[#1E1035] outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-heading font-medium text-[#6D6582] hover:bg-[#FAF9FE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-heading font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {isSaving ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
