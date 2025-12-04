package middleware

import (
	"context"
	"diary-backend/utils"
	"net/http"
	"strings"
)

// contextKey - это тип для ключей контекста, чтобы избежать коллизий
type contextKey string
const UserIDKey contextKey = "userID"

// AuthMiddleware проверяет JWT-токен и добавляет UserID в контекст запроса
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Получение заголовка Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Требуется авторизация (отсутствует заголовок)", http.StatusUnauthorized)
			return 
		}

		// Ожидаемый формат: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Неверный формат токена", http.StatusUnauthorized)
			return 
		}

		tokenString := parts[1]

		// 2. Валидация токена
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			http.Error(w, "Недействительный или истекший токен", http.StatusUnauthorized)
			return 
		}

		// 3. Добавление UserID в контекст запроса
		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)

		// 4. Передача управления следующему обработчику с обновленным контекстом
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserIDFromContext - вспомогательная функция для извлечения UserID
func GetUserIDFromContext(ctx context.Context) (int, bool) {
	// Извлекаем значение и проверяем его тип
	userID, ok := ctx.Value(UserIDKey).(int)
	return userID, ok
}