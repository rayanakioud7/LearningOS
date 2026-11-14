# LearningOS · 0.7.0

**0.7.0:** safer task timers and offline updates, bookmarkable Calendar/Curriculum views, calendar keyboard navigation, searchable paginated Study Log, and faster cached calendar browsing. [Release details and verification](docs/RELEASE_0_7_0.md).


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
- **Curriculum** has S1–S6 tabs, collapsed resources, filters, source metadata and editable ordering. Import/review and activation remain separate. Second-edition pandas chapters and a selective Wasserman reference are staged with distinct source IDs; existing completed units are not remapped.
- **Privacy**: attachments and personal notes remain only in browser state/backups. Public catalog data contains no private archive filenames or document bytes. The app has no cloud sync or AI dependency.

See [the precise implementation and verification report](docs/SCHEDULING_V2_REPORT.md) for changed files, policy details, limitations and recovery instructions. The complete handoff ZIP could not be downloaded in the implementation environment; its ZIP-only specifications and scenario matrix remain an explicit acceptance gate.

## Progress, upgrade and recovery

**The browser’s IndexedDB is the source of truth for learning progress. The repository seed is only for a new browser.** The upgrade never replaces an existing browser plan with the seed.

Logical schema 1 → 2 migration runs in one IndexedDB transaction. Before writing the migrated state, that transaction records the exact old state under `migration-v1`. Any existing `restore-point` remains intact. Events, partial estimates, overrides, checkpoints, legacy task IDs and the in-flight timer survive. Migration is idempotent and handles simultaneous tabs. A failed validation aborts the whole transaction. Settings offers **Recover pre-upgrade plan** separately from normal backup recovery.

Use Settings → **Export backup** before moving devices or clearing browser data. Export pauses an active timer. **Restore backup** previews and replaces the destination plan, saving a recovery copy first; schema-1 backups are upgraded without inferring completion. **Recover previous plan** swaps the two plans safely. **Reconcile attempts** explicitly appends compatible attempts for known task IDs; conflicting immutable IDs and unknown tasks are rejected. This is manual reconciliation, not cloud synchronization or curriculum merging.

Two tabs use revision checks to reject stale writes. User-confirmed completions are derived from retained attempts, never from seed assumptions, allocated minutes or imported notes. ILA `ila-311` remains §3.1.1; the wider catalog §3.1 unit is distinct.

## Sources and private research

The shipped catalog contains **26 resources, 359 public source units and 286 opaque archive references**. The full private input has 321 units; 87 historical archive-file entries, archive filenames/paths and all document bytes are excluded from the public catalog. Old private note-derived drafts have also been removed from the distributed seed. Existing browser drafts remain local and are preserved by migration.

The Git-ignored `private/research/` folder contains the original research pack. `npm run build:catalog` rebuilds only allowlisted runtime metadata from it. A normal checkout already contains the sanitized outputs and does not need the private files to run. Historical PDFs never establish the current professor’s syllabus or exam dates. The builder actions are authored milestones, not official source headings. Géron uses the 2025 PyTorch notebook sequence; Huang keeps verified code-directory references while the owned edition remains unconfirmed.

`dist/planning.json` supplies weekly roles and planning assumptions. Actual 2026–27 academic windows are in the browser’s editable Calendar, initially based on the supplied ENSAM calendar. Semester envelopes organize the projection; later-year dates remain provisional until the annual calendar is imported. A semester-wide exam window never specifies your personal exam time. Resits are disabled until needed.

## Verification and current release gate

```sh
npm ci
npm test
npm run validate
```

**Current verification: 187 tests pass**, including IndexedDB reliability/migration, roadmap, usability and offline-cache checks. Three localhost server tests are blocked by `listen EPERM`. Catalog/privacy/projection/offline validation also passes. No live browser database was modified.

`npm run test:browser` was attempted but Playwright is unavailable; localhost binding is independently denied. The driver includes calendar navigation, roadmap choices, shared time, optional summer, monthly GPU support and the existing timer/restore/mobile/offline checks. These browser checks still need to execute on a host that supports them. Prior-release browser reports do not verify this update.

Use `LEARNINGOS_TEST_BACKUP=/absolute/private/path/backup.json npm run test:browser` for an optional real-backup test in a disposable browser context, never the live profile. Playwright may be supplied through `PLAYWRIGHT_MODULE` and its browser through `PLAYWRIGHT_CHROMIUM`.

Read [the current roadmap report](docs/ROADMAP_2026_11_14.md) for current behavior, tests and remaining checks. The older scheduling reports retain historical evidence. Export a fresh backup before loading the changed build; do not clear site data as an update step.
