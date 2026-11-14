# LearningOS 0.5.0 — Scheduling Engine v2 implementation report

Date: 14 November 2026. **Local implementation; release verification is incomplete.**

Workspace branch: `main`; baseline commit: `cf20cfa`. Implementation changes are uncommitted.

## What changed

| Area | Behavior and files |
| --- | --- |
| Effort | `dist/effort.js`, `curriculum.js`, `engine.js`, `app.js`: retain original estimate, derive time spent from uncorrected immutable attempts, and preserve independently revised remaining effort. Metadata saves no longer clear remaining minutes. Fallback partial estimates are labeled. Conflicting event-ID reuse is rejected; exact retries are idempotent. |
| Scheduling | `dist/planner.js`, `engine.js`: explicit confirmed teacher deadlines and their ready prerequisites can preempt a pin. P0, academic track and a date alone remain soft. Start dates, snoozes, review/activation, resource suspension, dependencies, holidays, recovery, Sunday, exams, PFE and program bounds apply before ranking. Daily academic and independent study share actual available time. |
| Carry-forward | Stable semester weekday roles protect other subjects from substantial partials. Small partial rescue is opt-in and limited to genuinely unused slack after reserving the home block. Backlog diagnostics count missed home opportunities. Same-track continuation still requires an explicit completion and remaining capacity. |
| Feasibility | Confirmed-deadline warnings simulate remaining prerequisite work, start restrictions and shared daily/weekly budgets. Warnings expose unplaceable minutes, blocked prerequisites and overdue status; assessments beyond one year are explicitly limited. |
| Calendar | New `dist/calendar-view.js`: Monday-first 42-cell month matrices; Day/Week/Month/Year/3-Year/42-day/Semester modes; previous/next/today, Go/Enter date input, past history, date details and source drilldowns. Year and 3-Year use compact month grids. The program view spans September 2026–June 2029. |
| Forecast truth | Days 0–13 actionable, 14–41 tentative, later provisional. Past dates show saved uncorrected attempts. Unknown teacher modules are not simulated homework. S6 remains PFE/ENSAM protection with unknown coursework unallocated. Projection results are cached in memory against state/catalog/date identity, never persisted as history. |
| Curriculum | `dist/views.js`, `app.js`: S1–S6 keyboard-operable tabs, search/filter retention, collapsed resources, completion counts, resource display order/preference editing, and existing task order/add/edit/suspend controls. |
| Sources | `scripts/catalog-editions.mjs`, builder and catalog: separate second-edition VanderPlas IDs, NumPy Part II / chapters 4–12, pandas Part III / chapters 13–24, Matplotlib Part IV / chapters 25–36; Wasserman is a selective reference branch. Stored older IDs/headings/completions are never remapped. All new units remain staging material until reviewed and activated. |
| Study Log | New `dist/history-view.js`: same task/day attempts grouped into total focused time, expandable original notes/outcomes/corrections, and separate initial/spent/remaining values. |
| Offline/compatibility | New modules included in the versioned service worker cache. Logical schema remains 2; schema-1 migration, transactional recovery, optimistic revisions, timer snapshots and immutable history checks are retained. No framework, runtime dependency or hosted service added. |

Today retains its existing layout, colors, timer and four outcomes. Its existing details disclosure now includes scheduling explanations and backlog diagnostics. No live browser database was opened or modified during development. No private source documents, notes or actual backup bytes were added to the repository/public assets. Nothing was published or pushed; changes remain local and uncommitted.

## Inputs and exact conformance limitation

Read the current `README_START_HERE.md` and `CODEX_MASTER_PROMPT.md`. Inspected the local v0.4.0 source, existing docs/tests, research policy/catalog/inventory and fixtures. Key local source files matched the adjacent project ZIP.

The attached project and handoff ZIP downloads failed in this restricted environment. Their standalone master/start documents were accessible, as was the actual backup through text reads. The ZIP-only `spec/*.md`, `semester_policy.json`, `tests/scenario_matrix.json`, `tests/browser_acceptance.md` and supplied v2 fixture files were **not accessible**. The implementation follows the readable master contract and extends existing local policy; it cannot be described as verified against the complete handoff. This is a mandatory remaining acceptance gate, not an assumed pass. No substitute is presented as the supplied scenario matrix.

## Executed verification

| Check | Result |
| --- | --- |
| Baseline `npm run validate` | PASS before edits, 234 public units / 960 projection dates. |
| Baseline `npm test` | Four test files passed; two storage suites could not import `fake-indexeddb`; socket suite failed. |
| New regression-first checks | Initially reproduced seven failures involving effort preservation, deadline classification, shared capacity, stale pins, prerequisite risk and invalid dates; all repaired. |
| Current dependency-free core suite | **115 tests pass**, including 27 new tests. Includes 100 existing randomized planning cases, 80 new shared-capacity interruption cases and 30 completed-history preservation cases. |
| `npm run build:catalog` | PASS: 247 public units, 19 resources, 286 opaque archive references; private member names/bytes excluded. |
| `npm run validate` | PASS: schema/graph/privacy checks; 960 nonmutating civil dates; S1–S5 source allocations; S6 protection without invented assignments; offline manifest. |
| Actual supplied backup, isolated Node/file test | PASS: schema 2, 241 tasks and 3 events preserved through export/restore; metadata edit retains events and **120 initial / 75 spent / 200 remaining**. No explicit completion was inferred. Monday ILA and Tuesday MIT are selected rather than the legacy soft academic date. |
| Actual-backup 960-day projection | PASS: source state unchanged; approximately 91 ms in the observed run (environment-specific, not a browser benchmark). |
| Syntax / whitespace | `node --check` for shipped modules and scripts, and `git diff --check`: PASS. |
| Full `npm test` | Attempted; **not green**: six test files pass, two storage suites lack `fake-indexeddb`, and socket tests cannot bind localhost (`EPERM`). |
| Dependency installation | `npm ci --offline`: `ENOTCACHED`; regular `npm ci` with a temporary cache: `EAI_AGAIN`. |
| `npm run test:browser` | Attempted; **blocked before execution** by missing Playwright. Localhost binding is independently denied. |

