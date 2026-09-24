# Admin Dashboard Integration Guide & AI Prompt

This guide and prompt allows you to import and connect this complete Admin Dashboard into any other tool website.

---

## 📋 Ready-to-Use AI Prompt (Copy & Paste this into your other project)

```text
Please integrate the attached Admin Dashboard into this website project.

### Instructions:
1. **Design & Theme Matching (CRITICAL)**:
   - Adapt the design, typography, spacing, border radiuses, and color palette of the admin panel so it perfectly matches THIS current website's existing UI and design system (do not use hardcoded foreign styling).
   - If this website has a dark/light mode toggle or custom theme variables, make sure the admin panel hooks into them seamlessly.

2. **Integration Scope**:
   - Provide a protected `/admin` route and `/admin/login` login flow.
   - Include the Admin Overview/Dashboard with key metrics: Total Tools, Pageviews, Tool Requests, Comments Moderation, and Traffic Charts.
   - Include tools management, category overviews, tool requests queue, and settings.
   - Connect the tools list to this project's existing tools data/registry so all existing tools on this site appear in the admin panel.

3. **Storage & Authentication**:
   - Implement local authentication with persistent session state (localStorage / sessionStorage) and default credentials (e.g., username: admin, password: changeme).
   - Ensure moderation states, tool requests, and settings persist properly.

4. **Code Quality**:
   - Use our project's existing router and icon library (e.g., lucide-react).
   - Ensure clean TypeScript types and zero build/lint errors.
```

---

## 📁 Files Included in this Admin System:

1. **Authentication & Session**: `src/services/adminAuth.ts`
2. **Overview & Stats**: `src/data/adminOverviewData.ts` & `src/services/adminAnalyticsService.ts`
3. **Tool Requests Service**: `src/services/toolRequestsService.ts`
4. **Comment Moderation**: `src/services/commentModerationService.ts`
5. **Ad Placement & Management**: `src/services/adManagementService.ts`
6. **Main Admin Views**:
   - `src/views/AdminLoginView.tsx`
   - `src/views/AdminDashboardView.tsx`
   - `src/views/AdminToolsView.tsx`
   - `src/views/AdminRequestsView.tsx`
   - `src/views/AdminCommentsView.tsx`
   - `src/views/AdminAnalyticsView.tsx`
   - `src/views/AdminAdsView.tsx`
   - `src/views/AdminSettingsView.tsx`
7. **Admin UI Components**:
   - `src/components/admin/AdminSidebar.tsx`
   - `src/components/admin/AdminTopNav.tsx`
   - `src/components/admin/TrafficChart.tsx`
   - `src/components/admin/ToolUsageChart.tsx`
   - `src/components/admin/RecentActivityFeed.tsx`
