import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "notiq_notes_v1";

function readNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function App() {
  const [notes, setNotes] = useState(readNotes);
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const visibleNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesSearch =
          `${note.title} ${note.content} ${note.tag}`
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesPinned = !pinnedOnly || note.pinned;

        const matchesPage =
          activePage === "Dashboard" ||
          activePage === "My Notes" ||
          (activePage === "Pinned" && note.pinned) ||
          (activePage === "Trash" && note.trashed);

        return (
          matchesSearch &&
          matchesPinned &&
          matchesPage &&
          (activePage === "Trash" ? note.trashed : !note.trashed)
        );
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notes, search, activePage, pinnedOnly]);

  const openNewNote = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setTag("");
    setShowEditor(true);
  };

  const openEditNote = (note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTag(note.tag);
    setShowEditor(true);
  };

  const saveNote = (event) => {
    event.preventDefault();

    if (!title.trim() && !content.trim()) return;

    if (editingId) {
      setNotes((current) =>
        current.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: title.trim() || "Untitled Note",
                content: content.trim(),
                tag: tag.trim(),
                updatedAt: Date.now(),
              }
            : note
        )
      );
    } else {
      setNotes((current) => [
        {
          id: crypto.randomUUID(),
          title: title.trim() || "Untitled Note",
          content: content.trim(),
          tag: tag.trim(),
          pinned: false,
          trashed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        ...current,
      ]);
    }

    setShowEditor(false);
  };

  const togglePin = (id) => {
    setNotes((current) =>
      current.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned } : note
      )
    );
  };

  const moveToTrash = (id) => {
    setNotes((current) =>
      current.map((note) =>
        note.id === id ? { ...note, trashed: true } : note
      )
    );
  };

  const restoreNote = (id) => {
    setNotes((current) =>
      current.map((note) =>
        note.id === id ? { ...note, trashed: false } : note
      )
    );
  };

  const permanentlyDelete = (id) => {
    if (!window.confirm("Permanently delete this note?")) return;
    setNotes((current) => current.filter((note) => note.id !== id));
  };

  const activeNotes = notes.filter((note) => !note.trashed);
  const tasks = JSON.parse(localStorage.getItem("notiq_tasks_v1") || "[]");
  const activeTasks = tasks.filter((task) => !task.completed);

  const navItems = ["Dashboard", "My Notes", "Pinned", "Trash", "Tasks"];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">N</span>
          <span>NOTIQ</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="navigation">
          {navItems.map((page) => (
            <button
              key={page}
              className={`nav-item ${activePage === page ? "active" : ""}`}
              onClick={() => {
                setActivePage(page);
                setPinnedOnly(false);
              }}
            >
              {page}
              {page === "My Notes" && (
                <span className="nav-count">{activeNotes.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="avatar">A</span>
          <div>
            <strong>My Workspace</strong>
            <small>Personal account</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
            <h1>{activePage}</h1>
          </div>

          <button className="primary-button" onClick={openNewNote}>
            + New Note
          </button>
        </header>

        <section className="welcome-section">
          <p className="eyebrow">STAY ORGANIZED</p>
          <h2>Your thoughts, all in one place.</h2>
          <p>Capture ideas, organize notes, and keep track of your work.</p>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total Notes</span>
            <strong>{activeNotes.length}</strong>
            <small>Your ideas, saved locally</small>
          </article>

          <article className="stat-card">
            <span>Active Tasks</span>
            <strong>{activeTasks.length}</strong>
            <small>Things to get done</small>
          </article>

          <article className="stat-card">
            <span>Pinned Notes</span>
            <strong>{activeNotes.filter((note) => note.pinned).length}</strong>
            <small>Your important thoughts</small>
          </article>
        </section>

        <section className="notes-section">
          <div className="section-heading">
            <div>
              <h2>{activePage === "Dashboard" ? "Your Notes" : activePage}</h2>
              <p>Everything you need to remember.</p>
            </div>

            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes..."
              aria-label="Search notes"
            />
          </div>

          {activePage === "Tasks" ? (
            <div className="empty-state">
              <h3>Task management is next</h3>
              <p>We will implement the full task manager in the next step.</p>
            </div>
          ) : visibleNotes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✎</div>
              <h3>No notes found</h3>
              <p>Create a note to get started, or try another search.</p>
              <button className="primary-button" onClick={openNewNote}>
                Create your first note
              </button>
            </div>
          ) : (
            <div className="notes-grid">
              {visibleNotes.map((note) => (
                <article className="note-card" key={note.id}>
                  <div className="note-card-top">
                    {note.tag && <span className="note-tag">{note.tag}</span>}

                    <button
                      className="icon-button"
                      onClick={() => togglePin(note.id)}
                      title={note.pinned ? "Unpin note" : "Pin note"}
                    >
                      {note.pinned ? "📌" : "Pin"}
                    </button>
                  </div>

                  <h3>{note.title}</h3>
                  <p className="note-content">{note.content || "No content"}</p>

                  <div className="note-card-footer">
                    <small>
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </small>

                    {note.trashed ? (
                      <div className="note-actions">
                        <button onClick={() => restoreNote(note.id)}>
                          Restore
                        </button>
                        <button onClick={() => permanentlyDelete(note.id)}>
                          Delete forever
                        </button>
                      </div>
                    ) : (
                      <div className="note-actions">
                        <button onClick={() => openEditNote(note)}>Edit</button>
                        <button onClick={() => moveToTrash(note.id)}>
                          Trash
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {showEditor && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowEditor(false);
            }
          }}
        >
          <form className="note-editor" onSubmit={saveNote}>
            <div className="editor-heading">
              <h2>{editingId ? "Edit Note" : "Create Note"}</h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowEditor(false)}
                aria-label="Close editor"
              >
                ✕
              </button>
            </div>

            <label htmlFor="note-title">Title</label>
            <input
              id="note-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your note a title"
              autoFocus
            />

            <label htmlFor="note-tag">Tag</label>
            <input
              id="note-tag"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="Ideas, Work, Personal..."
            />

            <label htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write your thoughts here..."
              rows={7}
            />

            <div className="editor-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowEditor(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;