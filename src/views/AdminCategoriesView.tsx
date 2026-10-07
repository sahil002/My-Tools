import { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { CategoryInfo } from '../types';
import {
  getAllCategoriesFromStorage,
  saveCategoryToStorage,
  deleteCategoryFromStorage,
  seedTemplateCategories,
  clearAllCategoriesFromStorage,
  CATEGORIES_UPDATED_EVENT,
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
} from 'lucide-react';

const COMMON_ICONS = [
  'Calculator',
  'FileText',
  'ArrowLeftRight',
  'Code',
  'Calendar',
  'Layers',
  'Sparkles',
  'Shield',
  'Wrench',
  'Zap',
];

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
  const [iconName, setIconName] = useState('Layers');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCategories = () => {
    setCategories(getAllCategoriesFromStorage());
  };

  useEffect(() => {
    window.addEventListener(CATEGORIES_UPDATED_EVENT, loadCategories);
    return () => window.removeEventListener(CATEGORIES_UPDATED_EVENT, loadCategories);
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIconName('Layers');
    setSeoTitle('');
    setSeoDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryInfo) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIconName(cat.iconName || 'Layers');
    setSeoTitle(cat.seoTitle || '');
    setSeoDescription(cat.seoDescription || '');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
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
    if (!name.trim() || !slug.trim()) return;

    const catData: CategoryInfo = {
      id: slug.trim(),
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      iconName: iconName || 'Layers',
      seoTitle: seoTitle.trim() || `${name.trim()} – Free Online Tools`,
      seoDescription: seoDescription.trim() || description.trim(),
      toolCount: tools.filter((t) => t.category === slug.trim()).length,
    };

    await saveCategoryToStorage(catData);
    setIsModalOpen(false);
    setSuccessMessage(editingCategory ? 'Category updated successfully!' : 'New category created successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      await deleteCategoryFromStorage(id);
      setSuccessMessage(`Category "${catName}" removed.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleSeedTemplate = () => {
    if (window.confirm('Load standard starter categories (Calculators, Text Tools, Converters, Developer Tools)?')) {
      seedTemplateCategories();
      setSuccessMessage('Starter categories loaded!');
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
              <button
                type="button"
                onClick={handleSeedTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DDD6FE] transition-colors cursor-pointer"
                title="Populate standard starter categories"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Starter Categories</span>
              </button>

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
                  Start fresh by creating your own custom categories or click &apos;Load Starter Categories&apos; to begin.
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
                <button
                  type="button"
                  onClick={handleSeedTemplate}
                  className="px-4 py-2 bg-[#FAF9FE] border border-[#DDD6FE] text-[#1E1035] hover:bg-[#F5F3FF] text-xs font-heading font-medium rounded-xl transition-all cursor-pointer"
                >
                  Load Starter Template
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
                                <Layers className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="block leading-tight">{cat.name}</span>
                                <span className="text-[10px] text-[#9D95B3] font-normal">Icon: {cat.iconName || 'Layers'}</span>
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

              <div>
                <label className="font-heading font-semibold text-[#1E1035] block mb-1">
                  Icon
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setIconName(icon)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                        iconName === icon
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-[#FAF9FE] text-[#6D6582] border-[#EDE9FE] hover:border-[#DDD6FE]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
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
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-heading font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
