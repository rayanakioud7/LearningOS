# ENSAM Learning OS · MVP 0.2

A lightweight, local-first study app. No dependency installation, API key or paid server is required to run the local version.

## Open it

On this Windows computer, double-click **Start Learning OS.cmd**. Keep the app on the same local address (`http://127.0.0.1:4173`) so your browser can find its saved data.

On another computer with Node.js 20 or newer, run `npm start` in this folder and open the Local address it prints. Opening index.html directly is unsupported: browser storage, module loading and offline caching need a local server or HTTPS hosting.

The Windows launcher finds installed Node.js or the bundled Codex runtime on this computer. It starts the local server with its window hidden. If Node.js is absent, it explains what is missing rather than downloading software automatically. **Stop Learning OS.cmd** stops only the server launched from this app folder. Closing the browser does not stop a focus timer; its recorded focus duration is capped at the selected interval.

## Included

- Neutral black and charcoal throughout. Today shows only one task, a simple focus timer and the four outcomes. Milestone details are collapsed; Calendar, Curriculum, Study log and Settings retain the full plan.
- User-confirmed checkpoint: ILA §2.9 rank-theorem **examples** completed; begin §3.1 on Monday, 16 November 2026. This does not claim that every §2.9 exercise was solved.
- Four initial §3.1 tasks, followed by the ILA section sequence, plus the bounded two-week MIT calculus trial. Monday/Tuesday preferences guide ordering; ENSAM requirements take priority. All practice prompts and effort estimates are proposals.
- 282 research-library tasks kept as drafts. Review scope, progress, evidence and estimates before activation. Future ENSAM offerings remain tentative.
- Focus/pause/resume, refresh-safe timer state, capped elapsed time, outcome logging and break countdown. The app never completes a task just because a timer ended.
- Completed, partial, ENSAM override and skipped outcomes; optional remaining-time estimate; corrections preserve history.
- Deterministic two-week **daily allocation forecast**, prerequisite checks, independent weekly/daily limits, Friday buffer and Sunday recovery. It does not create fixed start-time appointments or Google Calendar events.
- Academic calendar windows, editable exam protection and conditional resits. The December 20 personal target stays separate from December 21–25 exam week.
- Add/edit/archive tasks, change prerequisites and review previous versions in backup data. Session history is retained when tasks are changed.
- Immediate IndexedDB saves with transactional conflict checks across tabs. Backup export and validated restore preview.
- Manual Obsidian Markdown inspection and task creation, entirely in the local browser. The assistant can inspect the vault when asked; the web app does not have unattended access to your folders.
- Offline app-shell caching after the first successful load. External textbook pages still need their own network connection or locally saved copies.

## Data and limits

This MVP stores progress **in the current browser**, not in a cloud account. Another device starts with separate data. Backup restore replaces the local plan; it does not merge two device histories. Export regularly, especially before clearing storage or switching browsers. Browser storage can be removed by the browser even when persistence is requested.

The app includes source headings and authored task descriptions, not the full RAR archives, teacher documents or Obsidian note bodies. Local note import is manual. No live AI service is involved. The suggested December 7 exam-preparation start is editable. Availability settings are independent-study ceilings, not a requirement to fill every evening.

## Verification

Run `npm test`. The test suite covers 34 scheduling, progress, timer, calendar and backup cases. JavaScript syntax and local asset references were also checked.

Browser preview permission was declined during this session, so visual layout, click-through interactions, IndexedDB in an actual browser, installability and offline browser behavior have **not** been verified end to end. These remain release checks. Website hosting is separate and has not been deployed. This is a local MVP candidate, not a fully validated production release.

No user study sessions or test outcomes were seeded as real history.

## Moving between laptop and desktop

On the device you just used, open Settings and choose **Export backup**. Transfer the JSON file (Syncthing can move that file), then use **Restore backup** on the other device and review the preview. Keep one device as the current source of truth; restore replaces the destination plan rather than merging two independently edited histories. The application folder is not the browser database.

Version 0.2 changes presentation and outcome shortcuts. Existing local progress, settings and sessions are retained. Refresh the browser after updating the code.
