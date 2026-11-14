# Curriculum + Forecast v2 — 0.4.0 release gate

## Completed implementation and executed checks

- [x] Existing Today design, timer and explicit four outcomes preserved.
- [x] Full private research pack read before code edits; actual JSON counts reconciled.
- [x] 234-unit sanitized public catalog; 286 opaque archive references; private research ignored by Git.
- [x] Reviewable import, duplicate/rename/conflict diagnostics and explicit activation.
- [x] Logical normalized schema, immutable attempts, source snapshots and completed-task followups.
- [x] Atomic migration implementation with a separate pre-upgrade snapshot; older recovery copy retained.
- [x] 14-day activated, 42-day tentative and through-June-2029 scenario projection implemented.
- [x] Semester-specific slots, Wednesday academic protection, Sunday rest, independent ceilings and slack.
- [x] Source/estimate/academic uncertainty separated; Géron sequence checked; Huang edition not inferred.
- [x] All 25 research QA scenarios have deterministic executable assertions.
- [x] 88 core assertions/tests pass, including the 25 scenarios, 100 randomized planning cases and 30 completed-event preservation cases.
- [x] Schema/seed, catalog graph/privacy, six semester scenarios, 960 dates and offline assets validate.
- [x] Real HTTP handler behavior tested without binding a socket.
- [x] JavaScript syntax and whitespace checks pass.

## Required before verified release

- [ ] `npm ci` and the full `npm test` suite on a host with network and localhost permissions.
- [ ] Execute existing fake-indexeddb reliability checks and the six new transactional migration/rollback/concurrent-migration tests.
- [ ] Execute the actual socket tests.
- [ ] Execute `npm run test:browser` with Playwright and a functioning browser sandbox.
- [ ] Complete the current browser checklist, including visual contrast, narrow layout, local attachment and stale-editor flows.

These are unverified gates, not product test failures that have been waived. In this environment, npm failed with EAI_AGAIN; socket binding failed with EPERM; Chromium failed at sandbox initialization. The full suite was attempted and is not green here. Previous 0.3.1 browser evidence is archived and does not validate 0.4.0.

## Source and progress truth

- Actual progress: browser IndexedDB attempts and user-confirmed checkpoints, plus immutable backup copies.
- Runtime catalog: staging input in `dist/catalog.json`, not a progress database.
- Dates: editable current Calendar; supplied 2026–27 windows retain source confidence. Semester envelopes and later annual calendars remain planning assumptions.
- Forecast rows: transient simulation, never learning evidence.
- Private archive bytes, note bodies and locators: not in the public bundle. Existing local browser drafts and selected personal attachments remain private to browser/backup.

## Still speculative / manual

Current teacher slide sequences, unsolved assignments and actual personal exam times; 2027–29 annual calendars; S5 option choice; owned Huang edition. Physical two-device transfer, native PWA installation and Zen rendering remain untested. Manual compatible-attempt reconciliation is available; no automatic curriculum merge or cloud sync is provided.
