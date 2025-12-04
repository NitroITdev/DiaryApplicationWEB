package utils

import (
	"time"

	"github.com/dgrijalva/jwt-go"
)

// Ключ для подписи токена.
var jwtKey = []byte("my_super_secret_jwt_key_that_is_very_long_and_complex_12345")

// Claims определяет структуру полезной нагрузки токена
type Claims struct {
	UserID	int	`json:"user_id"`
	jwt.StandardClaims
}

// GenerateToken создает JWT для указанного UserID
func GenerateToken(userID int) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour) //Токен действителен 24 часа

	claims := &Claims{
		UserID: userID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	// Создаем токен и подписываем его нашим секретным ключем
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil // Возвращаем ключ для проверки подписи
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, jwt.NewValidationError("Токен не действителен", jwt.ValidationErrorSignatureInvalid)
	}

	return claims, nil
}