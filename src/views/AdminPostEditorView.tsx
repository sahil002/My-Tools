import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { WordPressGuideEditor } from '../components/admin/WordPressGuideEditor';
import {
  getAllMergedGuidesSync,
  saveGuideArticle,
  GUIDES_UPDATED_EVENT,
} from '../services/guideStorageDB';
import { GuideArticle } from '../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function AdminPostEditorView() {
  const { currentPath, navigate } = useRouter();

  // Extract query parameters from currentPath
  const targetSlug = useMemo(() => {
    try {
      const queryString = currentPath.includes('?') ? currentPath.split('?')[1] : '';
      if (!queryString) return null;
      const params = new URLSearchParams(queryString);
      return params.get('slug') || params.get('edit') || params.get('id') || null;
    } catch {
      return null;
    }
  }, [currentPath]);

  // All guides from database / cache
  const [allGuides, setAllGuides] = useState<GuideArticle[]>(getAllMergedGuidesSync);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [toastNotice, setToastNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  // Sync state if external changes happen
  useEffect(() => {
    const handleUpdate = () => setAllGuides(getAllMergedGuidesSync());
    window.addEventListener(GUIDES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(GUIDES_UPDATED_EVENT, handleUpdate);
  }, []);

  const showToast = (text: string, isError = false) => {
    setToastNotice({ text, isError });
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Find initial guide if editing
  const existingGuide = useMemo(() => {
    if (!targetSlug) return undefined;
    return allGuides.find((g) => g.slug.toLowerCase().trim() === targetSlug.toLowerCase().trim());
  }, [targetSlug, allGuides]);

  const handleSave = async (article: GuideArticle) => {
    setIsSavingArticle(true);
    try {
      const res = await saveGuideArticle(article);
      showToast(res.message || 'Article saved successfully!', !res.success);
      if (res.success) {
        setAllGuides(getAllMergedGuidesSync());
        // If it was a new article and has a slug, update URL quietly to avoid re-creation on refresh
        if (!targetSlug && article.slug) {
          try {
            window.history.replaceState({}, '', `/admin/guides/create?slug=${article.slug}`);
          } catch {
            // ignore
          }
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save article.', true);
    } finally {
      setIsSavingArticle(false);
    }
  };

  const handleClose = () => {
    navigate('/admin/guides');
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F9F8FD] font-sans relative">
      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl border flex items-center gap-2.5 text-xs font-heading font-bold shadow-lg ${
              toastNotice.isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {toastNotice.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastNotice.text}</span>
          </div>
        </div>
      )}

      {/* Full-Page WordPress & RankMath Studio */}
      <div className="flex-1 w-full flex flex-col">
        <WordPressGuideEditor
          key={existingGuide?.slug || 'new-guide-draft'}
          initialGuide={existingGuide}
          onSave={handleSave}
          onClose={handleClose}
          isSaving={isSavingArticle}
          isFullPage={true}
        />
      </div>
    </div>
  );
}
