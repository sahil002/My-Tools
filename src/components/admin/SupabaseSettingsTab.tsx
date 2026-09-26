import React, { useState, useEffect } from 'react';
import {
  testSupabaseConnection,
  seedToolsToSupabase,
} from '../../services/supabaseDataService';
import { isSupabaseConfigured, getSupabaseConfig } from '../../lib/supabaseClient';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

const SQL_SCHEMA_SAMPLE = `-- Run this in Supabase -> SQL Editor (supabase.com)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admin Users & Credentials
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_login_at TIMESTAMPTZ
);

-- 2. Tools Table
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

-- 3. User Tool Requests
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

-- 4. Tool Comments & Ratings
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

-- 5. Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Default Admin Account (Change in Supabase as desired)
INSERT INTO public.admin_users (email, password_hash, role)
VALUES ('admin@onlinetools.internal', 'AdminPass2026!', 'super_admin')
ON CONFLICT (email) DO NOTHING;`;

export function SupabaseSettingsTab() {
  const [configured, setConfigured] = useState(isSupabaseConfigured());
  const [config, setConfig] = useState(getSupabaseConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
    setConfig(getSupabaseConfig());
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleSeedTools = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedToolsToSupabase();
      if (res.success) {
        setSeedResult({
          success: true,
          message: `Successfully synchronized ${res.count} tools to Supabase database!`,
        });
      } else {
        setSeedResult({
          success: false,
          message: res.error || 'Failed to sync tools to Supabase.',
        });
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SAMPLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Card */}
      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EDE9FE]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#1E1035] flex items-center gap-2">
                <span>Supabase PostgreSQL Database</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    configured
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {configured ? 'Connected' : 'Setup Required'}
                </span>
              </h3>
              <p className="text-xs text-[#6D6582] mt-0.5">
                Persist tools catalog, admin user credentials, moderation comments, and requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE9FE] text-xs font-medium text-[#1E1035] hover:bg-[#FAF9FE] transition-colors"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#6D6582]" />
            </a>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Connection details / env vars status */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
            <p className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider">
              Project URL
            </p>
            <p className="text-xs font-mono font-medium text-[#1E1035] mt-1 break-all">
              {config.url || 'Not configured in VITE_SUPABASE_URL'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
            <p className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider">
              API Status
            </p>
            <p className="text-xs font-medium text-[#1E1035] mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  configured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {configured
                ? 'Client SDK Initialized'
                : 'Awaiting VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY'}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Step Setup Guide */}
      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-xs">
        <h4 className="font-heading font-bold text-sm text-[#1E1035] flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-[#7C3AED]" />
          <span>Quick 3-Step Setup for Supabase</span>
        </h4>

        <div className="space-y-4 text-xs text-[#6D6582]">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
            <div className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <p className="font-heading font-semibold text-[#1E1035]">
                Add Environment Variables in Vercel & .env
              </p>
              <p className="mt-1">
                Go to Supabase Project Settings ➔ API, copy your project URL and anon key, and add to Vercel:
              </p>
              <div className="mt-2 p-2.5 bg-white border border-[#DDD6FE] rounded-lg font-mono text-[11px] text-[#1E1035] space-y-1">
                <p>VITE_SUPABASE_URL="https://your-project.supabase.co"</p>
                <p>VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."</p>
                <p>SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR..."</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
            <div className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-heading font-semibold text-[#1E1035]">
                  Run Database Schema in Supabase SQL Editor
                </p>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EDE9FE] bg-white text-[11px] font-medium text-[#7C3AED] hover:bg-[#F5F3FF] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SQL' : 'Copy SQL Schema'}</span>
                </button>
              </div>
              <p className="mt-1">
                Paste and run the provided SQL in Supabase SQL Editor to create the <code>admin_users</code>, <code>tools</code>, and <code>tool_requests</code> tables.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
            <div className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-heading font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold text-[#1E1035]">
                    Synchronize & Seed Tools into Supabase
                  </p>
                  <p className="mt-1">
                    Upload all built-in site tools into your newly created Supabase <code>tools</code> table.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSeedTools}
                  disabled={seeding || !configured}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                  <span>{seeding ? 'Syncing...' : 'Sync Tools to DB'}</span>
                </button>
              </div>

              {seedResult && (
                <div
                  className={`mt-2.5 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    seedResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {seedResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{seedResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SQL Preview Box */}
      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-heading font-bold text-sm text-[#1E1035] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#7C3AED]" />
            <span>Database SQL Migration Preview</span>
          </h4>
          <button
            type="button"
            onClick={handleCopySql}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] text-xs font-semibold text-[#1E1035] hover:bg-[#F5F3FF] cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#7C3AED]" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Entire SQL'}</span>
          </button>
        </div>
        <div className="relative">
          <pre className="p-4 bg-[#1E1035] text-[#EDE9FE] rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
            {SQL_SCHEMA_SAMPLE}
          </pre>
        </div>
      </div>
    </div>
  );
}
