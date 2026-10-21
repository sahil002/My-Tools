-- First-class hierarchy for main categories and their subcategories.
-- Existing categories remain top-level by default.
alter table public.categories
  add column if not exists parent_category_id uuid null
    references public.categories(id) on delete set null;

create index if not exists idx_categories_parent_visible_name
  on public.categories (parent_category_id, is_visible, name);
