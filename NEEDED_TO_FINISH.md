## Patrick County GIS Pro — Needed To Finish

This document tracks outstanding work to bring the app to a “complete” state based on the current codebase. It doubles as an execution plan and a living checklist. Update statuses as items are finished.

### Legend
- Status: [ ] Todo, [~] In Progress, [x] Done
- Effort: S (Small), M (Medium), L (Large)

---

### 0) Critical setup and fixes
- [ ] Replace hardcoded Supabase keys with env vars in `src/integrations/supabase/client.ts` (rotate leaked key) — Effort: S
- [ ] Add `.env.example` and real `.env` for frontend and serverless — Effort: S
- [ ] Apply all Supabase migrations in `supabase/migrations/` to project — Effort: M
- [ ] Choose hosting (Vercel or Netlify) and remove the other’s checkout function to avoid drift — Effort: S

### 1) Supabase: schema, auth, policies
- [ ] Verify tables exist for features used (workspaces, versions, members, bookmarks, export_queue, export_logs, ai_jobs, cost_catalog, cost_items, property_*) — Effort: M
- [ ] Implement/enforce RLS policies for user/role scoped access — Effort: M
- [ ] Implement auth UI (email/password + OAuth), session restore, protected routes — Effort: M

### 2) Map layers and data sources
- [ ] Populate `src/data/overlaySources.ts` with real WMS endpoints (FEMA NFHL flood, NRCS soils, local zoning) — Effort: S
- [ ] Populate `src/data/countySources.ts` with parcel `parcelEndpoint` for VA/NC counties — Effort: M
- [ ] Wire `PropertyPanel` to real `PropertyService` records and remove sample data — Effort: S

### 3) Search and directions
- [ ] Add compliant User-Agent and throt­tling for Nominatim; consider alt provider if needed — Effort: S
- [ ] Verify directions provider and billing; or switch to open provider — Effort: M

### 4) Workspaces, versioning, collaboration
- [ ] Confirm `WorkspaceService.save/load` + local fallback works; user feedback paths — Effort: S
- [ ] Ensure `VersionHistoryDialog` list/restore flows work and respect limits — Effort: M
- [ ] Complete `ShareDialog` invite/search, role changes, remove; ensure policies — Effort: M

### 5) Bookmarks and export history
- [ ] Ensure Bookmarks list/remove UI wired to `BookmarksService` — Effort: S
- [ ] Export processing worker/cron: consume `export_queue`, generate files, upload to Storage, append `export_logs` — Effort: M
- [ ] Verify `ExportHistoryDialog` displays logs and statuses — Effort: S

### 6) AI jobs (batch)
- [ ] Replace simulated `AiWorkerClient` with real worker (serverless/cron) for `ai_jobs` status transitions and results — Effort: M
- [ ] Ensure `AiJobsDialog` lists jobs, statuses, and links to extents/results — Effort: S

### 7) PWA, offline, and tile caching
- [ ] Validate `public/manifest.json` and icons; Lighthouse PWA checks — Effort: S
- [ ] Confirm Workbox runtime caching rules work for tiles/APIs — Effort: S
- [ ] Implement tile prefetch in `TilePrefetchDialog` with progress UI — Effort: M
- [ ] Implement offline queue sync in `OfflineQueueService` (edits/exports) — Effort: M

### 8) Surveying and measurement
- [ ] Feature-based snapping and offsets; enhance current grid snap — Effort: M
- [ ] Curves/arcs support with bearings and radii — Effort: M
- [ ] DXF/SHP import and projection handling (export partially present) — Effort: L

### 9) Estimator and cost catalog
- [ ] Seed `cost_catalog` and `cost_items`; CRUD UI to manage — Effort: M
- [ ] Wire `EstimatorPanel` to measurements/AI results; export templates (PDF/DOCX/JSON) — Effort: M

### 10) Payments and monetization
- [ ] Configure Stripe env: `VITE_STRIPE_PK`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`, site URL — Effort: S
- [ ] Verify checkout function on chosen platform; add input validation — Effort: S
- [ ] Implement Stripe webhooks to set plan on user; persist plan in profiles — Effort: M
- [ ] Gate features by plan (Community/Pro/Enterprise) in UI/logic — Effort: M

### 11) Mobile (Android via Capacitor)
- [ ] Validate `capacitor.config.ts`, app id/name, icons/splash — Effort: S
- [ ] Ensure location permissions flow in app — Effort: S
- [ ] Build and test on device with `npm run android:build` — Effort: M

### 12) Observability and analytics
- [ ] Initialize Sentry (dsn, performance) and basic dashboards — Effort: S
- [ ] Implement `pages/Analytics.tsx` with KPIs backed by Supabase views — Effort: M
- [ ] Monitor bundle sizes, vitals; performance budgets — Effort: S

### 13) Security and compliance
- [ ] Rotate exposed Supabase anon key and scrub from history — Effort: S
- [ ] Rate-limit/protect serverless endpoints; CORS checks — Effort: S
- [ ] Confirm imagery/data licensing and attribution — Effort: S

### 14) Testing and CI/CD
- [ ] Expand unit (Vitest) and e2e (Playwright) coverage for critical paths — Effort: M
- [ ] Add CI workflows: lint, typecheck, unit, e2e, build — Effort: S
- [ ] Configure deploy with required env on chosen platform — Effort: S

### 15) Documentation
- [ ] README: overlay examples, Supabase/Stripe/deploy setup — Effort: S
- [ ] Fill `IMPLEMENTATION_PLAN_CHECKLIST.md` or JSON and execute — Effort: S
- [ ] User guide: sharing, workspaces, exports, offline, estimator, AI — Effort: S

---

## Phased Execution Plan

Phase 0 — Foundations (Week 1)
- Supabase env + migrations + RLS
- Rotate keys; `.env.example` and hosting choice

Phase 1 — Core UX & Data (Weeks 2–3)
- Overlays/parcels configuration; Property panel to real data
- Workspaces save/load + versioning; Bookmarks

Phase 2 — PWA & Offline (Weeks 3–4)
- PWA validation; tile caching; tile prefetch dialog
- Offline queue service for edits/exports

Phase 3 — AI & Exports (Weeks 4–5)
- AI job worker + dialog
- Export queue worker + history

Phase 4 — Collaboration & Payments (Weeks 5–6)
- Share/invite/roles; protected routes
- Stripe checkout + webhooks + feature gating

Phase 5 — Surveying & Estimator (Weeks 6–8)
- Snapping/offsets; curves/arcs; DXF/SHP import
- Cost catalog + Estimator wired + export templates

Phase 6 — Mobile, Obs, Tests (Weeks 8–9)
- Capacitor build/test; permissions
- Sentry + Analytics page; CI; tests expansion

---

## Maintenance Notes
- Keep this file updated as items move to [~] and [x].
- When a phase completes, capture learnings and blockers here.

