# Patrick County GIS Pro — Strategic Implementation Roadmap

This roadmap sequences high‑impact work with parallel tracks, dependencies, and crisp definitions of done. IDs map to the checklist and JSON for automation.

## Phasing Overview (12–24 weeks, 2‑week sprints)
- Phase 0: Foundations (Sprints 1–2)
- Phase 1: Core Value & Persistence (Sprints 2–4)
- Phase 2: Offline + Batch AI (Sprints 4–6)
- Phase 3: Estimating + Surveying (Sprints 6–9)
- Phase 4: Collaboration + Data Enrichment (Sprints 8–11)
- Phase 5: Mobile Field Ops + Analytics (Sprints 10–12)
- Phase 6: Monetization + Integrations (Sprints 12–14)

Parallelize where P: Yes. Respect deps listed per item.

## Phase 0 — Foundations (critical path)
- FOUND-AUTH-SESSIONS (P: Yes)
- FOUND-DB-MODELS (deps: FOUND-AUTH-SESSIONS)
- FOUND-ERROR-OBS

Definition of Done
- Auth: email/password + OAuth, session restore, protected routes.
- DB: tables for users, workspaces, layers, jobs, exports.
- Observability: Sentry issues + basic dashboards.

## Phase 1 — Core UX & Workspaces
Parallel Tracks
- Track A: SEARCH-FAVORITES, SEARCH-SHAREABLE-LINKS, SEARCH-SUGGESTIONS
- Track B: WS-CLOUD-PERSIST, WS-VERSIONING (deps satisfied), WS-ACL

DoD
- Bookmarks with folders; shareable URL restores map/layers/selection.
- Workspaces save/load to cloud; version history with restore; role‑based access.

## Phase 2 — PWA & Offline + AI Batch
Parallel Tracks
- Track A: PWA-BASELINE → PWA-TILE-CACHE → PWA-QUEUE
- Track B: AI-BATCH-QUEUE; plan schema for AI-CHANGE-DETECT/AI-OBJECTS-EXTEND

DoD
- Installable PWA; selected extents cached; queued edits/exports sync.
- Batch job queue with status; run analyses asynchronously.

## Phase 3 — Cost Estimation & Surveying Toolkit
Parallel Tracks
- Track A: COST-CATALOG → COST-ESTIMATOR-V1 → EXPORT-TEMPLATES
- Track B: SURVEY-SNAPPING → SURVEY-CURVES → SURVEY-DXF-SHP

DoD
- Estimator generates line items from measurements/AI; export to PDF/DOCX/JSON.
- Drawing tools support snapping, offsets, curves; import/export DXF/SHP.

## Phase 4 — Data Enrichment + Collaboration
Parallel Tracks
- Track A: DATA-PARCELS-ZONING, DATA-FLOOD-SOILS, DATA-TIMESERIES
- Track B: COLLAB-ROLES, COLLAB-COMMENTS, COLLAB-VERSIONS

DoD
- Toggle enriched layers; time slider for historical imagery.
- Roles/permissions; comments/mentions; version diffs & rollback.

## Phase 5 — Mobile Field Ops + Analytics
Parallel Tracks
- Track A: FIELD-OFFLINE (deps: PWA-BASELINE, PWA-TILE-CACHE)
- Track B: FIELD-CAPTURE, FIELD-GPS-TRACES
- Track C: ANALYTICS-PIPELINE, ANALYTICS-PERF

DoD
- Full offline workflow; capture photos/notes; GPS traces/stakeout.
- Ops dashboards and app performance monitoring.

## Phase 6 — Monetization & Integrations
Parallel Tracks
- Track A: INTEG-PAYMENTS → MONET-TIERS → MONET-ADDONS
- Track B (later): INTEG-CRM, INTEG-ACCOUNTING, CIVIC-INTAKE, CIVIC-DASH

DoD
- Stripe payments; plan enforcement; addon metering.

## Team & Roles
- Product/Design: backlog, UX flows, acceptance criteria
- Frontend: React/MapLibre/UI, PWA, offline, UX polish
- Backend: Supabase schemas, RPCs, jobs, integrations
- ML/Geo: AI models, change detection, projections, DXF/SHP
- QA/Automation: tests, Playwright/Vitest, CI/CD gates

## Risk & Mitigation
- Imagery licensing: start with open sources; swap via adapter
- AI accuracy: gated rollout; human review; confidence thresholds
- Offline reliability: staged caches; conflict resolution policies
- Data privacy: least‑privilege roles; audit logs; encryption at rest

## Milestones & Demos
- M1 (End P0): Auth + DB + Observability
- M2 (End P1): Cloud workspaces + shareable links + favorites
- M3 (End P2): PWA offline + AI batch jobs
- M4 (Mid P3): Estimator v1 + snapping/curves
- M5 (End P4): Enriched data + collaboration suite
- M6 (End P5): Field ops + analytics
- M7 (End P6): Payments + plans + addons

## Acceptance & QA Gates (per item)
- Unit/e2e tests; performance budgets; accessibility checks
- Rollout behind feature flags; staged % to users; error budget adherence

## Mapping to Checklist IDs
See IMPLEMENTATION_PLAN_CHECKLIST.md and IMPLEMENTATION_PLAN.json for IDs, deps, and recommendations. This roadmap sequences parallel tracks to minimize critical‑path time while isolating risk.

