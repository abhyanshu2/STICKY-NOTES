# Notiq — React + Tailwind CSS

Sticky notes and task manager migrated from the original single-file app into a Vite + React project. Tailwind CSS is configured for utility styling, while the original visual system is retained to keep the existing experience familiar.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

Notes and tasks remain in browser localStorage using the existing `notiq_notes` and `notiq_tasks` keys, so existing browser data is compatible.
