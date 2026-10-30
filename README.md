# NOTIQ Sticky Notes & Task Manager

## Table of Contents

1. [Project Idea (Why we built it)](#1-project-idea-why-we-built-it)
2. [Features at a Glance](#2-features-at-a-glance)
3. [Feature Deep Dive](#3-feature-deep-dive)
4. [Tech Stack and Why We Chose It](#4-tech-stack-and-why-we-chose-it)
5. [Folder Structure](#5-folder-structure)
6. [App Flow (Start to Finish)](#6-app-flow-start-to-finish)
7. [Setup Guide (Step by Step)](#7-setup-guide-step-by-step)
8. [Environment Variables](#8-environment-variables)
9. [Firebase Setup](#9-firebase-setup)
10. [Deployment](#10-deployment)
11. [Data Model](#11-data-model)
12. [Security: How Safe Is It?](#12-security-how-safe-is-it)
13. [Mobile Support](#13-mobile-support)
14. [Performance Notes](#14-performance-notes)
15. [Known Limitations](#15-known-limitations)
16. [Troubleshooting](#16-troubleshooting)
17. [Future Ideas](#17-future-ideas)

## 1. Project Idea (Why we built it)

Most note apps want you to create an account, sync to a cloud, and learn a complicated interface before you can write a single line. Sometimes you just want a colourful sticky note and a checklist instantly.

**NOTIQ** is built around three ideas:

- **Zero friction** — open the page and write. No sign-up, no setup.
- **Notes + tasks in one place** — sticky notes for thoughts, a task list for things to do, and a dashboard that shows both at a glance.
- **Your data stays with you** — everything is saved in your own browser (`localStorage`). Nothing is uploaded anywhere.

It is also a learning project: the app started as a single-file HTML/CSS/JS app and is being migrated step by step to **React + Vite + Tailwind** while keeping the same look, behaviour and saved data.

## 2. Features at a Glance

| Area | What you get |
|------|--------------|
| **Sticky Notes** | Create, edit, delete notes with title + body, live word count |
| **Colour Labels** | 7 colour choices per note (orange, red, amber, green, blue, pink, purple) |
| **Pinning** | Pin important notes so they stay on top |
| **Reminders** | Set a date/time on a note and get an in-app banner + browser notification |
| **Search** | Instant, debounced search across note titles and bodies |
| **Filters & Sort** | All / Pinned / Reminders filters; sort by edited, created, title or pinned |
| **Views** | Switch between grid view and list view |
| **Task Manager** | Add tasks with priority (low / medium / high) and due date |
| **Task Filters** | All / Active / Done / High priority / Due today |
| **Dashboard** | Totals, pending & overdue counts, recent notes, top tasks, progress bar |
| **Undo** | "Undo" snackbar after deleting a note or task |
| **Dark / Light Theme** | One-click toggle, remembered across visits |
| **Keyboard Shortcuts** | `Ctrl/Cmd + N`, `1`, `2`, `3`, `Ctrl + Enter`, `Esc` |
| **Storage Meter** | Sidebar bar showing how much of the ~5 MB browser quota is used |
| **Responsive** | Collapsible sidebar with hamburger menu on small screens |

## 3. Feature Deep Dive

Each feature below answers four questions: **What** it is, **How to use** it, **Why** it exists, and **How it's built**.

### 3.1 Sticky Notes

- **What:** Colourful cards holding a title and body text.
- **How to use:** Click **New Note** (or press `Ctrl/Cmd + N`), type, pick a colour, click **Save**. Click any card to edit it.
- **Why:** The core of the app  capture a thought in two seconds.
- **How it's built:** Notes live in a JavaScript array. Each save writes the whole array to `localStorage` and re-renders the grid. Text is HTML-escaped before rendering (`esc()` helper) so typed `<tags>` never run as code.

### 3.2 Colour Labels

- **What:** A colour accent on every note card.
- **How to use:** In the note editor, click one of the colour dots.
- **Why:** Lets you visually group notes (e.g. green = personal, red = urgent) without a tag system.
- **How it's built:** The chosen hex colour is stored on the note and applied through a CSS custom property (`--nc`) on the card.

### 3.3 Pinning

- **What:** Pinned notes always appear before unpinned ones.
- **How to use:** Click the pin icon on a card, or use the pin toggle inside the editor.
- **Why:** Keep the notes you need every day within reach.
- **How it's built:** A boolean `pinned` flag; the render step sorts pinned notes first.

### 3.4 Reminders

- **What:** Attach a date and time to a note and get alerted when it arrives.
- **How to use:** In the editor, choose a date/time in the reminder field and save.
- **Why:** Turns a plain note into a lightweight "don't forget" alert.
- **How it's built:** On load and after every save, each future reminder is scheduled with `setTimeout`. When it fires, a banner appears in the app and — if you granted permission — a browser `Notification` is shown. The note is then marked `notified` so it won't fire twice.
- **Note:** Reminders only fire while the page is open in a tab (there is no background service).

### 3.5 Search, Filters and Sorting

- **What:** Find notes fast and control how the list is ordered.
- **How to use:** Type in the search box on the Notes page; use the tabs (All / Pinned / Reminders), the sort dropdown, and the grid/list toggle.
- **Why:** Notes pile up quickly; finding the right one must stay instant.
- **How it's built:** Search input is debounced (~180 ms) so the list isn't re-rendered on every keystroke. Filtering and sorting happen in memory on the notes array.

### 3.6 Task Manager

- **What:** A to-do list with priority levels and optional due dates.
- **How to use:** Go to **Tasks**, type a task, choose a priority chip, optionally pick a due date, press `Enter` or click **Add**. Click the circle to complete a task; use the pencil to edit.
- **Why:** Notes are for thoughts; tasks are for actions. Keeping both in one app avoids switching tools.
- **How it's built:** Tasks are a separate array in `localStorage`. The list sorts by: incomplete first → priority (high → low) → earliest due date. Overdue tasks get a warning label, and tasks due today are highlighted.
- **Bonus:** **Clear done** removes all completed tasks in one click.

### 3.7 Dashboard

- **What:** A summary page shown when the app opens.
- **How to use:** Click **Dashboard** in the sidebar (or `Ctrl/Cmd + 1`).
- **Why:** See your whole workload — notes, pending tasks, overdue items — at a glance.
- **How it's built:** Counts are calculated from the notes and tasks arrays; recent notes are the four most recently edited, and the progress bar shows the percentage of tasks completed.

### 3.8 Undo for Deletes

- **What:** A snackbar that lets you recover an accidental delete.
- **How to use:** After deleting a note or task, click **Undo** within ~4 seconds.
- **Why:** Deleting by mistake shouldn't mean losing your work.
- **How it's built:** The last deleted item is held in memory and re-inserted if Undo is clicked.

### 3.9 Theme Toggle

- **What:** Dark (default) and light themes.
- **How to use:** Click the toggle in the top bar.
- **Why:** Comfortable in any lighting; also just looks good.
- **How it's built:** The `data-theme` attribute on `<html>` switches between two sets of CSS variables. The choice is saved under the `notiq_theme` key.

### 3.10 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New note |
| `Ctrl/Cmd + 1` | Go to Dashboard |
| `Ctrl/Cmd + 2` | Go to Notes |
| `Ctrl/Cmd + 3` | Go to Tasks |
| `Ctrl/Cmd + Enter` | Save the open note/task editor |
| `Esc` | Close the open editor |
| `Enter` (in task box) | Add task |

## 4. Tech Stack and Why We Chose It

| Technology | Role | Why we chose it |
|------------|------|-----------------|
| **React 18** | UI library | Component-based UI and state handling; the long-term home of the app |
| **Vite 5** | Dev server & bundler | Very fast start-up and hot reload, simple config |
| **Tailwind CSS 3** | Styling toolkit | Utility classes for new components; configured with PostCSS + Autoprefixer |
| **JavaScript (ES6+)** | App logic | No TypeScript overhead for a small project |
| **HTML5 / CSS3** | Markup & design | Custom properties (CSS variables) power the dark/light themes |
| **Web Storage (`localStorage`)** | Persistence | No backend needed; data survives refresh and restart |
| **Notifications API** | Reminders | Native browser alerts for note reminders |
| **Google Fonts** | Typography | *Syne* (headings) and *DM Sans* (body) |

## 5. Folder Structure

```
STICKY-NOTES/
├── index.html              # Full working NOTIQ app (markup + styles + logic in one file)
├── package.json            # Scripts and dependencies
├── package-lock.json
├── vite.config.js          # Vite + React plugin
├── tailwind.config.js      # Tailwind content paths
├── postcss.config.js       # PostCSS (Tailwind + Autoprefixer)
├── .gitignore              # node_modules, dist, .env files
└── src/
    ├── main.jsx            # React entry point (mounts <App /> into #root)
    ├── App.jsx             # React rewrite in progress (notes, pin, tags, trash, search)
    ├── index.css           # Tailwind layers + global theme styles
    ├── legacy-template.html# Original app markup, extracted for the React migration
    ├── legacy.js           # Original app logic, wrapped as startLegacyApp()
    └── legacy.css          # Original app styles, extracted for the React migration
```

> **Migration status:** `index.html` currently contains the complete, working app. The `src/` files are the React migration (see [Known Limitations](#15-known-limitations)).

## 6. App Flow (Start to Finish)

```
Open app
   │
   ▼
Load theme  ──►  Load notes & tasks from localStorage
   │
   ▼
Render Dashboard  ──►  Schedule all note reminders
   │                    └─ ask for Notification permission (first visit)
   ▼
User navigates (sidebar / shortcuts)
   │
   ├── Dashboard : stats, recent notes, top tasks, progress
   ├── Notes     : search → filter → sort → grid/list → open editor
   └── Tasks     : add → prioritise → complete / edit / delete
   │
   ▼
Every change  ──►  update in-memory array  ──►  write to localStorage  ──►  re-render UI
   │
   ▼
Reminder time reached  ──►  in-app banner + browser notification  ──►  mark as notified
```

## 7. Setup Guide (Step by Step)

### Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (comes with Node.js)
- Git (optional, for cloning)

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the development server**

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

**4. Create a production build**

```bash
npm run build
```

The output goes to the `dist/` folder.

**5. Preview the production build locally**

```bash
npm run preview
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the project for production |
| `npm run preview` | Preview the production build locally |

## 8. Environment Variables

**None required.** NOTIQ has no API keys, no secrets and no backend, so you do **not** need a `.env` file to run it.

The `.gitignore` already excludes `.env` and `.env.*` (but allows `.env.example`), so if you add a backend or Firebase later, your secrets will not be committed by accident.

## 9. Firebase Setup

**Not used in the current version.** All data is stored locally in the browser.

If you later want cloud sync and login, a typical path would be:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Google) and **Firestore**.
3. Install the SDK: `npm install firebase`.
4. Put your config keys in a `.env` file using Vite's `VITE_` prefix (e.g. `VITE_FIREBASE_API_KEY`).
5. Replace the `localStorage` read/write functions with Firestore reads/writes.

See [Future Ideas](#17-future-ideas).

## 10. Deployment

NOTIQ is a static site, so any static host works.

### Netlify

1. Push the project to GitHub.
2. In Netlify: **Add new site → Import from Git** and pick the repo.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy.

### Vercel

1. Push the project to GitHub.
2. In Vercel: **Add New → Project** and import the repo.
3. Framework preset: **Vite** (auto-detected).
4. Build command: `npm run build`, output directory: `dist`.
5. Deploy.

> Since data is stored in each visitor's own browser, every person who opens your deployed link gets their own private, empty NOTIQ.

## 11. Data Model

All data is stored as JSON in `localStorage`.

### Storage keys

| Key | Contents |
|-----|----------|
| `notiq_notes_v1` | Array of notes |
| `notiq_tasks_v1` | Array of tasks |
| `notiq_theme` | `"dark"` or `"light"` |

### Note (full app)

```json
{
  "id": "lx3k9a2b7c",
  "title": "Weekly plan",
  "body": "Finish the dashboard UI…",
  "color": "#f97316",
  "pinned": true,
  "createdAt": "2026-10-27T10:30:00.000Z",
  "updatedAt": "2026-10-27T11:00:00.000Z",
  "reminder": "2026-10-28T09:00:00.000Z",
  "notified": false
}
```

### Task (full app)

```json
{
  "id": "lx3kb5f2d1",
  "text": "Push project to GitHub",
  "done": false,
  "priority": "high",
  "due": "2026-10-29T00:00:00.000Z",
  "createdAt": "2026-10-27T10:35:00.000Z"
}
```

`priority` is one of `low`, `medium`, `high`. Dates are stored as ISO-8601 strings.

> The React rewrite in `src/App.jsx` currently uses a slightly different note shape (`content`, `tag`, `trashed`). See [Known Limitations](#15-known-limitations).

## 12. Security: How Safe Is It?

| Topic | Status |
|-------|--------|
| **Data leaves your device?** | No. Nothing is sent to any server. |
| **Accounts / passwords?** | None, so there is nothing to leak. |
| **XSS (malicious HTML in notes)?** | User text is escaped before being inserted into the page. |
| **Encryption?** | **No.** `localStorage` is stored in plain text on your device. |
| **Shared computers?** | Anyone with access to the same browser profile can read your notes. |

**Bottom line:** Great for everyday notes and to-dos. Do **not** store passwords, card numbers or other highly sensitive information in it.

## 13. Mobile Support

- Layout adapts to small screens.
- The sidebar becomes a slide-in drawer opened with a **hamburger button**, with a dim overlay that closes it on tap.
- Buttons, chips and colour dots are sized for touch.
- Browser notifications on mobile depend on the browser and OS; in-app banners always work while the page is open.

## 14. Performance Notes

- **Tiny footprint:** React 18 is the only runtime dependency.
- **Debounced search:** the notes list is not re-rendered on every keystroke.
- **Instant start:** no network calls for data — everything loads from `localStorage`.
- **Storage meter:** the sidebar shows usage against an assumed ~5 MB limit (the typical browser quota).
- **Rendering:** the full app re-renders the visible list after each change, which is perfectly fast for hundreds of notes but is not designed for tens of thousands.
- **Fonts:** Google Fonts need an internet connection on first load; the app falls back to system fonts offline.

## 15. Known Limitations

- **No sync:** data is per-browser and per-device. Clearing site data deletes notes and tasks.
- **No export/import yet:** there is currently no built-in backup.
- **Reminders need an open tab:** they will not fire if the page is closed.
- **Migration in progress:** `index.html` holds the complete working app, but it does not yet load `src/main.jsx`. The React files in `src/` are not connected to it, and `src/App.jsx` is a simplified version (no colour labels, reminders or full task manager yet).
- **Data shape mismatch:** `App.jsx` and the full app both use the `notiq_notes_v1` key but store notes with different field names. Do not run both against the same browser data without a conversion step.
- **No license specified:** add a `LICENSE` file if you want others to be able to reuse the code.
  
## 16. Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm: command not found` | Install Node.js (LTS) from nodejs.org and reopen the terminal |
| Dependencies missing / import errors | Run `npm install` |
| Port 5173 already in use | Vite will suggest another port — open the URL shown in the terminal |
| Changes not showing | Stop the dev server, run `npm run dev` again, then hard-refresh (`Ctrl + Shift + R`) |
| Notes disappeared | Check you're using the same browser/profile and that site data wasn't cleared; private/incognito windows do not keep data |
| Reminders not alerting | Allow notifications for the site in your browser settings and keep the tab open |
| Build errors | Read the terminal output, delete `node_modules` and `package-lock.json`, then run `npm install` again |
| Blank page after deploy | Confirm the publish directory is `dist` and the build command is `npm run build` |

## 17. Future Ideas

- Finish the React migration (components, hooks, shared state)
- Move the full feature set (colours, reminders, task manager, dashboard) into React components
- Export / import notes and tasks as JSON
- Trash with restore for notes
- Tags and multi-label organisation
- Markdown support in notes
- Drag-and-drop reordering that persists
- Installable **PWA** with offline support and background reminders
- Cloud sync and login with Firebase
- Recurring tasks and subtasks
- Calendar view for due dates and reminders
- Add a `LICENSE` (e.g. MIT)

## License

No license is specified in the project files. Add a `LICENSE` file to define how others may use, modify or distribute this project.
