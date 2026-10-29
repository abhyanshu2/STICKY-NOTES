NOTIQ — Sticky Notes & Task Manager

NOTIQ is a browser-based sticky notes and task-management application. This project uses a React + Vite setup while retaining the existing interface and JavaScript behavior.

Features

Create and manage sticky notes in the browser.

Organize notes using pinning and visual labels where available in the interface.

Search notes and work with task-management features.

Save notes and tasks locally in browser localStorage.

Keep compatibility with the existing notiq_notes and notiq_tasks storage keys.

Run the app locally with Vite and create a production build.

Tech Stack

React 18 — UI mounting and application setup

Vite 5 — development server and production build tooling

Tailwind CSS 3 — utility-first styling configuration

JavaScript, HTML and CSS — application behavior and interface

Browser localStorage — local data persistence

Getting Started

Requirements

Node.js (LTS recommended)

npm (included with Node.js)

1. Clone the repository

git clone <your-repository-url>
cd sticky-notes-react

Replace <your-repository-url> with your GitHub repository URL.

2. Install dependencies

npm install

3. Start the development server

npm run dev

Open the local URL shown in your terminal by Vite (commonly http://localhost:5173).

4. Create a production build

npm run build

5. Preview the production build

npm run preview

Project Structure

sticky-notes-react/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── index.css
    ├── legacy-template.html
    ├── legacy.css
    └── legacy.js

Data Storage

The current version stores notes and tasks in the browser's localStorage using these keys:

notiq_notes

notiq_tasks

No separate database or custom backend is configured for this local-storage workflow. Data is browser-specific and does not automatically sync across browsers or devices. Clearing the browser's site data may delete saved notes and tasks.

Available Scripts

Command

Description

npm run dev

Start the Vite development server

npm run build

Build the project for production

npm run preview

Preview the production build locally

Developer Notes

src/main.jsx mounts the application and loads the existing interface.

src/legacy.js contains the existing JavaScript behavior.

src/legacy.css and src/index.css provide styling.

Tailwind CSS is configured, while some existing interface styling and behavior remain in the legacy files.

This version does not include a server-side database or custom API.

Troubleshooting

Dependencies missing: Run npm install.

Port already in use: Open the alternate URL shown in the terminal.

Changes not showing: Stop the development server and run npm run dev again.

Build errors: Check the terminal output and confirm that dependency installation completed successfully.

License

No license is specified in the provided project files. Add a license if you want to define how others may use, modify, or distribute this project.
