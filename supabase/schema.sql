-- ==============================================================================
-- SUPABASE DATABASE SCHEMA FOR ONLINE TOOLS APPLICATION
-- Run this script in your Supabase project's SQL Editor (supabase.com -> SQL Editor)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Administrator Credentials & Accounts Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_login_at TIMESTAMPTZ
);

-- 3. Tools Table (Metadata, Visibility, Stats & Customizations)
CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    usage_count BIGINT NOT NULL DEFAULT 0,
    favorite_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Production custom-tool deployment metadata
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


-- 4. User Submitted Tool Requests
CREATE TABLE IF NOT EXISTS public.tool_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_name TEXT NOT NULL,
    category TEXT,
    email TEXT,
    use_case TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-review', 'planned', 'completed', 'declined')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Tool Comments & Ratings
CREATE TABLE IF NOT EXISTS public.tool_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_slug TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,
    comment TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Site Settings & SEO Overrides
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Email Subscribers & Notifications Table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    source TEXT NOT NULL DEFAULT 'homepage_banner',
    notifications_sent INTEGER NOT NULL DEFAULT 0,
    last_notification_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON public.subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers(created_at DESC);

-- 8. Guides, Blog Posts & Educational Articles
CREATE TABLE IF NOT EXISTS public.guides (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'calculators',
    author TEXT NOT NULL DEFAULT 'PRBSolver Editorial Team',
    published_date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
    updated_date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
    reading_time TEXT NOT NULL DEFAULT '5 min read',
    quick_answer TEXT,
    formula TEXT,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    practical_examples JSONB DEFAULT '[]'::jsonb,
    common_mistakes JSONB DEFAULT '[]'::jsonb,
    related_tools JSONB DEFAULT '[]'::jsonb,
    related_guides JSONB DEFAULT '[]'::jsonb,
    faq JSONB DEFAULT '[]'::jsonb,
    target_keyword TEXT,
    seo_score INTEGER DEFAULT 85,
    is_draft BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_guides_slug ON public.guides(slug);
CREATE INDEX IF NOT EXISTS idx_guides_category ON public.guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON public.guides(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Tools: Public Read for Active Tools
CREATE POLICY "Public can view active tools"
    ON public.tools
    FOR SELECT
    USING (is_active = true);

-- Tool Requests: Public can insert new requests
CREATE POLICY "Public can submit tool requests"
    ON public.tool_requests
    FOR INSERT
    WITH CHECK (true);

-- Tool Comments: Public can view approved comments
CREATE POLICY "Public can view approved comments"
    ON public.tool_comments
    FOR SELECT
    USING (status = 'approved');

-- Tool Comments: Public can submit comments
CREATE POLICY "Public can submit comments"
    ON public.tool_comments
    FOR INSERT
    WITH CHECK (true);

-- Site Settings: Public can view public site settings
CREATE POLICY "Public can read site settings"
    ON public.site_settings
    FOR SELECT
    USING (true);

-- Admin tables: Server (service_role) has full administrative access to all tables
CREATE POLICY "Service role full access to admin_users"
    ON public.admin_users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR true);

CREATE POLICY "Service role full access to tool_requests"
    ON public.tool_requests
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR true);

CREATE POLICY "Service role full access to tool_comments"
    ON public.tool_comments
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR true);

CREATE POLICY "Service role full access to site_settings"
    ON public.site_settings
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR true);

-- Subscribers: Public can subscribe and check/update status
CREATE POLICY "Public can subscribe"
    ON public.subscribers
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can read subscribers"
    ON public.subscribers
    FOR SELECT
    USING (true);

CREATE POLICY "Public can update subscriber status"
    ON public.subscribers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to subscribers"
    ON public.subscribers
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR true);

-- Guides: Public can read published guides, admin has full access
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published guides"
    ON public.guides
    FOR SELECT
    USING (is_draft = false OR true);

CREATE POLICY "Service role full access to guides"
    ON public.guides
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR true);

-- ==============================================================================
-- INITIAL SEED DATA (Optional Admin Account)
-- Replace 'YOUR_ADMIN_EMAIL' and 'YOUR_SECURE_PASSWORD' before running,
-- OR manage credentials via your Vercel Environment Variables.
-- ==============================================================================
-- INSERT INTO public.admin_users (email, password_hash, role)
-- VALUES ('admin@yourdomain.com', 'YourStrongAdminPasswordHere!', 'super_admin')
-- ON CONFLICT (email) DO NOTHING;


-- Production Storage bucket for self-contained custom tool HTML bundles.
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
