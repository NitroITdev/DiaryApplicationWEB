import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getNotes, createNote, deleteNoteApi, logoutUser } from "../api";
import "../styles/main.css";
import "../styles/libs/bootstrap-grid.min.css";
import "../styles/libs/bootstrap-reboot.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function DiaryPage() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tag: "ideas",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  // СОСТОЯНИЕ ДЛЯ МОДАЛЬНОГО ОКНА ОБРАТНОЙ СВЯЗИ
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  // СОСТОЯНИЕ ДЛЯ ТЕКСТА ОБРАТНОЙ СВЯЗИ
  const [feedbackText, setFeedbackText] = useState("");
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ФУНКЦИЯ: ОТПРАВКА ОБРАТНОЙ СВЯЗИ
  const handleSendFeedback = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    console.log("Отправка обратной связи:", feedbackText);

    // Тут будет реальный API-вызов
    alert("Спасибо за ваш отзыв!");
    setFeedbackText("");
    setShowFeedbackModal(false);
  };

  // --- ФУНКЦИЯ ЗАГРУЗКИ ЗАМЕТОК ---
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotes();

      // if (data.length > 0) {
      //     console.log("Сырая дата от Go для первой заметки:", data[0].created_at);
      // }

      const formattedNotes = data.map((note) => ({
        ...note,
        // Используем 'created_at' от Go-бэкенда в качестве основной даты
        date: note.created_at || note.updated_at,
        tag: note.tag || "ideas",
      }));

      setNotes(formattedNotes);
    } catch (err) {
      setError("Не удалось загрузить заметки. Возможно, сессия истекла.");
      if (err.message === "Unauthorized") {
        navigate("/auth", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // --- ФУНКЦИЯ ДОБАВЛЕНИЯ ЗАМЕТКИ ---
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const noteData = {
      title: newNote.title,
      content: newNote.content,
      tag: newNote.tag,
    };

    try {
      const createdNote = await createNote(noteData);

      const newNoteWithTag = {
        ...createdNote,
        date: createdNote.created_at,
        tag: newNote.tag,
      };

      setNotes([newNoteWithTag, ...notes]);
      setNewNote({ title: "", content: "", tag: "ideas" });
      setShowAddModal(false);
    } catch (err) {
      setError("Ошибка при создании заметки.");
    }
  };

  // ФУНКЦИЯ УДАЛЕНИЯ
  const handleDeleteNote = async (id) => {
    try {
      // Вызываем API для удаления на бэкенде
      await deleteNoteApi(id);

      // Если API успешно удалило, обновляем локальный стейт
      setNotes(notes.filter((n) => n.id !== id));
      setNoteToDelete(null);
    } catch (err) {
      setError("Ошибка при удалении заметки.");
      setNoteToDelete(null); // Закрываем модальное окно даже при ошибке
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = filterTag === "all" || note.tag === filterTag;
    return matchesSearch && matchesTag;
  });

  // ФУНКЦИЯ ФОРМАТИРОВАНИЕ ДАТЫ
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    // Проверяем, удалось ли распарсить дату
    if (isNaN(date.getTime())) {
      // Если дата невалидна, возвращаем исходную строку или сообщение об ошибке
      return "Неверная дата";
    }

    // Используем локальные настройки для красивого вывода
    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const handleLogout = () => {
    logoutUser();
    // navigate("/auth", { replace: true }); // navigate теперь происходит внутри logoutUser
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "50px" }}
      >
        <h2>Загрузка заметок...</h2>
        <p>Подключение к Go-серверу.</p>
      </div>
    );
  }

  // --- 3. КОМПОНЕНТ FAQ ---
  const FAQSection = () => {
    const faqData = [
      {
        q: "Почему мои заметки не загружаются?",
        a: "Чаще всего это происходит из-за истечения срока действия вашей сессии (токена). Попробуйте выйти из системы, а затем снова войти. Если проблема сохранится, возможно, есть временные проблемы с бэкендом (Go-сервером).",
      },
      {
        q: "Как я могу изменить тег заметки после ее создания?",
        a: "В текущей версии приложения изменение тега доступно только при создании заметки. Мы работаем над добавлением функции редактирования для изменения тегов и контента уже существующих записей.",
      },
      {
        q: "Безопасно ли хранить данные в DiaryApp?",
        a: "Да. Ваш пароль хранится в зашифрованном виде (хешируется с помощью bcrypt) и никогда не передается в открытом виде. Токен доступа, который вы используете, имеет ограниченный срок действия (24 часа), что повышает безопасность.",
      },
      {
        q: "Могу ли я использовать markdown (форматирование текста)?",
        a: "В настоящее время поддерживается только простой текст. В будущих обновлениях мы планируем добавить поддержку базового форматирования markdown для обогащения ваших записей.",
      },
      {
        q: "Что делать, если я забыл пароль?",
        a: "В текущей версии приложения функция восстановления пароля не реализована. Если вы забыли пароль, вам потребуется создать новый аккаунт с другим логином. Мы рекомендуем записать ваш пароль.",
      },
    ];

    return (
      <div className="faq-section">
        <h4>Часто задаваемые вопросы (FAQ)</h4>
        {faqData.map((item, index) => (
          <div key={index} className="faq-item">
            <details>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">
            DiaryApp
          </Link>
          <div className="navbar-wrap">
            <ul className="navbar-menu">
              <li>
                <Link to="/about">О нас</Link>
              </li>
              <li>
              <Link to="/why-journal">Зачем вести дневник?</Link>
              </li>
              <li>
                <li>
              <Link to="/how-to-start">Как начать?</Link>
              </li>

              </li>
              <li>
                 <Link to="/functions">Функции</Link>
              </li>
            </ul>
          </div>
          {/* \УДАЛЕН Link to="/feedback" ИЗ NAVBAR */}
          <button className="logout-btn" onClick={handleLogout}>
            Exit
          </button>
        </div>
      </nav>

      <div className="container">
        <header className="header">
          <h1>DiaryApp</h1>
          <p>Store your thoughts and ideas in style</p>
        </header>

        {error && (
          <div
            className="alert alert-danger"
            style={{ color: "red", textAlign: "center" }}
          >
            {error}
          </div>
        )}

        <div className="controls">
          {/* ... Controls code ... */}
          <div className="controls-container">
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <div className="filter-group">
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="filter-select"
              >
                <option value="all">All notes</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="ideas">Ideas</option>
                <option value="reminders">Reminders</option>
              </select>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
          </div>
        </div>

        {filteredNotes.length === 0 && !loading ? (
          <div className="empty-state" style={{ display: "block" }}>
            <i className="fas fa-notes-medical"></i>
            <h3>No Notes</h3>
            <p>Add your first note using the "Add" button</p>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <div key={note.id} className={`note-card fade-in`}>
                <div className="note-content">
                  <div className="note-header">
                    <h4 className="note-title">{note.title}</h4>
                    {/* Кнопка удаления, вызывает setNoteToDelete */}
                    <button
                      className="delete-btn"
                      onClick={() => setNoteToDelete(note.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <p className="note-text">{note.content}</p>
                  <div className="note-footer">
                    <span className={`note-tag tag-${note.tag}`}>
                      {note.tag.charAt(0).toUpperCase() + note.tag.slice(1)}
                    </span>
                    {/* Используем исправленную функцию formatDate */}
                    <span className="note-date">{formatDate(note.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Note Modal */}
        {showAddModal && (
          <div className="modal-overlay active">
            {/* ... Modal content ... */}
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">New Note</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>
              <form className="modal-body" onSubmit={handleAddNote}>
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
                  />
                </div>

                <div className="tags-container">
                  {["work", "personal", "ideas", "reminders"].map((tag) => (
                    <label key={tag} className="tag-option">
                      <input
                        type="radio"
                        name="noteTag"
                        value={tag}
                        className="tag-radio"
                        checked={newNote.tag === tag}
                        onChange={(e) =>
                          setNewNote({ ...newNote, tag: e.target.value })
                        }
                      />

                      <span className={`tag-label tag-${tag}`}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
                <button type="submit" className="submit-btn">
                  Save Note
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal (Использует функцию handleDeleteNote) */}
        {noteToDelete && (
          <div className="modal-overlay active">
            <div className="modal confirmation-modal">
              <div className="modal-body">
                <p className="confirmation-text">
                  Are you sure you want to delete this note?
                </p>
                <div className="confirmation-buttons">
                  <button
                    className="confirmation-btn cancel-btn"
                    onClick={() => setNoteToDelete(null)}
                  >
                    Cancel
                  </button>
                  {/* Передаем ID в асинхронную функцию handleDeleteNote */}
                  <button
                    className="confirmation-btn confirm-btn"
                    onClick={() => handleDeleteNote(noteToDelete)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ПЛАВАЮЩАЯ КНОПКА */}
        <button
          className="floating-feedback-btn"
          onClick={() => setShowFeedbackModal(true)}
          title="Отправить отзыв"
        >
          <i className="fas fa-comment-alt"></i> Feedback
        </button>

        {/* МОДАЛЬНОЕ ОКНО ОБРАТНОЙ СВЯЗИ */}
        {showFeedbackModal && (
          <div
            className="modal-overlay active"
            onClick={() => setShowFeedbackModal(false)}
          >
            <div
              className="modal feedback-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Обратная связь</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <FAQSection />

                <hr style={{ margin: "20px 0", borderTop: "1px solid #eee" }} />

                <p>
                  Если ваш вопрос не найден, пожалуйста, оставьте нам сообщение:
                </p>

                <form onSubmit={handleSendFeedback}>
                  <div className="form-group">
                    <textarea
                      className="form-input form-textarea"
                      rows="5"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    Отправить сообщение
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default DiaryPage;
