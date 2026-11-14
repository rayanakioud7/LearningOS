# Browser verification — 0.4.0 pending

This version has **not passed real-browser verification in the implementation environment**. Chromium was present but could not initialize its sandbox. Local socket binding was also denied. No user study origin was opened or changed.

The 0.3.1 observations are retained separately in `BROWSER_QA_0_3_1.md`; they are historical evidence, not a pass for this release.

## Automated integration driver

Run `npm run test:browser` on a host with Playwright installed separately, a browser sandbox and permission to bind localhost. `PLAYWRIGHT_MODULE` may point to an existing Playwright index.mjs; `PLAYWRIGHT_CHROMIUM` may select an installed compatible Chromium executable.

The driver creates a fresh browser context and ephemeral origin, seeds a synthetic schema-1 plan with a completion, timer and older recovery point, then uses the actual app. It asserts:

- Native IndexedDB migration preserves events, timer and the older recovery point; `migration-v1` contains the exact original state.
- Running focus survives reload.
- Real export downloads a JSON backup with the timer paused.
- Partial, restore preview, file-picker restore and recovery retain the expected original events and recovery copies.
- A checked catalog unit imports as a reviewed draft, without activation.
- The 3-Year view includes unactivated scenarios without creating events.
- A 390px viewport has no horizontal overflow and keyboard focus is visible.
- Offline reload opens cached modules and retains saved history.

It is checked for syntax, but could not execute here. It must not be counted as passed until actually run.

## Remaining manual acceptance

Use a disposable browser profile/origin or the automated driver's context for synthetic writes. Retain a personal exported backup before any real upgrade.

1. Open the existing app; check the dark Today layout, source details and four outcomes at desktop and phone widths.
2. In Curriculum, preview the bundled catalog. Check duplicate counts, §3.1 versus §3.1.1 separation, checkbox selection, draft import, review/activation, prerequisite edits, suspension and resumption.
3. Add a real-shaped ENSAM task and change its dates. Try an academic module placeholder: it must require teacher and specific-assignment confirmation before activation. Attach a small local document, export/restore and download it again.
4. Check Wednesday without an activated academic assignment, Friday without backlog and Sunday. Independent tasks must not fill those slots. Enable a conditional resit and inspect the protected week.
5. Inspect all calendar modes, including late 2028 and S6 in 2029. Confirm future dates are visibly provisional and no personal exam times appear.
6. Open a task editor in one tab; change the same plan in another. The first tab's stale save must be rejected. Repeat with resource, semester and calendar editors.
7. Save Partial, Completed, ENSAM priority and Skipped through the real form. Let a timer expire without choosing an outcome: no completion should be created.
8. Verify source snapshots and original completed evidence after curriculum edits. Check duration calibration includes partial attempts and excludes corrected attempts.
9. Export with a running timer, restore through its preview, recover the prior plan, and exercise the separate pre-upgrade recovery control.
10. Reload offline after the new service worker is ready. Reopen Today, Calendar, Curriculum and Study log; check timer/session retention.

Physical laptop/desktop transfer, native PWA installation and Zen-specific rendering remain separate user acceptance checks. There is no cloud sync.
