# LearningOS 0.10.0 — an active, precise curriculum

15 November 2026. Calendar refinement requested by the learner. The v4 roadmap’s phase dates, weekly roles, exam protection, rest and capacity ceilings stay authoritative.

- The bundled curriculum activates automatically on first load and upgrade. Existing local drafts become active. There are 383 public source units across 26 resources, plus 286 opaque historical archive references. No per-chapter staging/review is needed for the shipped resources.
- Prince’s 21 individual chapters are scheduled by their actual headings. S5 proceeds from 12 Transformers to 13 Graph neural networks, through 21 Deep learning and ethics. Later chapters no longer require the capstone-theory checkbox. Dates remain estimates, not promises of completion.
- Python Data Science Handbook 2e ranges become individual NumPy chapters 4–12 and plotting chapters 25–36. Existing pandas chapters 13–24 remain distinct. MML, Wasserman, Velleman and CS229 reference labels use source headings. Huang’s 16 code-folder labels become the published second-edition chapter titles, including Chapter 9 How transformers work. CS229 topics shared across lectures 3–4 are labeled as a topic group; an exact lecture split is not invented.
- The calendar leads with the chapter and action. Short source names reduce noise. Generic weekly rhythm and source notes sit in a disclosure. Existing source links, prerequisites, task details and optional overrides remain available.
- MIT continues without a trial-confirmation wall. Old trial summaries stay as overviews; an explicitly completed two-session trial covers its corresponding individual sessions without adding session events. The ILA §3.1 overview does not compete with saved §3.1.1–3.1.3 activities or restart Chapter 2.
- Git support, the SVD supplement after demonstrated foundations, contextual S3 math references and the S5 pretrained baseline are selected automatically in their existing timeboxes. Explicit dated support choices win. Skill checks derive from retained, non-voided completion outcomes. An isolated forecast may assume earlier progress but cannot save those assumptions as learning history.
- Earlier-semester university revision no longer spills automatically into a later semester. Confirmed urgent deadlines can still preempt. Unconfirmed module/file overviews stay active references; activating the catalog does not fabricate teacher assignments, personal exam times or completion. Other actual local learning tasks retain their source and progress.

## Data and recovery

The upgrade preserves stable task IDs, timer state, attempts, remaining effort, customized task headings, explicit resource suspension, academic dates and availability overrides. It writes one atomic IndexedDB snapshot under curriculum-before-2026-11-15.1 and preserves both migration-v1 and the existing restore-point. Concurrent tabs use revision checks. Restoring an older device backup applies the same catalog synchronization. A newer saved catalog is not downgraded by an older client.

npm run build:catalog is now reproducible from the sanitized curriculum/ inputs and scripts/refine-catalog.mjs. It no longer needs missing private research files. Private notes, slide filenames and document bytes are not build inputs or Git content. Project/paper/career actions remain authored milestones; all effort is estimated. Future course editions and academic calendars are not assumed known.

## Verification

214 local tests passed, zero failures/skips, including catalog activation, exact future chapter sequencing, nonmutating forecasts, timer/history/partial preservation, duplicate overview avoidance, explicit trial equivalence, source headings, derived prerequisite checks, older-client protection and concurrent atomic upgrades. Release validation checks 383 units, six semesters, 960 civil dates, privacy and the complete offline shell.

Interactive IAB verification used the disposable localhost origin, never synthetic writes to the real 127.0.0.1 study profile. Observed the old app’s explicit update prompt, automatic activation of its existing draft library, active Prince Chapter 13, exact future calendar allocations, retained study log, cancellation without an extra event, and phone-width layout without overflow. Physical device transfer and Zen-specific rendering were not performed. GitHub Actions runs the independent Windows/Linux Node matrix and sandboxed Chromium acceptance, including backup/recovery and offline behavior; see the commit-specific run.

## Verified heading sources

- [Prince’s official book and notebooks](https://github.com/udlbook/udlbook).
- [Python Data Science Handbook, second-edition contents](https://www.oreilly.com/library/view/python-data-science/9781098121211/).
- [Mathematics for Machine Learning, official contents](https://mml-book.github.io/).
- [All of Statistics, publisher contents](https://link.springer.com/book/10.1007/978-0-387-21736-9).
- [How to Prove It, Cambridge front matter](https://assets.cambridge.org/97811084/39534/frontmatter/9781108439534_frontmatter.pdf).
- [CS229 Autumn 2018 syllabus](https://cs229.stanford.edu/syllabus-autumn2018.html).
- [Deep Learning with PyTorch, second-edition contents](https://www.oreilly.com/library/view/deep-learning-with/9781633438859/).
- [GPU MODE Lecture 1 source files](https://github.com/gpu-mode/lectures/tree/main/lecture_001).
- [CS336 Spring 2025, Assignment 2 Systems](https://cs336.stanford.edu/spring2025/).
- [Hugging Face course](https://huggingface.co/learn/llm-course/chapter2/1).

Source headings are metadata. Exercises, bounded task actions, estimates, automatic reference matching and project sequencing are authored choices, not claims about a professor’s current syllabus or a full-book workload.
