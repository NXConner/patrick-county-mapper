# Patrick County GIS Pro — Implementation Plan & Yes/No Checklist

This document lists proposed enhancements with Yes/No boxes, stable IDs, and recommended defaults. Mark one box per item, save, and upload.

Legend: Effort (S=Small, M=Medium, L=Large), Parallelizable (P), Dependencies (Deps)

---

## 0) Platform Foundations

[ ] Yes    [ ] No
ID: FOUND-AUTH-SESSIONS
Title: Add user auth (Supabase) and session management
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: Supabase

[ ] Yes    [ ] No
ID: FOUND-DB-MODELS
Title: Define DB models for workspaces, layers, jobs, exports
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-AUTH-SESSIONS

[ ] Yes    [ ] No
ID: FOUND-ERROR-OBS
Title: Expand Sentry + logging/metrics dashboards
Recommendation: Yes
Effort: S  |  P: Yes  |  Deps: None

## 1) Core UX & Search

[ ] Yes    [ ] No
ID: SEARCH-FAVORITES
Title: Favorites/bookmarks with folders and quick access
Recommendation: Yes
Effort: S  |  P: Yes  |  Deps: FOUND-DB-MODELS

[ ] Yes    [ ] No
ID: SEARCH-SHAREABLE-LINKS
Title: Shareable URLs (map state, layers, selection)
Recommendation: Yes
Effort: S  |  P: Yes  |  Deps: None

[ ] Yes    [ ] No
ID: SEARCH-SUGGESTIONS
Title: History-based and provider-backed auto-suggestions
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: None

## 2) Workspaces & Cloud Persistence

[ ] Yes    [ ] No
ID: WS-CLOUD-PERSIST
Title: Persist workspaces (map state, drawings) to Supabase
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-DB-MODELS

[ ] Yes    [ ] No
ID: WS-ACL
Title: Roles/permissions for shared workspaces
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-AUTH-SESSIONS, WS-CLOUD-PERSIST

[ ] Yes    [ ] No
ID: WS-VERSIONING
Title: Workspace versioning with diffs and rollback
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: WS-CLOUD-PERSIST

## 3) PWA & Offline

[ ] Yes    [ ] No
ID: PWA-BASELINE
Title: PWA install, service worker, app shell caching
Recommendation: Yes
Effort: S  |  P: Yes  |  Deps: None

[ ] Yes    [ ] No
ID: PWA-TILE-CACHE
Title: Offline tile caching for selected extents
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: PWA-BASELINE

[ ] Yes    [ ] No
ID: PWA-QUEUE
Title: Offline queue for edits/exports with sync
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: PWA-BASELINE, WS-CLOUD-PERSIST

## 4) AI & Batch Processing

[ ] Yes    [ ] No
ID: AI-BATCH-QUEUE
Title: Job queue for batch AI analysis (areas of interest)
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-DB-MODELS

[ ] Yes    [ ] No
ID: AI-EDGE-MODE
Title: Edge/on-device inference mode toggle for speed
Recommendation: No (later)
Effort: L  |  P: Limited  |  Deps: AI-BATCH-QUEUE

[ ] Yes    [ ] No
ID: AI-CHANGE-DETECT
Title: Change detection across imagery dates
Recommendation: Yes
Effort: L  |  P: Yes  |  Deps: AI-BATCH-QUEUE

[ ] Yes    [ ] No
ID: AI-OBJECTS-EXTEND
Title: Extend detection to roofs/pools/fences/culverts
Recommendation: Yes
Effort: L  |  P: Yes  |  Deps: AI-BATCH-QUEUE

## 5) Cost Estimation & Exports

[ ] Yes    [ ] No
ID: COST-CATALOG
Title: Cost catalog (materials, labor, region multipliers)
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-DB-MODELS

[ ] Yes    [ ] No
ID: COST-ESTIMATOR-V1
Title: Line-item estimator from AI/measurements
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: COST-CATALOG

[ ] Yes    [ ] No
ID: EXPORT-TEMPLATES
Title: Expand templates (contracts, technical, 3D, DOCX)
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: None

## 6) Surveying Toolkit

[ ] Yes    [ ] No
ID: SURVEY-SNAPPING
Title: Snapping, offsets, and constraints for drawing tools
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: None

