package handlers

import (
	"database/sql" // ⭐ Необходим для *sql.DB и работы с базой данных
	"encoding/json"
	"net/http"
	"time"

	"diary-backend/models" // Ваш путь к моделям
	"diary-backend/utils"  // Ваш путь к утилитам
)

// VerifyHandler возвращает http.HandlerFunc, которая принимает соединение с БД (*sql.DB).
// Это решает проблему "undefined: db".
func VerifyHandler(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
            return
        }

        var req models.VerificationRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
            return
        }
        
        // --- 1. Поиск пользователя по Email и проверка кода/статуса ---
        var user models.User
        
        // SQL-запрос для поиска пользователя и извлечения всех необходимых данных
        sqlStatement := `
            SELECT id, email, is_verified, verification_code, code_expiry_time
            FROM users 
            WHERE email = $1
        `
        err := db.QueryRow(sqlStatement, req.Email).Scan(
            &user.ID,
            &user.Email,
            &user.IsVerified,
            &user.VerificationCode,
            &user.CodeExpiryTime,
        )

        if err != nil {
            if err == sql.ErrNoRows {
                http.Error(w, "Пользователь не найден или неверный email", http.StatusNotFound)
                return
            }
            http.Error(w, "Ошибка БД при поиске пользователя", http.StatusInternalServerError)
            return
        }

        if user.IsVerified {
            http.Error(w, "Аккаунт уже верифицирован", http.StatusBadRequest)
            return
        }

        // 2. Проверка кода
        if user.VerificationCode != req.Code {
            http.Error(w, "Неверный код верификации", http.StatusUnauthorized)
            return
        }

        // 3. Проверка времени истечения
        if time.Now().After(user.CodeExpiryTime) {
            http.Error(w, "Срок действия кода истек", http.StatusUnauthorized)
            return
        }

        // --- 4. Успех: Обновление статуса в БД ---
        updateStatement := `
            UPDATE users 
            SET is_verified = TRUE, verification_code = '', code_expiry_time = NULL
            WHERE id = $1
        `
        _, err = db.Exec(updateStatement, user.ID)
        if err != nil {
            http.Error(w, "Ошибка БД при обновлении статуса", http.StatusInternalServerError)
            return
        }

        // --- 5. Выдача JWT-токена ---
        // ⭐ Предполагается, что utils содержит функцию GenerateToken или GenerateJWT
        tokenString, err := utils.GenerateToken(user.ID) 
        if err != nil {
            http.Error(w, "Ошибка генерации токена", http.StatusInternalServerError)
            return
        }

        // 6. Успешный ответ
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{
            "token":   tokenString, 
            "message": "Аккаунт успешно верифицирован!",
        })
    }
}