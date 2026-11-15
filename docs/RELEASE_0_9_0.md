# LearningOS 0.9.0 — clearer daily decisions

15 November 2026. Builds on the minimal navigation, chapter search and source-preserving curriculum work in 0.8.0.

- **Rest is a proper screen.** Protected recovery days show a calm message and an optional next-session disclosure. They no longer display a disabled timer and outcome controls. Exam/ENSAM days without confirmed coursework explain the priority and offer task entry. A previously paused session remains resumable on protected days.
- **Today’s plan means today.** Contextual plan links open the relevant civil date, including the next planned session, regardless of a previously browsed future semester.
- **A shorter session review.** Completed shows the exact milestone being confirmed. Only Partial shows and enables the remaining-effort field. An irrelevant invalid estimate cannot block another outcome. Cancelling creates no attempt or completion; sub-minute focus is described honestly.
- **A meaningful restore comparison.** Incoming and current plans show saved-attempt counts, the latest saved task and its outcome, timestamps in one timezone, and whether paused focus is included. A factual notice identifies an export older than the last local save. Private attempt notes are not copied into the preview.
- **A comparison that stays current.** If another tab changes the plan while the preview is open, the first Restore click refreshes the comparison for review. It does not replace newly changed work without showing that new state.

The black/gray palette, one-task focus layout, manual transfer workflow, curriculum dataset and scheduling policy remain in place. No new account, backend or runtime package was introduced. No completion is inferred from a forecast, checkpoint, search or import.

## Validation

204 / 204 local tests passed, with no failures or skipped tests. The existing catalog/privacy/schema/offline checks also passed: 359 public units, 286 opaque archive references, six semesters and 960 nonmutating forecast dates. All changed JavaScript passes syntax checks.

The prior 0.8 release completed all four Windows/Linux Node jobs and sandboxed Chromium acceptance: https://github.com/rayanakioud7/LearningOS/actions/runs/43706975054 . The 0.9 acceptance driver additionally checks conditional outcome fields, the two-sided restore preview, refreshed comparison after a second-tab change, and Sunday’s contextual plan link. Commit-specific 0.9 results are in GitHub Actions.

Interactive browser checks used a disposable localhost origin, including actual rest-day rendering, current-date navigation, four-versus-five-attempt backup comparison, milestone/estimate visibility, cancellation without completion and history recovery. Test writes were not made to the real 127.0.0.1 study origin. See BROWSER_QA.md for exact scope and limits.

Physical device transfer, Zen-specific rendering and native installation remain unverified. Keep using exported JSON to move progress: Git updates code rather than the browser’s study database. Never clear browser storage to update the app.
