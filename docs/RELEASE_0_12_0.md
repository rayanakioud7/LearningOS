# LearningOS 0.12.0 — a small refresher before focus

15 November 2026. Implements the learner’s narrower request: a simple memory refresh before studying, with deeper practice left to their preferred LLM.

- Start focus can offer one optional app-authored question with a revealable answer. Skip & start proceeds immediately; Cancel starts nothing. Resume never opens a refresher.
- Questions come from explicitly completed work in the same resource, or a completed direct prerequisite. The existing ILA §2.9 checkpoint can also supply a Rank Theorem question because it explicitly records examples practiced. It does not grant a chapter completion.
- A small local bank contains 44 concise prompts covering common math, probability, programming and ML topics. There is no runtime model, question-generation service, score, flashcard deck or review backlog. If no eligible covered topic exists, focus starts normally.
- Only the first start for a task on a given day offers the question. Reveal is read-only. Continuing or skipping records a lightweight visit and starts the normal allocated timer in one transaction. Visits do not create study attempts, mastery evidence or extra scheduled tasks.
- Copy for my LLM copies the question, its source scope and the next topic. It excludes private history/notes and the hidden answer. Nothing is sent to a service automatically.
- Settings → Focus & breaks can disable refreshers. The preference and bounded visit history are included in ordinary backups. Stale dialogs and simultaneous tabs cannot start duplicate timers.

All 237 local tests pass, including 14 new tests for checkpoint scope, actual versus partial/corrected/future work, frozen source headings, resume/disable behavior, unchanged focus allocation, no inferred completion, bounded backup data, validation, escaping, copied scope and transactional conflicts. Catalog/privacy/960-date/offline validation passes. Native browser acceptance additionally covers cancel, reveal, stale-session changes, starting and resuming focus, disabling the feature and offline persistence. See the release commit’s GitHub Actions run for final results.

The existing black/gray design, curriculum graph, calendar and weekly workload limits are unchanged. All prompts and answer summaries are app-authored; they are not quoted exercises or a replacement for a tutor. Topic coverage is deliberately limited and unsupported material skips the prompt.
