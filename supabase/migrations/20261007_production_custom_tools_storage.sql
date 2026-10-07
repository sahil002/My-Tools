ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS long_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS entry_html_path TEXT,
  ADD COLUMN IF NOT EXISTS zip_file_name TEXT,
  ADD COLUMN IF NOT EXISTS zip_file_size BIGINT,
  ADD COLUMN IF NOT EXISTS files_count INTEGER;

CREATE INDEX IF NOT EXISTS idx_tools_is_custom_active
  ON public.tools (is_custom, is_active);

CREATE INDEX IF NOT EXISTS idx_tools_storage_path
  ON public.tools (storage_path)
  WHERE storage_path IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-tools',
  'custom-tools',
  true,
  26214400,
  ARRAY['text/html']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Service role full access to tools" ON public.tools;
