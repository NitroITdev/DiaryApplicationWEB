import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/main.css"; // подключаем стили
import "bootstrap/dist/css/bootstrap-grid.min.css";
import "bootstrap/dist/css/bootstrap-reboot.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function DiaryPage() {
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notes, setNotes] = useState([]);

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tag: "ideas",
  });

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    setNotes([...notes, { ...newNote, id: Date.now() }]);
    setNewNote({ title: "", content: "", tag: "ideas" });
    setShowAddModal(false);
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter((n) => n.id !== id));
    setShowConfirmModal(false);
  };

  const handleLogout = () => {
    // Просто переходим на страницу авторизации, не удаляя данные
    navigate("/auth", { replace: true });
  };

  return (
    <>
      {/* --- Навигация --- */}
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">DiaryApp</Link>

          <div className="navbar-wrap">
            <ul className="navbar-menu">
              <li><Link to="/about">О нас</Link></li>
              <li><Link to="/text1">Текст</Link></li>
              <li><Link to="/text2">Текст</Link></li>
              <li><Link to="/text3">Текст</Link></li>
            </ul>

            <Link to="/feedback" className="callback">Feedback</Link>
            <button className="logout-btn" onClick={handleLogout}>Exit</button>
          </div>
        </div>
      </nav>

      {/* --- Основное содержимое --- */}
      <div className="container">
        <header className="header">
          <h1>DiaryApp</h1>
          <p>Store your thoughts and ideas in style</p>
        </header>

        {/* --- Панель управления --- */}
        <div className="controls">
          <div className="controls-container">
            <input
              type="text"
              placeholder="Search notes..."
              className="search-input"
            />
            <div className="filter-group">
              <select className="filter-select">
                <option value="all">All notes</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="ideas">Ideas</option>
                <option value="reminders">Reminders</option>
              </select>
              <button
                className="add-btn"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
          </div>
        </div>

        {/* --- Заметки --- */}
        <div id="notesContainer" className="notes-grid">
          {notes.length === 0 ? (
            <div id="emptyState" className="empty-state">
              <i className="fas fa-notes-medical"></i>
              <h3>No Notes</h3>
              <p>Add your first note by clicking the "Add" button</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className={`note-card tag-${note.tag}`}>
                <h4>{note.title}</h4>
                <p>{note.content}</p>
                <small>{note.tag}</small>
                <button
                  className="delete-btn"
                  onClick={() => setShowConfirmModal(note.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>

        {/* --- Модальное окно добавления заметки --- */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">New Note</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowAddModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleAddNote} className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newNote.title}
                    onChange={(e) =>
                      setNewNote({ ...newNote, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    className="form-input form-textarea"
                    value={newNote.content}
                    onChange={(e) =>
                      setNewNote({ ...newNote, content: e.target.value })
                    }
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <div className="tags-container">
                    {["work", "personal", "ideas", "reminders"].map((tag) => (
                      <label className="tag-option" key={tag}>
                        <input
                          type="radio"
                          name="noteTag"
                          value={tag}
                          checked={newNote.tag === tag}
                          onChange={(e) =>
                            setNewNote({ ...newNote, tag: e.target.value })
                          }
                        />
                        <span className={`tag-label tag-${tag}`}>
                          {tag === "work" && <i className="fas fa-briefcase"></i>}
                          {tag === "personal" && <i className="fas fa-user"></i>}
                          {tag === "ideas" && <i className="fas fa-lightbulb"></i>}
                          {tag === "reminders" && <i className="fas fa-bell"></i>}
                          {" "}{tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="submit-btn">
                  Save Note
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- Модалка подтверждения удаления --- */}
        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal confirmation-modal">
              <div className="modal-body">
                <p className="confirmation-text">
                  Are you sure you want to delete this note?
                </p>
                <div className="confirmation-buttons">
                  <button
                    className="confirmation-btn cancel-btn"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="confirmation-btn confirm-btn"
                    onClick={() => handleDeleteNote(showConfirmModal)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default DiaryPage;
