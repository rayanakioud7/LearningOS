# Curriculum + Forecast v2 implementation

## Existing gaps and incremental changes

The original app already had explicit outcomes, timer persistence, immutable session snapshots, revision checks and atomic backup recovery. Its scheduler covered 14 days, let independent work fall into Wednesdays, and used only a flat task list. There was no schema migration, normalized catalog, import preview, pinned-day model or long-range scenario view. The seed also included private note-derived drafts.

The existing Today module, dark CSS, IndexedDB database/store, timer, four outcomes, server and backup controls remain. Small ES modules add curriculum models, scheduling/projection and secondary-page rendering. No framework or runtime service was introduced.

## Logical schema 2

| Model | State field / relationship |
| --- | --- |
| Resource | `resources`: ID, name, edition, source, URL, enabled state |
| LearningUnit | `units`: resource ID, source heading/ref, semester, activity kind, prerequisite unit IDs, confidence, import/legacy IDs, optional branch |
| StudyTask | `tasks`: unit/resource IDs, authored action, evidence, estimated/remaining minutes, review + activation state, priority, preferred weekdays, task prerequisites |
| CalendarSlot | `calendarSlots`: seven weekday roles, independent budgets and fixed/flexible resource preferences |
| AcademicWindow | `calendar`: editable civil-date ranges, provenance/confidence, active/conditional state; no invented exam times |
| SessionAttempt | `events` with type `session`: immutable explicit outcome, actual focused minutes and task/source/resource snapshots; corrections append `void` events |
| ScheduleOverride | `overrides`: dated rest/ENSAM decisions; `pinnedDay` records the current selection or an explicit early start |
| CurriculumRevision | `revisions`: new edits store author and old/new values; legacy revisions are retained as originally recorded |
| Checkpoint | `checkpoints`: existing user-confirmed scope and dates, separate from attempts |
| Projection | Derived rows returned by `project`; never stored as learning facts |
| Local source attachment | `attachments`: selected file name, unit ID, private base64 bytes; exported only in personal backups |

The legacy task display fields are retained for compatibility and frozen historical snapshots. Units/resources supply normalized references; `events` is the authoritative attempt log, rather than a duplicate session store. Resource/edition changes do not rewrite past attempts. Editing a completed task creates a new unit/task follow-up. Changing editions suspends that resource and stages unfinished tasks for review.

## Migration and import

`migrateDatabase` uses the existing optimistic transaction mechanism. A schema-1 → 2 write stores the exact previous browser state as `migration-v1` in the same transaction. It leaves an older `restore-point` untouched. No repository seed is read when a browser already has data. Timer identity, running state and accumulated time are preserved; import/export separately freeze transfer time. Repeated and concurrent migrations converge on the saved schema-2 result.

The public seed retains only the 25 existing active tasks and confirmed checkpoint. It contains no real session events. Private legacy browser drafts are not deleted. Legacy provenance is retained but explicitly requires review; migration does not certify source headings merely from resource names.

The bundled research catalog is staging input. `previewImport` validates fields and graph structure; detects duplicate headings, renamed units, canonical ID conflicts and edition mismatches; and reports counts/diffs. Only checked new units are imported. Selected dependencies must exist or be selected too. Equivalent source units may map to legacy units, but §3.1 never maps to §3.1.1. New units are research drafts unless activation and review are explicitly confirmed. Academic placeholders and optional branches cannot be batch-activated.

A full private catalog may be opened through the local catalog picker. Private archive entries stay local; attachment bytes are never fetched by archive locator. The default public output excludes the 87 private file entries, all archive member names/paths, note bodies and PDFs. The 286 archive registry entries hold only opaque ID, semester, role, inspection flag, historical confidence and private flag. The server only serves `dist`.

## Scheduler and projection

Civil-date arithmetic uses UTC calendar components at noon, never fixed Casablanca offsets or adding 24 hours to local instants. `civilDate` uses the selected IANA zone through Intl. Date validation rejects impossible calendar dates.

The planner applies explicit rest/ENSAM decisions, Sundays, pause/PFE/exam modes and active academic windows before independent roles. Enabled conditional resits protect time; disabled resits do not. Overlapping protection windows form a union. Weekly independent usage includes recorded focus time, even a skipped attempt; academic time remains separate. Weekday independent maximum is 90, Saturday 180 and weekly maximum 480; the default slots total 375. New focus timers cannot exceed the offered allocation. Already in-flight legacy timers are preserved.

Candidates need explicit review + activation, valid prerequisites, current semester eligibility, enabled resources and matching fixed slots. Wednesday and Friday do not fall back to unrelated independent content. Ordering uses academic deadlines, priority, semester relevance, partial-work continuation, resource priority/continuity, subject preferences, order and remaining effort. A P1 task may depend on a P2 implementation task. P3 cannot displace ready P0/P1. A new imminent academic deadline can supersede the pin with an explanation. Normal imports do not silently move it.

`forecast` simulates activated work on a copy; `project` also stages reviewed drafts after day 14 and non-optional research after day 42. Each simulated allocation reduces only local remaining effort and a local completion set. It never appends a session event. Scenario outputs expose source-unit previews rather than actionable tasks. Already completed work is excluded; semester-appropriate content continues through June 2029. Unknown teacher modules are labeled placeholders. Later dates are estimates, with no copied future exam weeks. Source edition conflicts exclude that research branch from the scenario.

## Source checks

The research pack was read before editing. Its actual JSON counts are authoritative: 321 units, including 87 private archive-file units; the brief’s earlier per-semester count paragraph was stale. The shipped 234-unit subset retains public-index headings and authored project milestones with different confidence labels.

Official repositories were rechecked on 14 November 2026:

- [Géron PyTorch notebooks](https://github.com/ageron/handson-mlp): 04 training linear models, 05 decision trees, 06 ensemble learning / random forests. No old TensorFlow-edition SVM mapping is applied.
- [Huang second-edition code](https://github.com/deep-learning-with-pytorch/dlwpt-code-2e): code directories are verified references, not a claim about the user’s owned book edition or exact chapter titles.

Exact academic windows come from the supplied planning rules / 2026–27 calendar. Semester envelope boundaries organize scenarios; they do not establish additional teaching or exam dates. Professor assignments, later annual calendars, S5 branch choice and the owned Huang edition still require user evidence.

## Verification limitations

88 deterministic core tests, including all 25 QA scenarios, passed here. Validation checks seed/schema conversion, graph structure, sanitized output, all six populated semester scenarios, all 960 dates and the offline manifest. Socket-free tests exercised the real HTTP handler and static-file privacy boundary.

The full suite was attempted, not skipped: fake-indexeddb was unavailable because npm resolution failed with EAI_AGAIN, and real socket tests were denied with EPERM. New migration/rollback/concurrent-tab storage tests are checked in but unexecuted here. Chromium sandbox initialization also failed. The optional browser driver and manual checklist must pass on a machine that allows npm, localhost binding and browser sandbox startup before this is described as a verified release. No actual user browser data was opened or changed by this implementation session.
