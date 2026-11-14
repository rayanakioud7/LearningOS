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
