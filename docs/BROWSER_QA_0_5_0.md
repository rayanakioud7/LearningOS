# Browser acceptance — 0.5.0 (NOT EXECUTED HERE)

Run `npm run test:browser` with Playwright and a browser sandbox on a host that permits localhost sockets. The driver uses a fresh browser context and ephemeral origin. It includes real IndexedDB migration/recovery, timer reload, export/restore, catalog staging, date navigation, semester keyboard selection, a synthetic 120/75/200 edit, grouped attempts, mobile overflow, keyboard focus and offline reload.

Supply `LEARNINGOS_TEST_BACKUP` only for a private isolated roundtrip. Do not put the backup in the repository or serve it through `dist`. That extra context is closed at the end of the test.

## Remaining hands-on browser checks

1. Export the live browser backup first, then perform all destructive/restore checks in a disposable profile.
2. Compare Today at desktop and 390px widths. Its dark focus screen, timer and four outcomes should retain their layout. Let the timer expire without saving: no completion or prerequisite unlock.
3. Calendar → Month: November 2026 starts on Sunday with October 26–31 leading cells. February 2028 includes February 29. Inspect selected dates in October 2028 and June 2029.
4. Type dates using keyboard components and the native picker; use Go or Enter to commit. The input must not rerender while typing. Invalid/out-of-range input must not change the selected date. Change views after committing and verify selection persists.
5. Use previous/next/today, all modes, and Year/3-Year month/day drilldown. Verify readable week agenda, compact matrices and no full 960-row list. Future details must say tentative/provisional; past details must show actual attempts.
6. Add a synthetic academic P0 personal target with a past date. Monday/Tuesday must keep their home subjects. Confirm its teacher deadline and assignment explicitly: urgent work or its prerequisite may preempt the pin, with an explanation and feasibility warning when needed.
7. Record academic work on an independent day and verify remaining time is shared. Check Sunday rest, explicit ENSAM override, exact no-work dates, recovery, enabled/disabled resits, exams, PFE, skipped work and small-residual rescue.
8. Curriculum: use S1–S6 with mouse, Tab, arrows, Home and End. Confirm filtering, collapsed resources, search, ordering, suspend/enable, add/edit, and staged source imports. Legacy completed source units must remain unchanged.
9. Make three 25-minute partial attempts on a 120-minute task; enter 200 minutes remaining. Edit its heading. Confirm 75 spent and 200 remaining. Study Log must show one group with three expandable attempts. Correct one attempt and verify the original remains visible, active time drops, and no completion is inferred.
10. Verify stale edits in a second tab are rejected, restoring saves a recovery copy, and pre-upgrade recovery is separate. Reload offline after the service worker is ready and inspect Today, Calendar, Curriculum and Log.
11. Capture screenshots of Calendar/Curriculum at desktop/mobile only in the disposable synthetic profile. Do not publish real-backup screenshots or personal notes.

No browser screenshots or observed pass claims are available for this build from the restricted implementation environment. Native picker/platform behavior, visual layout, multi-device transfer and Zen-specific rendering still require verification.
