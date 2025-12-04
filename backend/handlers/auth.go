package handlers

import (
	"database/sql"
	"diary-backend/models"
	"diary-backend/utils"
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func RegisterUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
			return 
		}

		// НОВАЯ ПРОВЕРКА: Валидация пароля
        if !utils.ValidatePassword(req.Password) {
            http.Error(w, "Пароль не соответствует требованиям безопасности", http.StatusBadRequest)
            return 
        }
		
		// 1. Хеширование пароля
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Ошибка хеширования пароля", http.StatusInternalServerError)
			return 
		}

		// 2. Вставка в БД
		var userID int
		sqlStatement := `INSERT INTO users (username, email, password_hash, created_at)
		VALUES ($1, $2, $3, NOW()) RETURNING id`

		err = db.QueryRow(sqlStatement, req.Username, req.Email, string(hashedPassword)).Scan(&userID)

		if err != nil {
			// В случае ошибки (например, дубликат username)
			http.Error(w, "Пользователь с таким именем/почтой уже существует", http.StatusConflict)
			return 
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]int{"id": userID, "status": http.StatusCreated})
	}
}

func LoginUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
			return 
		}

		// 1. Поиск пользователя и хеша
		var user models.User
		var passwordHash string
		// err := db.QueryRow("SELECT id, password_hash FROM users WHERE username = $1", req.Username).Scan(&user.ID, &passwordHash)
		err := db.QueryRow("SELECT id, password_hash FROM users WHERE email = $1", req.Email).Scan(&user.ID, &passwordHash) 
		// Примечание: req.Username будет содержать email, который ввел пользователь.

		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Неверное имя пользователя или пароль", http.StatusUnauthorized)
				return 
			}
			http.Error(w, "Ошибка сервера", http.StatusInternalServerError)
			return
		}

		// 2. Сравнение паролей
		if err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
			http.Error(w, "Неверное имя пользователя или пароль", http.StatusUnauthorized)
			return 
		}

		// 3. Создание JWT-токена
		tokenString, err := utils.GenerateToken(user.ID)
		if err != nil {
			http.Error(w, "Ошибка генерации токена", http.StatusInternalServerError)
			return 
		}

		// 4. Ответ с токеном
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
	}
}