# LearningOS · 0.4.0

A quiet, local-first study companion for ENSAM and the 2026–2029 ML systems roadmap. Today remains one precisely titled task, one timer and four explicit outcomes. No hosting, account, API key or runtime dependency installation is required.

## Run the existing app

On Fedora / Linux with Node.js 20+:

```sh
npm start
```

Open **http://127.0.0.1:4173/**. Keep that terminal open. Windows can use **Start Learning OS.cmd** and **Stop Learning OS.cmd**. Keep the same browser profile and origin to keep the same study space. Opening index.html directly is unsupported. After updating, reload online once; the service worker then caches the new modules and catalog for offline use.

## Curriculum and forecasts

- **Today:** explicit Completed / Partial / ENSAM priority / Skipped. Timer expiry never completes a task. Partial without a new estimate subtracts recorded focused minutes. Fast completion offers a prerequisite-ready task on the same primary track, or rest.
- **Calendar:** Day, Week, Month, 42 days, Semester and 3-Year. The next 14 civil dates contain only reviewed, activated tasks. Days 15–42 are tentative and may preview reviewed drafts. Later dates through 30 June 2029 are hypothetical scenarios, including unactivated source headings, with no invented completion events or confirmed future exams.
- **Curriculum:** data-driven semesters; Active / Research / Completed / Suspended filters; resource and semester search; editable actions, evidence, estimates, dates, priorities, order and dependencies. Completed-task edits create a follow-up. Source provenance and confidence remain separate from authored actions and estimated effort.
- **Review catalog import:** automatically loads a sanitized catalog, previews additions, duplicates, renames and conflicts, then imports only checked units. Reviewing and activating are separate decisions. Optional branches and academic placeholders require individual review. A placeholder needs current teacher material and a specific assignment confirmed before activation.
- **Private documents:** attach selected documents from a task editor. They stay in IndexedDB and personal backups; the app makes no upload. Local-file locators are displayed as text. Downloaded attachments use an inert download type.
- **Study log:** immutable attempts, append-only corrections, user checkpoints and estimated-versus-recorded duration. No streaks or inferred mastery.

Default independent slots are Monday 75, Tuesday 75, Thursday 75 and Saturday 150 minutes: **375 of the 480-minute hard weekly maximum**, leaving 105 minutes free. Weekday/session ceilings remain 90 minutes; Saturday 180. Wednesday is ENSAM-only, Friday ENSAM overflow or rest, Sunday rest. Academic work uses a separate budget. Settings include per-day slots, fixed/flexible roles, preferred subjects, campus reservations, recovery dates, timezone, exam-prep lead time and PFE mode. Academic deadlines and protection beat independent study; missed days never create extra hours.

## Progress, upgrade and recovery

**The browser’s IndexedDB is the source of truth for learning progress. The repository seed is only for a new browser.** The upgrade never replaces an existing browser plan with the seed.

Logical schema 1 → 2 migration runs in one IndexedDB transaction. Before writing the migrated state, that transaction records the exact old state under `migration-v1`. Any existing `restore-point` remains intact. Events, partial estimates, overrides, checkpoints, legacy task IDs and the in-flight timer survive. Migration is idempotent and handles simultaneous tabs. A failed validation aborts the whole transaction. Settings offers **Recover pre-upgrade plan** separately from normal backup recovery.

Use Settings → **Export backup** before moving devices or clearing browser data. Export pauses an active timer. **Restore backup** previews and replaces the destination plan, saving a recovery copy first; schema-1 backups are upgraded without inferring completion. **Recover previous plan** swaps the two plans safely. **Reconcile attempts** explicitly appends compatible attempts for known task IDs; conflicting immutable IDs and unknown tasks are rejected. This is manual reconciliation, not cloud synchronization or curriculum merging.

Two tabs use revision checks to reject stale writes. User-confirmed completions are derived from retained attempts, never from seed assumptions, allocated minutes or imported notes. ILA `ila-311` remains §3.1.1; the wider catalog §3.1 unit is distinct.

## Sources and private research

The shipped catalog contains **17 resources, 234 public source units and 286 opaque archive references**. The full private input has 321 units; 87 historical archive-file entries, archive filenames/paths and all document bytes are excluded from the public catalog. Old private note-derived drafts have also been removed from the distributed seed. Existing browser drafts remain local and are preserved by migration.

The Git-ignored `private/research/` folder contains the original research pack. `npm run build:catalog` rebuilds only allowlisted runtime metadata from it. A normal checkout already contains the sanitized outputs and does not need the private files to run. Historical PDFs never establish the current professor’s syllabus or exam dates. The builder actions are authored milestones, not official source headings. Géron uses the 2025 PyTorch notebook sequence; Huang keeps verified code-directory references while the owned edition remains unconfirmed.

`dist/planning.json` supplies weekly roles and planning assumptions. Actual 2026–27 academic windows are in the browser’s editable Calendar, initially based on the supplied ENSAM calendar. Semester envelopes organize the projection; later-year dates remain provisional until the annual calendar is imported. A semester-wide exam window never specifies your personal exam time. Resits are disabled until needed.

## Verification and current release gate

```sh
npm ci
npm test
npm run validate
```

The sole required development dependency is `fake-indexeddb`; it is never shipped to the browser. The existing tests are retained, with all 25 research QA scenarios and additional import, migration, dependency, DST, protection, reconciliation, privacy and property checks added.

**Current environment evidence:** 88 core tests pass and seed/catalog/offline-manifest validation passes. The full suite is **not yet green here**: npm downloads fail with `EAI_AGAIN`, leaving fake-indexeddb unavailable; socket tests fail with `listen EPERM`. A Chromium launch also failed at sandbox initialization. New transactional storage tests are present but could not execute here. Earlier 0.3.1 browser observations do not verify this version.

`npm run test:browser` runs an optional Playwright integration driver in a fresh context and ephemeral origin. Install Playwright separately or set `PLAYWRIGHT_MODULE`; an existing browser executable can be supplied through `PLAYWRIGHT_CHROMIUM`. It checks native IndexedDB migration, recovery copies, timer reload, actual backup download/restore, staged import, all-year projection, phone overflow, keyboard focus and offline reload. It intentionally requires a working browser sandbox.

See `docs/IMPLEMENTATION_V2.md`, `docs/RELEASE_CHECKLIST.md` and `TEST_REPORT.json` for the exact model, evidence and remaining gates. This implementation is ready for local review; a full browser/storage release pass is still required.
