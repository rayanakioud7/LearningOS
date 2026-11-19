# LearningOS

I study AI and computer engineering at ENSAM Casablanca. Alongside my classes, I’m working through my own roadmap in math, programming, and ML systems. At the start of a study session, I kept having to figure out where I’d left off, what fit in the time I had, and whether coursework needed that time first.

I built LearningOS so I could open one page and get straight to work. It shows the exact chapter, lecture, or exercise I’m up to, plus a focus timer. When I finish, I choose **Completed**, **Partial**, **ENSAM priority**, or **Skipped**. If I only get halfway through a task, I can record how much is left and pick it up in the next suitable study block.

I also study late. Seeing Tuesday’s calculus at 02:00 while I was still working through Monday’s linear algebra made the switch at midnight annoying. The study day now rolls over at **05:00** in my chosen time zone. If I start a focus session before the cutoff, it stays on that study day even if I save it later.

## How I use it

- **Today** gives me one task, its source, a timer, and an optional recall question when I’ve already studied related material.
- **Calendar** lets me plan around classes and exams. I use the next two weeks for decisions and the [roadmap through June 2029](docs/ROADMAP_2026_11_14.md) to see where I’m headed. Dates farther out are estimates.
- **Curriculum** keeps my books, courses, and project milestones in one place. The planner checks chapter order, prerequisites, and available time when choosing the next task.
- **Study Log** keeps the time I actually spent, my notes, and the work I finished.

## Run it locally

Use Node.js 20 or newer and run `npm start` from the repo. Open [localhost on port 4173](http://127.0.0.1:4173/) and leave the terminal running. On Windows you can use `Start Learning OS.cmd`.

## Use it on a phone

The app is plain HTML, CSS, and JavaScript. Import this repo into Vercel with the repository root selected. The included `vercel.json` serves `dist/` as a static site, so the deployed app runs independently of my PC. Open the production HTTPS link on Android and use Chrome’s install or home-screen option. The app caches its own pages and catalog for offline use after the first visit. External books and lectures keep their own access requirements.

I keep progress and attachments in the browser’s IndexedDB. Each browser and site address has its own study log. To move progress from localhost to the hosted app or to a phone, use **Settings → Export backup** on the original device and **Settings → Restore backup** on the destination. Restore replaces the destination plan after a preview. **Reconcile attempts** can add compatible attempts if you’ve studied on both devices.

## Development

```sh
npm ci
npm test
npm run validate
```

See the [scheduling notes](docs/IMPLEMENTATION_V2.md), [release notes](docs/RELEASE_0_12_0.md), and [browser checks](docs/BROWSER_QA.md) for details.
