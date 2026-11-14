# Browser verification — 0.3.1

Observed on 14 November 2026 in the ChatGPT in-app browser after the exact local-origin permission was enabled.

## Isolation

The real app at http://127.0.0.1:4173/ was inspected without creating sessions or editing its plan. Disposable test sessions and curriculum edits used http://localhost:4173/, which has separate browser storage. The initial disposable study log was empty. Test tabs were closed after verification.

## Observed passes

- Black, minimal Today view with the user's first ILA §3.1.1 task planned for Monday 16 November. The prior §2.9 checkpoint remains examples completed, not all exercises.
- Start focus, refresh while running, pause, and record Partial. The timer persisted across refresh and the note appeared in Study log.
- Explicit Completed advanced to the reflection/rotation task. Skipped kept it pending. ENSAM priority recorded an attempt without completing the task.
- Add an active academic task, edit its effort estimate, and see it recommended during an ENSAM override. Archive removed it from the active list while retaining its historical snapshot.
- Correct an outcome: the original remained visible as “Corrected · retained”.
- Export with a running timer: export paused it and downloaded a JSON backup through the real browser download flow.
- Restore that JSON through the file picker and preview: the task count, session count and paused focus were displayed. Restored focus could be resumed and recorded.
- Recover previous plan: confirmation displayed 308 tasks / 4 sessions; recovery restored the pre-restore ENSAM event and all four prior sessions.
- Two same-origin tabs: changing availability updated the other tab. Submitting its already-open editor was rejected with “Your plan changed while this editor was open.”
- Stop the local server, reload the previously loaded test origin, and navigate to Study log. All four events and the correction remained available offline. Restart returned health version 0.3.1 from the configured project folder.
- Visual inspection at 1280 px, the normal 714 px app pane, and 390 px phone width. At 390 px the document width was 390 px, with no horizontal overflow. Temporary viewport overrides were reset.
- Keyboard Tab showed a visible solid focus outline. The real-origin page had no captured warning/error logs on the final online check.

## Bug found and fixed

Add task was blocked because an absent task ID compared equal to an absent focus timer's task ID. A guard now requires a real task ID before treating an editor as the focused task. The browser form succeeded after the fix; a regression test covers absent IDs and an actual focused task.

## Limits

Backup export/restore was verified in one disposable browser origin. A physical laptop-to-desktop transfer, separate browser profiles, native PWA installation and Zen-specific behavior were not exercised. No automatic merge or cloud sync is provided. Offline reopening requires the app to have loaded online previously.

Teacher-restricted material, future semester details and draft task activations remain subject to user review; browser verification does not validate those academic assumptions.