The core command, with individual test output in this environment:

```sh
node --test --test-isolation=none --test-reporter=spec \
  test/engine.test.mjs test/curriculum-v2.test.mjs \
  test/today.test.mjs test/http-handler.test.mjs \
  test/scheduling-v2.test.mjs test/calendar-v2.test.mjs
```

Two old expectations were deliberately updated: the urgent-task fixture now explicitly confirms a teacher deadline, and S6 validation checks protected/unallocated PFE days rather than requiring invented academic assignments. Catalog counts and build-version expectations were updated for the new staged units. Existing preservation tests remain.

## Remaining limitations and release gates

1. Make the complete handoff files locally accessible, compare the exact semester policy and every supplied scenario to the implementation, and run those acceptance cases. Current checks do not substitute for this comparison.
2. On an unrestricted development host run `npm ci`, `npm test`, `npm run validate`, and the optional Playwright browser driver. Transactional fake-IndexedDB tests remain unexecuted here. Native browser migration/restore and the supplied-backup native IndexedDB roundtrip also remain unverified here.
3. `scripts/browser-qa.mjs` now includes date navigation (past/2028/2029), invalid-date rejection, year/month/day drilldown, semester keyboard selection, actual effort form saves and grouped attempt notes, in addition to the previous timer/restore/recovery/mobile/offline checks. These are implemented checks, **not observed browser results**. Native calendar-picker interaction, visual QA, mobile screenshots, multi-device transfer and Zen rendering still need a real browser. No screenshots were fabricated.
4. Forecasts remain deliberately coarse: one proposed primary allocation per civil day. Real Today can offer another ready task on the same track after explicit completion, but the long-range forecast does not automatically pack every spare minute with several tasks.
5. Default weekly independent ceiling remains limited to the existing 480-minute validation/UI maximum; actual shared discretionary time is separately editable. Any broader ceiling policy in the inaccessible handoff needs reconciliation.
6. Future academic calendars and teacher sequences remain unknown. Backlog diagnostics report home-slot pressure; they do not automatically move substantial work into another subject’s weekday. Clock time-of-day placement is not modeled; availability is a daily minute budget after user-entered unavailable time.
7. Corrections retain the original event and remove its credited time/completion. A manually revised remaining estimate is not automatically recalculated when an older attempt is corrected; revise it explicitly if appropriate.

Repeat the read-only file/model backup regression with `npm run test:backup -- /absolute/private/path/backup.json`. It never opens browser storage or writes the source file.

Optional isolated real-backup browser test, on a host with Playwright/browser support:

```sh
LEARNINGOS_TEST_BACKUP=/absolute/private/path/backup.json npm run test:browser
```

The driver creates disposable browser contexts on an ephemeral server origin. It never imports the backup into the normal application profile, copies it to `dist`, or prints its notes. Existing `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_CHROMIUM` configuration remains supported.

## Recovery and safe local update

1. In the currently used browser/profile/origin, export a fresh backup from Settings **before loading the changed build**. Export pauses a running timer. Keep that file separately.
2. Retain the original source ZIP or previous checkout. Start the updated app with `npm start`, using the same origin/profile. Reload online once to refresh cached modules. Existing browser state is reused; the seed is never imported over it.
3. If behavior is wrong, stop the new server and restore the previous code from the retained source copy. Reopen online and reload the prior service worker. **Do not clear site data or IndexedDB.** The additive schema-2 fields do not require a destructive downgrade.
4. If data restoration is needed, Settings → Restore backup previews the selected export, then saves the current plan as a recovery copy before replacing it. Settings → Recover previous plan swaps back. Recover pre-upgrade plan is separately available when the original schema-1 migration snapshot exists.
5. Restore into a disposable profile first when inspecting an unfamiliar backup. Forecasts have no persisted completion records to delete. Never replace `dist/seed.json` with a personal export.

## Public source verification

- [O’Reilly: Python Data Science Handbook, second-edition contents](https://www.oreilly.com/library/view/python-data-science/9781098121211/).
- [O’Reilly: second-edition publication details and Matplotlib part](https://www.oreilly.com/library/view/python-data-science/9781098121211/copyright-page01.html).
- [Wasserman’s author page](https://stat.cmu.edu/~larry/all-of-statistics/index.html) and [Springer book page](https://link.springer.com/book/10.1007/978-0-387-21736-9).

Catalog headings/references and authored practice/effort are labeled separately. Wasserman’s staged reference does not claim unverified fine-grained section names or create a parallel mandatory course.
