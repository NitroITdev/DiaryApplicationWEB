package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"diary-backend/middleware"
	"diary-backend/models"

	"github.com/gorilla/mux"
)

// CreateNote обрабатывает POST /notes
func CreateNote(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Получение UserID из контекста, установленного AuthMiddleware
		userID, ok := middleware.GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Ошибка аутентификации (userID отсутствует)", http.StatusInternalServerError)
			return
		}
		
		var note models.Note
		if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
			http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
			return
		}

		note.UserID = userID // Устанавливаем ID текущего пользователя
		
		// 2. Вставка в БД, включая user_id и tag
		sqlStatement := `INSERT INTO notes (user_id, title, content, tag, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, NOW(), NOW()) 
			RETURNING id, created_at, updated_at`
		
		err := db.QueryRow(sqlStatement, note.UserID, note.Title, note.Content, note.Tag).Scan(&note.ID, &note.CreatedAt, &note.UpdatedAt)

		if err != nil {
			http.Error(w, "Ошибка при создании заметки: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(note)
	}
}

// UpdateNote обрабатывает PUT /notes/{id}
func UpdateNote(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Получение UserID из контекста
		userID, ok := middleware.GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Ошибка аутентификации (userID отсутствует)", http.StatusInternalServerError)
			return
		}

		// 2. Получение NoteID из переменных пути
		vars := mux.Vars(r)
		noteID, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Неверный ID заметки", http.StatusBadRequest)
			return
		}

		// 3. Декодирование данных для обновления
		var updatedFields struct {
			Title   string `json:"title"`
			Content string `json:"content"`
			Tag     string `json:"tag"`
		}
		if err := json.NewDecoder(r.Body).Decode(&updatedFields); err != nil {
			http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
			return
		}

		// 4. SQL UPDATE: Обновление заметки, принадлежащей пользователю.
		// Используем RETURNING для получения обновленных данных и нового updated_at.
		sqlStatement := `UPDATE notes 
						 SET title = $1, content = $2, tag = $3, updated_at = NOW() 
						 WHERE id = $4 AND user_id = $5 
						 RETURNING id, user_id, title, content, tag, created_at, updated_at`

		var updatedNote models.Note
		err = db.QueryRow(sqlStatement, updatedFields.Title, updatedFields.Content, updatedFields.Tag, noteID, userID).Scan(
			&updatedNote.ID, &updatedNote.UserID, &updatedNote.Title, &updatedNote.Content, &updatedNote.Tag, &updatedNote.CreatedAt, &updatedNote.UpdatedAt)

		if err != nil {
			if err == sql.ErrNoRows {
				// Если RowsAffected = 0, значит заметка не найдена или не принадлежит пользователю
				http.Error(w, "Заметка не найдена или не принадлежит пользователю", http.StatusNotFound)
				return
			}
			http.Error(w, "Ошибка при обновлении заметки: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// 5. Отправка обновленной заметки в ответе
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(updatedNote)
	}
}

// GetNotes обрабатывает GET /notes (получение всех заметок пользователя)
func GetNotes(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := middleware.GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Ошибка аутентификации пользователя", http.StatusInternalServerError)
			return
		}
		
		// Запрос только для заметок текущего пользователя
		sqlStatement := `SELECT id, user_id, title, content, tag, created_at, updated_at 
			FROM notes WHERE user_id = $1 ORDER BY created_at DESC`
		
		rows, err := db.Query(sqlStatement, userID)
		if err != nil {
			http.Error(w, "Ошибка получения заметок: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		notes := []models.Note{}
		for rows.Next() {
			var note models.Note
			err := rows.Scan(&note.ID, &note.UserID, &note.Title, &note.Content, &note.Tag, &note.CreatedAt, &note.UpdatedAt)
			if err != nil {
				http.Error(w, "Ошибка сканирования заметки", http.StatusInternalServerError)
				return
			}
			notes = append(notes, note)
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(notes)
	}
}

// GetNote обрабатывает GET /notes/{id} (получение одной заметки)
func GetNote(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := middleware.GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Ошибка аутентификации пользователя", http.StatusInternalServerError)
			return
		}

		vars := mux.Vars(r)
		noteID, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Неверный ID заметки", http.StatusBadRequest)
			return
		}

		var note models.Note
		sqlStatement := `SELECT id, user_id, title, content, tag, created_at, updated_at 
			FROM notes WHERE id = $1 AND user_id = $2`
		
		err = db.QueryRow(sqlStatement, noteID, userID).Scan(
			&note.ID, &note.UserID, &note.Title, &note.Content, &note.Tag, &note.CreatedAt, &note.UpdatedAt)

		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Заметка не найдена или не принадлежит пользователю", http.StatusNotFound)
				return
			}
			http.Error(w, "Ошибка сервера при получении заметки", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(note)
	}
}


// DeleteNote обрабатывает DELETE /notes/{id}
func DeleteNote(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, _ := middleware.GetUserIDFromContext(r.Context()) // UserID гарантирован middleware
		vars := mux.Vars(r)
		noteID, _ := strconv.Atoi(vars["id"])

		// Удаление: WHERE id = $1 AND user_id = $2 - двойная проверка
		sqlStatement := `DELETE FROM notes WHERE id = $1 AND user_id = $2`
		
		result, err := db.Exec(sqlStatement, noteID, userID)
		if err != nil {
			http.Error(w, "Ошибка при удалении заметки", http.StatusInternalServerError)
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			http.Error(w, "Заметка не найдена или не принадлежит пользователю", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent) // 204
	}
}