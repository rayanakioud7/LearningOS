# LearningOS 0.7.0 — reliability and browsing improvements

Prepared for `main` on 14 November 2026. The existing dark Today interface and the learner's complete semester roadmap are retained. There is no new runtime framework, backend, account, AI service or mandatory browser dependency.

## Fixed behavior

- Focus sessions use the selected task's available allocation. For example, five minutes left in Wasserman no longer becomes a 25-minute timer because the calendar also contains an ENSAM block later that day.
- Editing fallback estimates preserves their fallback label. Fractional remaining estimates from partial sessions remain editable in native browser number inputs.
- Optional Summer 1 independent study can be off while a genuine university deadline still receives academic time.
- Catalog-only resources can be edited/suspended safely without staging tasks or activating the book. Resource renaming updates unfinished labels while completed snapshots remain frozen.
- Semester/status filtering uses the selected semester, rather than reporting an S1-active resource as S2-active. Saved task headings/actions and natural numeric chapter ordering are displayed correctly.
- Scenario allocations offer staging when no saved task exists. Task editors preserve suspended prerequisite selections and handle removed/missing tasks safely.
- Normal app saves check immutable attempts with an ID map instead of a quadratic nested search. Roadmap refreshes do not downgrade newer saved policies, and an existing pre-update recovery snapshot is not overwritten by a later restore/refresh.

## Easier browsing

- Calendar, Curriculum resource/filter and Study Log routes live in the URL fragment. Reload and browser Back/Forward restore the selected view/date/filter. Search updates replace their history entry instead of adding one entry per keystroke.
- Calendar cells use roving keyboard focus. Arrow keys move by day/week, Home/End by week boundary, and Page Up/Down by month, including leap-day transitions.
- Study Log has resource/task/note search, month filtering and 20 task/day groups per page. Original attempts, expanded notes and corrections remain available.
- Calendar projections cache three months ahead and reuse their date index; past attempts are indexed once per state. Measured Node HTML-generation timings: initial month ~36 ms, first year ~157 ms, cached day ~0.3 ms, cached month ~0.4 ms. These are model/render benchmarks, not observed browser performance.
- Repeated academic-window cards are under a disclosure. Settings hide legacy controls that do not affect the strict roadmap, while retaining their saved values for older plans. Connectivity changes update status text without rebuilding forms and losing in-progress typing.

## Offline updates

Each service worker serves one installed cached app shell, including its ES modules and catalog. A newer worker waits for the explicit update control. Selecting the update pauses and saves a running timer before reloading; it never confirms academic completion. Arbitrary files, personal backups, attachments, health endpoints and external URLs are not added to the app cache.

## Verification and limits

- Full run: `node --test --test-isolation=none --test-reporter=spec` — **190 tests: 187 pass, 3 socket tests blocked by `listen EPERM`**. All IndexedDB migration/recovery/concurrency tests execute and pass. Eighteen new usability/offline tests extend the previous roadmap checks.
- `npm run validate` — PASS: 359 sanitized public units, 26 resources, 286 opaque private references, six semesters, 960 pure civil-date forecasts, graph/schema/privacy checks and offline assets.
- JavaScript syntax checks and `git diff --check` — PASS.
- `npm run test:browser` — attempted, blocked by missing Playwright. An isolated in-app-browser origin also could not connect to localhost. Native browser rendering, accessibility/viewport behavior and the full browser update lifecycle are therefore **not claimed verified** here.
- GitHub Actions now has a separate optional Chromium acceptance job with a pinned test-only Playwright package. The browser driver covers deep links, Back/refresh, calendar keys, history search, roadmap forms, timers, restore/recovery, mobile layout and offline reload. This CI job has not run remotely until the commit is pushed successfully.
- No live browser study data was changed. Synthetic regression fixtures and temporary origins were used. No personal notes, teaching documents, private backup bytes, bundle files or credentials are committed.

Reference for the CI installation pattern: https://playwright.dev/docs/ci . The optional runner is installed only in CI (or explicitly by a developer); it is not part of the browser app.

## Update and recovery

Export a fresh backup, then reload online. If an installed app shows “An app update is ready”, use its update button; it pauses any running focus session first. Keep the same browser profile and origin. Do not clear site data or replace the seed with a personal backup.

Normal Restore/Recover previous plan controls remain. Schema-1 migration snapshots, the original pre-roadmap snapshot and immutable events are preserved. A code rollback does not require clearing IndexedDB; newer saved planning policies are protected from automatic downgrade.

## Publishing status

This release is prepared as a commit on `main` in a temporary writable Git checkout because the workspace Git metadata is read-only. Shell access cannot resolve `github.com`; the connected GitHub account cannot access the repository; the browser shows a logged-out 404. A successful remote push is not claimed. The final response identifies the prepared commit and remaining authentication/network step.
