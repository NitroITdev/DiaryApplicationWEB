package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"diary-backend/models" 
	"diary-backend/utils"  
)

// ResendCodeHandler возвращает http.HandlerFunc для повторной отправки кода верификации.
func ResendCodeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Установим заголовки для JSON-ответа
		w.Header().Set("Content-Type", "application/json")

		var req models.VerificationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
			return
		}

		// --- 1. Поиск пользователя по Email ---
		var user models.User
		
		// SQL-запрос для поиска пользователя
		sqlStatement := `
			SELECT id, is_verified 
			FROM users 
			WHERE email = $1
		`
		err := db.QueryRow(sqlStatement, req.Email).Scan(
			&user.ID,
			&user.IsVerified,
		)

		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Пользователь не найден", http.StatusNotFound)
				return
			}
			http.Error(w, "Ошибка БД при поиске пользователя", http.StatusInternalServerError)
			return
		}

		if user.IsVerified {
			http.Error(w, "Аккаунт уже верифицирован", http.StatusBadRequest)
			return
		}

		// --- 2. Генерация и обновление кода в БД ---
		newCode := utils.GenerateVerificationCode() // Функция из utils
		expiryTime := time.Now().Add(5 * time.Minute)

		updateStatement := `
			UPDATE users 
			SET verification_code = $1, code_expiry_time = $2
			WHERE id = $3
		`
		_, err = db.Exec(updateStatement, newCode, expiryTime, user.ID)
		if err != nil {
			http.Error(w, "Ошибка БД при обновлении кода", http.StatusInternalServerError)
			return
		}

		// --- 3. Отправка Email ---
		if err := utils.SendVerificationEmail(req.Email, newCode); err != nil {
			// Логирование ошибки отправки, но клиенту сообщаем об успешном обновлении
			// выводим сообщение в консоль:
			returnErrorResponse(w, "Ошибка отправки email. Код обновлен в БД.", http.StatusInternalServerError)
			return
		}


		// 4. Успешный ответ
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Новый код верификации успешно отправлен.",
		})
	}
}

// Хелпер для возврата JSON-ответа с ошибкой
func returnErrorResponse(w http.ResponseWriter, msg string, statusCode int) {
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{
		"message": msg,
	})
}