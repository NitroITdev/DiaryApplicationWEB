package models

import "time"

// User представляет данные пользователя в базе данных
type User struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
}

// Note представляет заметку
type Note struct {
	ID		int		`json:"id"`
	UserID	int		`json:"user_id"`
	Title	string	`json:"title"`
	Content	string	`json:"content"`
	
	Tag		string	`json:"tag"`
	CreatedAt	time.Time `json:"created_at"`
	UpdatedAt	time.Time `json:"updated_at"`
}

// LoginRequest и RegisterRequest используются для получения данных из тела HTTP-запроса
type LoginRequest struct {
	Email	string	`json:"username"`
	Password	string	`json:"password"`
}

type RegisterRequest struct {
	Username	string	`json:"username"`
	Email		string	`json:"email"`
	Password	string	`json:"password"`
}


