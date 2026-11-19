# Automatic production rebuilds after publishing

The admin APIs call `api/_lib/deployHook.ts` only after a successful database write for public content:
- Active custom tool upload/finalize, active tool metadata edits, activate/deactivate, catalogue seed and delete.
- Visible category create/update/delete.
- Guide publish, unpublish, or delete. Saving a draft does not trigger a build.

The trigger is server-side only. The deploy-hook URL is read from `VERCEL_PRODUCTION_DEPLOY_HOOK_URL`; it is never sent to the browser. Calls are ignored on preview/custom non-production hosts.

## One-time Vercel setup

1. Open the PRBSolver project in Vercel.
2. Go to **Settings → Git → Deploy Hooks**.
3. Create a hook named **PRBSolver Published Content** and select branch **main**.
4. Copy the generated hook URL.
5. Open **Settings → Environment Variables** and add:
   - Name: `VERCEL_PRODUCTION_DEPLOY_HOOK_URL`
   - Value: the copied Deploy Hook URL
   - Environment: **Production** only
6. Save the variable and trigger one production deployment so the serverless functions receive it.

Do not prefix the variable with `VITE_`. Never place the URL in frontend code, Supabase rows, or public configuration.

## Runtime behavior

The admin API response includes `rebuildTriggered`. It is `true` only when Vercel accepted the trigger request. If the environment variable is missing or Vercel rejects the request, the content save still succeeds and the server logs a warning. The admin UI can use this flag to show that a deployment is still required.

Deploy Hooks are rate-limited by Vercel. Avoid triggering rebuilds for draft autosaves; only publishing actions call the hook.
