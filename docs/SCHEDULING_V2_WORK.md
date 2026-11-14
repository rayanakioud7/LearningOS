# Scheduling Engine v2 work log

## Plan and preservation boundaries

1. Reproduce effort-edit, deadline classification and shared-capacity bugs in deterministic tests.
2. Extend the existing planner with explicit hard-deadline classification, shared availability, stable roles, remaining effort, pure range simulation and conflict explanations.
3. Replace secondary calendar rendering with civil-date month matrices and date drilldowns; retain Today styling.
4. Add semester selection, collapsed resources, grouped immutable attempts and edition-safe staging.
5. Run regression, release and browser gates; document actual results and recovery.

No live browser database is opened for development. No backup or private teaching material is included in public assets. Existing schema 1/2, IDs, original events, checkpoints, timers and recovery transactions remain supported. Derived projections stay in memory.

## Initial evidence / risks

- Local source is v0.4.0 with a clean worktree; key source files match the adjacent project ZIP.
- Read current README_START_HERE.md and CODEX_MASTER_PROMPT.md from supplied file references. ZIP downloads failed in the restricted environment, so ZIP-only spec files, semester_policy.json and the v2 scenario matrix have not been read. Local v1 research policy and scenarios are available. Exact handoff conformance remains a release gate until those files can be accessed.
- Baseline `npm run validate` passes. `npm test`: four test files pass; two lack fake-indexeddb and the socket suite fails in this environment. Browser driver lacks Playwright.
- Identified bugs: task form discards remainingMinutes; every academic date is ranked as a hard deadline; separate per-track subtraction double-books actual availability; calendar clamps past dates and is not aligned to calendar months.
- New optional fields must remain compatible with existing schema-2 backups. No mass rewrite of stored tasks or implicit activation is permitted.

## Outcome

Implementation and executed evidence are recorded in `SCHEDULING_V2_REPORT.md`. New behavior is additive on schema 2; the live browser remains untouched. The ZIP-only handoff comparison, full storage/socket suite and real-browser acceptance remain open gates.