[ ] Yes    [ ] No
ID: SURVEY-CURVES
Title: Curves/arcs support with bearings and radii
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: SURVEY-SNAPPING

[ ] Yes    [ ] No
ID: SURVEY-DXF-SHP
Title: DXF/SHP import/export and projection handling
Recommendation: Yes
Effort: L  |  P: Yes  |  Deps: None

## 7) Data Enrichment

[ ] Yes    [ ] No
ID: DATA-PARCELS-ZONING
Title: Parcels, zoning, building footprints importers
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-DB-MODELS

[ ] Yes    [ ] No
ID: DATA-FLOOD-SOILS
Title: FEMA flood, soils, hydrology overlays
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: None

[ ] Yes    [ ] No
ID: DATA-TIMESERIES
Title: Historical imagery and time slider
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: None

## 8) Collaboration

[ ] Yes    [ ] No
ID: COLLAB-ROLES
Title: Roles & permissions (viewer, editor, admin)
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-AUTH-SESSIONS

[ ] Yes    [ ] No
ID: COLLAB-COMMENTS
Title: Comments, mentions, activity log
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: WS-CLOUD-PERSIST

[ ] Yes    [ ] No
ID: COLLAB-VERSIONS
Title: Layer/version diffs and rollback
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: WS-VERSIONING

## 9) Mobile Field Operations

[ ] Yes    [ ] No
ID: FIELD-OFFLINE
Title: Full offline mode (maps, parcels, edits)
Recommendation: Yes
Effort: L  |  P: Yes  |  Deps: PWA-BASELINE, PWA-TILE-CACHE

[ ] Yes    [ ] No
ID: FIELD-CAPTURE
Title: Photo/notes/sketch capture tied to features
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: WS-CLOUD-PERSIST

[ ] Yes    [ ] No
ID: FIELD-GPS-TRACES
Title: GPS recording, stakeout guidance
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: None

## 10) Analytics & Dashboards

[ ] Yes    [ ] No
ID: ANALYTICS-PIPELINE
Title: Job pipeline KPIs, lead heatmaps
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-DB-MODELS

[ ] Yes    [ ] No
ID: ANALYTICS-PERF
Title: App performance dashboards & alerts
Recommendation: Yes
Effort: S  |  P: Yes  |  Deps: FOUND-ERROR-OBS

## 11) Integrations

[ ] Yes    [ ] No
ID: INTEG-CRM
Title: CRM (HubSpot/Salesforce) sync of contacts/opportunities
Recommendation: No (later)
Effort: M  |  P: Yes  |  Deps: FOUND-DB-MODELS

[ ] Yes    [ ] No
ID: INTEG-PAYMENTS
Title: Payments (Stripe) for deposits/invoices
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: COST-ESTIMATOR-V1

[ ] Yes    [ ] No
ID: INTEG-ACCOUNTING
Title: Accounting (QuickBooks) export
Recommendation: No (later)
Effort: M  |  P: Yes  |  Deps: INTEG-PAYMENTS

## 12) Public/Civic

[ ] Yes    [ ] No
ID: CIVIC-INTAKE
Title: Public request intake for pavement issues
Recommendation: No (pilot later)
Effort: M  |  P: Yes  |  Deps: FOUND-AUTH-SESSIONS

[ ] Yes    [ ] No
ID: CIVIC-DASH
Title: Public dashboards for transparency
Recommendation: No (pilot later)
Effort: M  |  P: Yes  |  Deps: ANALYTICS-PIPELINE

## 13) Monetization & Packaging

[ ] Yes    [ ] No
ID: MONET-TIERS
Title: Plans (Community/Pro/Enterprise), seat & storage limits
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: FOUND-AUTH-SESSIONS, INTEG-PAYMENTS

[ ] Yes    [ ] No
ID: MONET-ADDONS
Title: Add-ons (premium imagery, AI credits, batch limits)
Recommendation: Yes
Effort: M  |  P: Yes  |  Deps: MONET-TIERS

---

How to use this checklist
1) For every item, mark either Yes or No (one box only). Replace "[ ]" with "[x]" for Yes.
2) Save this file and upload it back to the project.
3) Automation will parse your selections by ID and execute the plan in parallel where possible, respecting dependencies.