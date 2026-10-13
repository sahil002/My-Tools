/// <reference types="node" />

interface ImportMetaEnv {
  readonly [key: string]: string | boolean | undefined;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


declare module '*.css' {
  const css: string;
  export default css;
}
