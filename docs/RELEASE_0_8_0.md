# LearningOS 0.8.0 — quieter navigation

Built on desktop main commit 19cf8b9, fetched into C:\Projects\LearningOS. Verified on 15 November 2026.

## Changes that matter day to day

- Fixed the navigation click binding matching the body itself. Ordinary clicks could redraw the page, close a disclosure, and lose input focus. Navigation now binds only to actual buttons and links.
- Added Search in the header and Ctrl/Cmd+K. Find a saved task, chapter, resource or page, move with arrow keys and open with Enter. Searching never activates material or changes completion.
- Replaced resource management cards with a compact resource list, active resources first, and one primary contents action. Removed duplicate semester/resource filters and moved source metadata, bulk import and resource management behind details.
- Applied status filters inside a resource and made saved edited headings searchable. Opening contents clears the collection search; returning restores the previous collection filters. URL deep links and browser Back remain supported.
- Kept Today as one task and a timer. Added a return-to-focus shortcut on other pages. The timer preview now agrees with a short task allocation before starting, including fractional allocations.
- Simplified task creation to the objective, evidence, estimate and track; optional scheduling/source fields remain under details. New remaining effort follows the entered estimate unless explicitly revised. Existing partial estimates remain intact.
- Put backup transfer first in Settings. Focus settings stay visible; exams, availability, recovery and notes expand when needed. Closed fields still participate in saves, and invalid fields reveal their containing section.
- Calendar puts Day/Week/Month first and keeps longer views in More views. Study Log uses a direct heading with the original checkpoint under a disclosure.
- Added larger control text, a consistent neutral palette, visible focus and persistent labeled phone navigation. No runtime framework, account, hosting or paid service was added.

## Verification

- 196 / 196 automated tests passed locally, including the existing roadmap, migration, reconciliation, recovery, storage, scheduling and calendar scenarios. Six new model/view tests cover search, resource filtering, edited headings and focus-duration consistency.
- All dist JavaScript and the optional browser acceptance driver passed syntax checks. git diff --check passed.
- npm run validate passed: 359 public units, 26 bundled resources, 286 opaque archive references, six semesters and 960 nonmutating civil-date forecasts; offline assets and privacy checks passed.
- Real browser checks passed on a disposable localhost origin. See BROWSER_QA.md for the observed flows and limits. The optional CI browser driver now also checks that input focus and settings disclosures survive ordinary clicks.
- The server was restarted and its health endpoint reported version 0.8.0 from the requested project directory.

The scheduling policy, curriculum catalog and academic assumptions were retained. No completion or activation is inferred by the UX update. Future semesters stay provisional. Browser data remains separate from Git source; use backup export/restore to move study progress between computers.

Physical laptop-to-desktop transfer, Zen-specific rendering and native PWA installation were not performed. The app uses the existing explicit service-worker update control; it does not require clearing site data.
