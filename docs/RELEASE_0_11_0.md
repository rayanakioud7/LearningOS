# LearningOS 0.11.0 — reliable saved plans and chapter search

15 November 2026. Repairs the learner’s reported Prince Chapter 13 ordering on existing saved plans. The visual design, workload ceilings, exam protection and v4 phase dates remain unchanged.

## Correct chapter order after earlier imports

The former updater refreshed prerequisite links only on automatically created tasks. Previously imported catalog tasks retained older links, so an out-of-order insertion could place Chapter 13 after Chapter 21. The new upgrade repairs bundled prerequisite links for both import paths. Prince now forecasts Chapters 1–21 in sequence, including 12 Transformers → 13 Graph neural networks → 14 Unsupervised learning, regardless of Chapter 13’s old insertion position.

Title/status changes no longer freeze unrelated source fields. Deliberately edited prerequisite links remain intact, and a source correction is skipped if it would create a cycle around an explicit override. Timers, immutable attempts, remaining effort, task IDs and source snapshots stay intact. The repair runs automatically on boot or backup restore and uses the existing atomic curriculum snapshot mechanism.

## Practical improvements

- Quick search and curriculum filters understand Ch / chapter, leading zeros, accents, source abbreviations and words in different orders. Examples: Prince chapter 13, UDL ch. 013, Geron chapter 4 and ILA §3.1.1. Chapter 13 does not match Chapter 113. Search stays read-only.
- Saved legacy sections no longer appear a second time as available catalog chapters in search.
- Recover previous plan detects changes made from another tab while its dialog is open. The first recovery click refreshes the preview instead of replacing newer work; a second deliberate click is required to recover the shown copy.
- Later catalog repairs respect deliberately drafted tasks and suspended resources. Initial activation and newly bundled tasks still default to Active.
- Numeric release comparison protects a newer saved release such as .10 from an older .3 client.

## Verification

All 223 local tests passed with zero failures/skips. Nine new regressions cover the previously imported chapter graph, title/status edits, prerequisite overrides/cycle prevention, live timer and partial-effort preservation, intentional drafts, numeric versions, chapter-aware search, curriculum filtering and duplicate legacy sections. The existing 214 checks are retained.

Release validation checks 383 public units, 26 resources, 286 opaque archive references, six semesters, 960 nonmutating forecast dates and complete offline assets. The sandboxed Chromium acceptance driver additionally recreates the old imported book in native IndexedDB, checks calendar dates for Chapters 12, 13 and 14, exercises the new search, and tests a second tab changing the plan during backup recovery. Refer to this release commit’s GitHub Actions run for final automated browser results.

Interactive checks use disposable localhost data. The real 127.0.0.1 study profile receives no synthetic test writes. Physical two-device transfer, Zen-specific rendering and native PWA installation are not claimed as tested.
