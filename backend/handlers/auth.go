package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	// ⭐ Убедитесь, что эти пакеты импортированы
	"github.com/lib/pq" // Используется для обработки ошибок БД, например, нарушения уникальности
	"golang.org/x/crypto/bcrypt"

	"diary-backend/models" // ⭐ Замените на ваш путь к модулю
	"diary-backend/utils"  // ⭐ Замените на ваш путь к модулю
)

// RegisterHandler обрабатывает регистрацию пользователя с верификацией по email
func RegisterHandler(db *sql.DB) http.HandlerFunc {
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
        
        // --- 1. Генерация данных для верификации ---
        code := utils.GenerateVerificationCode()
        expiryTime := time.Now().Add(15 * time.Minute) // Код действует 15 минут

        // 2. Хеширование пароля
        hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
        if err != nil {
            http.Error(w, "Ошибка хеширования пароля", http.StatusInternalServerError)
            return
        }

        // --- 3. Вставка в БД с полями верификации ---
        var userID int
        sqlStatement := `
            INSERT INTO users 
                (username, email, password_hash, is_verified, verification_code, code_expiry_time, created_at)
            VALUES 
                ($1, $2, $3, $4, $5, $6, NOW()) 
            RETURNING id
        `
        
        // ⭐ Обратите внимание на порядок аргументов:
        err = db.QueryRow(sqlStatement, 
            req.Username, 
            req.Email, 
            string(hashedPassword), 
            false,           // is_verified = false по умолчанию
            code,            // код верификации
            expiryTime,      // время истечения
        ).Scan(&userID)

        if err != nil {
            // Обработка ошибки дубликата (например, нарушена уникальность email)
            if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" { // 23505 - код ошибки уникальности PostgreSQL
                http.Error(w, "Пользователь с таким email уже зарегистрирован", http.StatusConflict)
                return
            }
            // Другие ошибки БД
            http.Error(w, "Ошибка регистрации пользователя: "+err.Error(), http.StatusInternalServerError)
            return 
        }

        // --- 4. Отправка письма ---
        // Отправляем письмо только после успешной регистрации и сохранения в БД
        emailErr := utils.SendVerificationEmail(req.Email, code)
        
        if emailErr != nil {
            // Если письмо не отправлено, логируем ошибку, но клиенту можно вернуть успешный статус
            // или статус с предупреждением. В этом примере возвращаем ошибку сервера, 
            // чтобы уведомить пользователя, что что-то пошло не так.
            http.Error(w, "Регистрация успешна, но не удалось отправить верификационное письмо. Попробуйте войти позже.", http.StatusInternalServerError)
            // При реальном использовании тут может потребоваться удаление пользователя из БД 
            // или его пометка для повторной отправки письма.
            return
        }

        // 5. Успешный ответ
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Аккаунт создан. Проверьте почту для верификации.",
            "email": req.Email, // Возвращаем email, чтобы фронтенд мог направить на страницу верификации
        })
    }
}

func LoginHandler(db *sql.DB) http.HandlerFunc {
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