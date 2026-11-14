# LearningOS · 0.3.1

A quiet, local-first study companion for ENSAM and your ML systems roadmap. Today stays minimal: one task, one timer, four outcomes.

## Run

On Windows, double-click **Start Learning OS.cmd**. Open **http://127.0.0.1:4173/** in Zen or your preferred browser. The launcher verifies the running version and project folder before opening the app, and keeps the server running in the background. Use **Stop Learning OS.cmd** when you want to stop it.

On Fedora or another computer with Node.js 20+, run:

```sh
npm start
```

Leave that terminal open. No dependency installation, API key, account or paid service is required to run the app. Use the same browser profile and URL to retain your local progress. Opening index.html directly is unsupported.

If an older page appears, start the server and press **Ctrl+Shift+R**. Check **http://127.0.0.1:4173/health** for the live version and source folder. Offline copies can open while the server is stopped; new code needs the server running.

## Daily use

1. Start focus. Pause or resume when needed; the remaining focus time also appears in the browser tab title.
2. Choose **Completed**, **Partial**, **ENSAM priority** or **Skipped**. Review and save the outcome. A timer ending never completes the learning task automatically.
3. If partial, optionally estimate what remains. Completion offers the next ready task within your time limits.
4. Edit coursework and deadlines in Curriculum. Active tasks enter the plan; research drafts remain outside it until reviewed.

Calendar forecasts the next 14 days without marking anything learned. Academic obligations take priority, exam protection can suspend independent study, and missed work never doubles tomorrow's hours. Sunday is free by default; an explicit ENSAM override can make room for required coursework. Deadline warnings include unfinished prerequisites.

## Move between laptop and desktop

1. On the device you just used, open Settings → **Export backup**. A running focus timer is paused before export.
2. Transfer that JSON file manually or with Syncthing.
3. On the other device, choose **Restore backup**, review the preview and restore. A paused focus session can resume there.

Keep one device as the current source of truth. Restore replaces its destination plan; it does not merge independent device histories. A local recovery copy is saved before each restore. Settings → **Recover previous plan** returns to that copy after confirmation. The replaced plan becomes the next recovery copy.

The project folder is code; your live progress is in that browser's IndexedDB. Copying or syncing the code folder does not transfer browser history. Exported JSON is the portable backup. Browser storage can be removed by the browser, so retain exported backups independently.

## Curriculum and privacy

Your confirmed checkpoint is ILA §2.9 rank-theorem **examples** completed, with §3.1 planned for November 16, 2026. This does not claim that every exercise was solved. The starter includes the ILA sequence and a bounded MIT calculus trial, plus 282 research-library drafts. Estimates are planning estimates, not measured study times. Current teacher assignments, individual exam notices and future semester syllabuses still require user confirmation.

The app includes headings and authored task prompts, not your full archives or Obsidian note bodies. Manual Markdown import stays in the local browser and never grants completion credit by itself. There is no cloud synchronization or live AI service. Website hosting is not deployed; GitHub holds the source code.

## Development and verification

```sh
npm ci
npm test
```

The only development dependency is fake-indexeddb, used to test database transactions in memory. It is not shipped as a browser dependency. Tests cover scheduling, calendar protection, timer transfer, invalid backups, concurrent-tab conflicts, atomic recovery copies, durable saves, source escaping and the local server. GitHub Actions runs on Windows/Linux with Node 22/24.

The core workflows have also passed a real-browser check on a separate disposable origin: focus refresh, all four outcomes, task editing, backup restore/recovery, concurrent tabs, offline reopening and desktop/phone-width layouts. The user’s real study history was not modified. Physical two-device transfer, native PWA installation and Zen-specific behavior remain unverified. See docs/BROWSER_QA.md for evidence and limits.

See `docs/RELEASE_NOTES.md` and `docs/RELEASE_CHECKLIST.md` for scope and remaining verification.
