# Local MVP release — 0.3.1

## Automated checks

- [x] Minimal monochrome Today, explicit task outcomes and versioned curriculum edits.
- [x] Focus refresh/resume data, capped elapsed time and paused cross-device transfer payloads.
- [x] Exam/rest overrides, prerequisites, independent capacity and deadline risks.
- [x] Transactional saves, stale-tab conflict rejection and validated imports.
- [x] Atomic restore-point creation and recovery without deleting the replaced plan.
- [x] Local server version health check and repeatable background launch.
- [x] Source-safe rendering and offline module manifest.
- [x] Windows/Linux CI on Node 22/24 for the previous release; the current commit is checked by the same workflow.

## Observed real-browser pass

- [x] Separate disposable origin; real study history was not used for test writes.
- [x] Start/pause, refresh and timer persistence.
- [x] Record all four outcomes and inspect the recommendation and study log.
- [x] Export a running focus session, restore via file picker and resume paused focus.
- [x] Recover the previous plan and verify its history.
- [x] Add/edit an active academic task, archive it, and retain its history.
- [x] Correct an outcome without erasing the original.
- [x] Two tabs: shared updates and stale-editor rejection.
- [x] Reopen cached app with server stopped, inspect persisted history, then restart current server.
- [x] Desktop / narrow layouts and visible keyboard focus.

See BROWSER_QA.md for the exact observations and limits. Browser access is working; the former saved-origin block is resolved.

## Intentional local-MVP boundaries

- Manual export/restore rather than cloud sync or automatic history merging. Physical two-device transfer remains a user acceptance check.
- Native PWA installation and Zen-specific testing were not performed. Regular browser use is supported.
- Teacher-restricted documents remain local; source links can be added manually.
- Future academic years and unconfirmed coursework stay tentative.
- Detailed self-study dates are adaptive; calendar blocks are forecasts rather than Google Calendar appointments.
