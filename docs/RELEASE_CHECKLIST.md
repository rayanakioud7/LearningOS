# Local v1 release gate

## Implemented and covered by automated checks

- [x] Minimal monochrome Today, explicit task outcomes and versioned curriculum edits.
- [x] Focus refresh/resume data, capped elapsed time and paused cross-device transfer.
- [x] Exam/rest overrides, prerequisites, independent capacity and deadline risks.
- [x] Transactional saves, stale-tab conflict rejection and validated imports.
- [x] Atomic restore-point creation and recovery without deleting the replaced plan.
- [x] Local server version health check and repeatable background launch.
- [x] Source-safe rendering and offline module manifest.
- [x] Windows/Linux CI on Node 22/24.

## Required real-browser pass — currently blocked by the local-origin permission

- [ ] On a separate disposable test profile, start/pause/resume, refresh and verify elapsed time.
- [ ] Record each outcome and inspect the next recommendation and study log.
- [ ] Export a partial focus session, restore in a second profile and resume it.
- [ ] Restore another backup, recover the previous plan and verify both histories.
- [ ] Edit/activate/archive a task; confirm history and prerequisite behavior.
- [ ] Open two tabs and confirm concurrent edits produce no silent overwrite.
- [ ] Load once, stop the server, reopen offline, then restart and load the current version.
- [ ] Inspect desktop and narrow layouts and keyboard focus.

Do not use the user's real study history as disposable test data. No claim of complete browser verification or final production release is made until these checks are observed.

## Intentional local-v1 boundaries

- Manual export/restore rather than cloud sync or automatic history merging.
- Teacher-restricted documents remain local; source links can be added manually.
- Future academic years and unconfirmed coursework stay tentative.
- Detailed self-study dates are adaptive; calendar blocks are forecasts rather than Google Calendar appointments.
