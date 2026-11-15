# Browser verification — 0.8.0

Observed with the in-app browser across 14–15 November 2026. All synthetic session, task and settings writes used http://localhost:4173/, separate from the real study origin http://127.0.0.1:4173/. Real-origin study data was not used as disposable data. Test tabs were closed and temporary viewport overrides were reset afterward.

## Observed passes

- Updated through the visible app update control, retaining the disposable origin's prior progress.
- Desktop 1280px layout and phone 390×844 layout visually inspected. Phone navigation stayed at the bottom, all five labels remained visible, and document width did not exceed the viewport.
- Curriculum promotes active resources and shows one primary action per resource. Searching for linear, opening ILA, filtering to Completed (one row), and returning restored the original collection search.
- Ctrl+K opened Search; entering 2.7 basis found the exact §2.7 Basis and Dimension task. Arrow Down focused the result and Enter opened its chapter destination. Available source-unit search and corrected completion semantics also have automated checks.
- More calendar views opened a 12-month Year view. Switching to Curriculum and browser Back restored that calendar route and view.
- Saving preferences kept all 26 rendered preference fields, including collapsed fields. After the page-wide click bug was fixed, a clicked focus input retained focus, and a clicked recovery disclosure stayed open.
- Added a synthetic academic task using the shortened form and a second one with an explicitly confirmed synthetic deadline. The latter used a 10-minute estimate; its focus session started at 10:00, with a visible return shortcut on Settings.
- Export downloaded a JSON backup and changed the shortcut to a paused countdown. Partial saved the QA note. File-picker restore preview showed 310 tasks, four sessions and a paused focus. Restoring retained the pause; resuming the timer worked.
- Recover previous plan showed the pre-restore five-session state. Recovery retained all five attempts and the QA partial note. The two added test tasks were then archived, preserving history.
- Stopped the actual local server, reloaded the final cached app, and used the new Search offline to find §2.7. The same five attempt rows remained in Study Log. The server was restarted afterward.
- No captured browser console errors were present on the final online check before the deliberate offline stop. Final desktop and phone screenshots were saved to the chat outputs folder.

## Limits

These are observed checks of the listed flows, not an exhaustive accessibility audit or a claim that every future-semester workflow was manually exercised. Physical device transfer, Zen-specific behavior and native installation remain unverified. Git source does not contain or synchronize browser IndexedDB history.

Earlier browser reports in this repository are historical evidence. The schema, roadmap policy and academic source assumptions were not changed by this release.
