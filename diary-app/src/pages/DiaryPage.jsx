import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
// Убедитесь, что deleteNoteApi, getNotes, createNote, logoutUser ИМПОРТИРОВАНЫ из вашего файла API
import { getNotes, createNote, deleteNoteApi, logoutUser } from "../api"; 
import "../styles/main.css";
import "../styles/libs/bootstrap-grid.min.css";
import "../styles/libs/bootstrap-reboot.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function DiaryPage() {
    const navigate = useNavigate();

    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: "", content: "", tag: "ideas" });
    const [showAddModal, setShowAddModal] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [search, setSearch] = useState("");
    const [filterTag, setFilterTag] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- ФУНКЦИЯ ЗАГРУЗКИ ЗАМЕТОК ---
    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getNotes();
            
            // if (data.length > 0) {
            //     console.log("Сырая дата от Go для первой заметки:", data[0].created_at);
            // }

            const formattedNotes = data.map(note => ({
                ...note,
                // Используем 'created_at' от Go-бэкенда в качестве основной даты
                date: note.created_at || note.updated_at, 
                tag: note.tag || 'ideas' 
            }));
            
            setNotes(formattedNotes);
        } catch (err) {
            setError("Не удалось загрузить заметки. Возможно, сессия истекла.");
            if (err.message === 'Unauthorized') {
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
                tag: newNote.tag 
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
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    };

    const handleLogout = () => {
        logoutUser();
        // navigate("/auth", { replace: true }); // navigate теперь происходит внутри logoutUser
    };
    
    if (loading) {
        return <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
            <h2>Загрузка заметок...</h2>
            <p>Подключение к Go-серверу.</p>
        </div>;
    }

    return (
        <>
            <nav className="navbar">
                {/* ... Navbar code ... */}
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

            <div className="container">
                <header className="header">
                    <h1>DiaryApp</h1>
                    <p>Store your thoughts and ideas in style</p>
                </header>
                
                {error && <div className="alert alert-danger" style={{ color: 'red', textAlign: 'center' }}>{error}</div>}

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
                                        <button className="delete-btn" onClick={() => setNoteToDelete(note.id)}>
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
                                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                            </div>
                            <form className="modal-body" onSubmit={handleAddNote}>

                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newNote.title}
                                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Content</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={newNote.content}
                                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
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
                                                onChange={(e) => setNewNote({ ...newNote, tag: e.target.value })}
                                            />

                                            <span className={`tag-label tag-${tag}`}>
                                                {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <button type="submit" className="submit-btn">Save Note</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal (Использует функцию handleDeleteNote) */}
                {noteToDelete && (
                    <div className="modal-overlay active">
                        <div className="modal confirmation-modal">
                            <div className="modal-body">
                                <p className="confirmation-text">Are you sure you want to delete this note?</p>
                                <div className="confirmation-buttons">
                                    <button className="confirmation-btn cancel-btn" onClick={() => setNoteToDelete(null)}>Cancel</button>
                                    {/* Передаем ID в асинхронную функцию handleDeleteNote */}
                                    <button className="confirmation-btn confirm-btn" onClick={() => handleDeleteNote(noteToDelete)}>Delete</button>
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