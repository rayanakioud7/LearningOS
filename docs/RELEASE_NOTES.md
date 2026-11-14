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
