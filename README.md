# LearningOS · 0.12.0

**0.12.0:** optional one-question refresher before focus, a revealable answer, skip/start controls and copyable LLM context. No scores or review backlog. [Release details](docs/RELEASE_0_12_0.md).


The calendar now follows the complete **14 November learner roadmap**, including ISO odd/even Thursdays, S2 March–June study blocks, both summers, project/support gates and zero independent study during exam peaks. Existing study history is preserved. See [ROADMAP_2026_11_14.md](docs/ROADMAP_2026_11_14.md) for the exact mapping, date assumptions, verification and recovery. Reload online once to apply the planning update.


A quiet, local-first study companion for ENSAM and the 2026–2029 ML systems roadmap. Today remains one precisely titled task, one timer and four explicit outcomes. No hosting, account, API key or runtime dependency installation is required.

## Run the existing app

On Fedora / Linux with Node.js 20+:

```sh
npm start
```

Open **http://127.0.0.1:4173/**. Keep that terminal open. Windows can use **Start Learning OS.cmd** and **Stop Learning OS.cmd**. Keep the same browser profile and origin to keep the same study space. Opening index.html directly is unsupported. After updating, reload online once; the service worker then caches the new modules and catalog for offline use.

## Scheduling, calendar and study history

- **Today** retains the quiet dark interface, timer and four explicit outcomes. Completing a timer never completes a task. A ready same-track continuation is offered only after explicit completion and within remaining capacity.
- **Scheduling Engine v2** distinguishes a confirmed teacher deadline from a soft P0 academic target. Academic and independent work share the same actual discretionary time. Defaults remain Monday 75, Tuesday 75, Thursday 75 and Saturday 150 independent minutes, Wednesday ENSAM-only, Friday ENSAM overflow and Sunday rest. Small partial rescue into unused slack is optional.
- **Effort** keeps the initial estimate, recorded time and revised remaining estimate separate. Editing a title no longer erases remaining effort. Study Log groups task/day attempts while retaining expandable notes and corrections.
- **Calendar** has real Monday-first month grids, Day/Week/Month/Year/3-Year views, previous/next/today, and date input committed with **Go or Enter**. Select a day for details. Past dates show recorded attempts. Days 0–13 are actionable, 14–41 tentative, and later projections through June 2029 provisional. Unknown teacher work is not scheduled as homework.
- **Curriculum** has S1–S6 tabs, collapsed resources, filters, source metadata and editable ordering. All bundled chapters are active automatically. Source overviews remain references; prerequisites and timeboxes select the next learning task. External catalog imports still offer explicit review. Existing completed units retain their IDs.
- **Privacy**: attachments and personal notes remain only in browser state/backups. Public catalog data contains no private archive filenames or document bytes. The app has no cloud sync or AI dependency.

See [the precise implementation and verification report](docs/SCHEDULING_V2_REPORT.md) for changed files, policy details, limitations and recovery instructions. The complete handoff ZIP could not be downloaded in the implementation environment; its ZIP-only specifications and scenario matrix remain an explicit acceptance gate.

## Progress, upgrade and recovery

**The browser’s IndexedDB is the source of truth for learning progress. The repository seed is only for a new browser.** The upgrade never replaces an existing browser plan with the seed.

Logical schema 1 → 2 migration runs in one IndexedDB transaction. Before writing the migrated state, that transaction records the exact old state under `migration-v1`. Any existing `restore-point` remains intact. Events, partial estimates, overrides, checkpoints, legacy task IDs and the in-flight timer survive. Migration is idempotent and handles simultaneous tabs. A failed validation aborts the whole transaction. Settings offers **Recover pre-upgrade plan** separately from normal backup recovery.

Use Settings → **Export backup** before moving devices or clearing browser data. Export pauses an active timer. **Restore backup** previews and replaces the destination plan, saving a recovery copy first; schema-1 backups are upgraded without inferring completion. **Recover previous plan** swaps the two plans safely. **Reconcile attempts** explicitly appends compatible attempts for known task IDs; conflicting immutable IDs and unknown tasks are rejected. This is manual reconciliation, not cloud synchronization or curriculum merging.

Two tabs use revision checks to reject stale writes. User-confirmed completions are derived from retained attempts, never from seed assumptions, allocated minutes or imported notes. ILA `ila-311` remains §3.1.1; the wider catalog §3.1 unit is distinct.

## Sources and private research

The shipped catalog contains **26 resources, 383 public source units and 286 opaque archive references**. The full private input has 321 units; 87 historical archive-file entries, archive filenames/paths and all document bytes are excluded from the public catalog. Old private note-derived drafts have also been removed from the distributed seed. Existing browser drafts remain local and become active in this requested upgrade; recorded progress is preserved.

The sanitized `curriculum/` inputs and `scripts/refine-catalog.mjs` rebuild the catalog with `npm run build:catalog`; no private files are required. Historical PDFs do not establish the current professor’s syllabus or personal exam times. Builder actions are authored milestones. Géron uses the 2025 PyTorch notebook sequence; Huang uses publisher-verified second-edition chapter titles. The learner’s owned PDF edition has not been inspected.

`dist/planning.json` supplies weekly roles and planning assumptions. Actual 2026–27 academic windows are in the browser’s editable Calendar, initially based on the supplied ENSAM calendar. Semester envelopes organize the projection; later-year dates remain provisional until the annual calendar is imported. A semester-wide exam window never specifies your personal exam time. Resits are disabled until needed.

## Verification and current release gate

```sh
npm ci
npm test
npm run validate
```

**Current verification: 237 tests pass**, with no failures or skipped tests. Catalog/privacy/schema/projection/offline validation and JavaScript syntax checks pass. Real-browser checks covered quick search, resource filters, calendar Back, stable settings, task creation, timer return, paused backups, restore/recovery, phone navigation and offline search/history retention. [Observed browser checks and limits](docs/BROWSER_QA.md).

`npm run test:browser` is the optional Playwright acceptance driver used in GitHub Actions. It requires a separately installed test-only browser runner; it is not an app runtime dependency. The local interactive checks used the in-app browser and disposable localhost data. Physical device transfer, Zen-specific behavior and native installation were not exercised.

Use `LEARNINGOS_TEST_BACKUP=/absolute/private/path/backup.json npm run test:browser` for an optional real-backup test in a disposable browser context, never the live profile. Playwright may be supplied through `PLAYWRIGHT_MODULE` and its browser through `PLAYWRIGHT_CHROMIUM`.

Read [the current roadmap report](docs/ROADMAP_2026_11_14.md) for current behavior, tests and remaining checks. The older scheduling reports retain historical evidence. Export a fresh backup before loading the changed build; do not clear site data as an update step.
