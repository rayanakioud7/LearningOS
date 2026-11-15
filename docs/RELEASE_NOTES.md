# 0.9.0 — clearer daily decisions

Added calm recovery-day screens, contextual calendar links, relevant session-review fields, and incoming/current backup comparison with stale-preview refresh. All 204 local tests pass. See RELEASE_0_9_0.md and BROWSER_QA.md.

# 0.8.0 — quieter navigation

Fixed page-wide clicks resetting the interface; added chapter search, simpler resource browsing, focused forms and labeled mobile navigation. All 196 local tests and the listed real-browser flows passed. See RELEASE_0_8_0.md and BROWSER_QA.md.

# 0.7.0 — browsing and reliability

Fixes task-specific timer allocation, fractional estimate editing, optional-summer academic priority, catalog-only resource controls, semester filtering and saved task labels. Adds URL/back navigation, keyboard calendar controls, searchable/paginated history, projection caching and coherent offline updates. Cuts ineffective legacy settings controls from the strict-roadmap UI.

187 checks pass; three socket checks and real-browser verification remain blocked locally. A Chromium CI gate is added. See [RELEASE_0_7_0.md](RELEASE_0_7_0.md) for exact evidence and publishing status.

# 0.6.0 — UX and plan v3 (in progress on fix/ux-plan-v3)

Curriculum:
- Resource cards show the full catalog contents; resource detail lists every source unit with status, estimates, prerequisites and source links
- Unit staging with transitive dependency staging (stageUnits); preferred subjects is now a checkbox resource picker

Calendar:
- 3-Year navigation moves 36 months; Semester steps between semester ranges; Jump to date plus a semester quick-jump selector

Engine/planner:
- ENSAM override excluded from the independent weekly ceiling
- Multi-block weekday projections from the weekly template (primary + secondary blocks, e.g. Stat 110 then Data Science Handbook after the primary block)
- Roadmap phases (S1A, S1B recovery Jan–Feb 2027, S2, Summers 1–2, S3–S6) with phase capacity budgets; the weekly ceiling is the lower of the phase budget and the user setting
- Finishing a task early pulls a secondary-block task the same day; the week re-plans heuristically instead of locking every day

Roadmap data: scripts/roadmap-overrides.mjs (public ENSAM modules, weekly templates, academic windows); no private archive bytes or names enter dist.

Core tests and release validation pass.

# 0.5.0 — Scheduling Engine v2 (local implementation; verification pending)

Fixes remaining-effort reset, soft-vs-confirmed deadlines, shared daily capacity, pin validity and prerequisite deadline feasibility. Adds real civil-date calendar navigation through June 2029, keyboard semester tabs, collapsed resources, corrected edition staging and grouped immutable attempt history. Today retains its focus layout and four outcomes. Schema 2 remains compatible; no user backup is shipped.

115 core tests and release validation pass. Full storage/socket/browser verification and comparison to the inaccessible ZIP-only handoff remain required. See `SCHEDULING_V2_REPORT.md` for exact evidence, limitations and recovery.

# 0.3.1 — verified browser workflows

- Fixed Add task being blocked when no focus timer existed. Actual focused tasks still require finishing or cancelling their session before editing.
- Added a regression test for missing task IDs.
- Verified timer refresh, all outcomes, task editing, backup restore/recovery, concurrent tabs and offline reopening in the real browser.
- Inspected desktop and phone-width layouts and visible keyboard focus. The minimal black design is preserved.

Core browser verification is complete. Physical two-device transfer, native installation and Zen-specific behavior are outside the observed checks. See BROWSER_QA.md.

# 0.3.0 — reliability and portable sessions

- Preserved the minimal black Today screen.
- Backup export pauses a running focus session. Restore resumes it in a paused state, so travel or file-transfer time never becomes study time.
- Added an automatic local recovery copy before restore and a confirmed recovery action in Settings.
- Moved saves into an independently tested persistence module. Writes validate state and reject stale revisions; conflicting tabs cannot silently overwrite one another.
- Strengthened backup validation for actual dates, task fields, references, calendars, corrections, overrides and timers. Large dependency chains use an iterative cycle check.
- Allowed a short remaining deliverable to fit a short remaining study block.
- Made explicit Sunday ENSAM overrides work while keeping normal Sunday recovery.
- Included prerequisite effort and already-used academic time in deadline warnings.
- Added a live focus countdown to the browser tab title.

Existing schema-1 study data remains compatible. No study events, completion credit or curriculum activations are fabricated by the update. Future teacher requirements and draft content remain tentative.

## 0.4.0 — Curriculum + Forecast v2 (implementation; verification gate pending)

Adds normalized resource/unit/task references, transactional logical migration, a separate pre-upgrade recovery point, a sanitized catalog preview/import flow and local document attachments. Existing browser history, timers, legacy IDs and old recovery copies remain authoritative. Edits to completed work create followups and sessions keep frozen source provenance.

Adds Day/Week/Month/42-day/Semester/3-Year forecasts through June 2029, semester-specific weekday roles, pinned Today behavior, Wednesday academic protection, capacity/slack controls, calibration and explicit attempt reconciliation. Private note-derived seed drafts and archive filenames/paths are removed from the distributed bundle; existing browser drafts remain local.

88 core tests and the release validator pass. Full fake-indexeddb, real socket and browser integration gates could not complete in the restricted implementation environment. See RELEASE_CHECKLIST.md and TEST_REPORT.json; prior browser evidence does not verify this version.
