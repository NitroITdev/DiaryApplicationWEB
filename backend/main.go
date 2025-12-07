package main

import (
	"database/sql"
	"diary-backend/handlers"   // Ваш пакет обработчиков
	"diary-backend/middleware" // Ваш пакет middleware
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq" // Драйвер PostgreSQL
)

const (
    // ОБНОВИТЕ: Убедитесь, что строка подключения актуальна
    dbConnStr = "user=postgres password=postgreAdmin dbname=diarydb sslmode=disable"
    port      = ":8080"
)

func main() {
    // --- 1. Подключение к БД ---
    db, err := sql.Open("postgres", dbConnStr)
    if err != nil {
        log.Fatalf("Ошибка при открытии подключения к БД: %v", err)
    }
    defer db.Close()

    err = db.Ping()
    if err != nil {
        log.Fatalf("Ошибка подключения к БД: %v", err)
    }
    fmt.Println("Успешное подключение к PostgreSQL.")

    // --- 2. Настройка маршрутизатора ---
    r := mux.NewRouter()

    // 3. Обработчики Аутентификации (публичный доступ)
    // Эти функции вызываются с db в качестве аргумента, чтобы они могли получить доступ к базе данных.
    r.HandleFunc("/register", handlers.RegisterHandler(db)).Methods("POST")  // Регистрация с отправкой email
    r.HandleFunc("/login", handlers.LoginHandler(db)).Methods("POST")        // Вход (проверяет is_verified)
    r.HandleFunc("/verify", handlers.VerifyHandler(db)).Methods("POST")      // Верификация аккаунта
	r.HandleFunc("/resend-code", handlers.ResendCodeHandler(db)).Methods("POST")

    // 4. Группа защищенных маршрутов (требуется JWT)
    protectedRouter := r.PathPrefix("/notes").Subrouter()
    // Применяем middleware для проверки токена (AuthMiddleware)
    protectedRouter.Use(middleware.AuthMiddleware)

    // 5. Обработчики Заметок (CRUD)
    
	protectedRouter.HandleFunc("", handlers.GetNotes(db)).Methods("GET")
    protectedRouter.HandleFunc("", handlers.CreateNote(db)).Methods("POST")
    protectedRouter.HandleFunc("/{id}", handlers.UpdateNote(db)).Methods("PUT")
    protectedRouter.HandleFunc("/{id}", handlers.GetNote(db)).Methods("GET")
    protectedRouter.HandleFunc("/{id}", handlers.DeleteNote(db)).Methods("DELETE")

    // --- 6. Настройка CORS и Запуск сервера ---
    handler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
        // Устанавливаем заголовки CORS для разрешения запросов с фронтенда (React)
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        // Ответ на предзапрос OPTIONS
        if req.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        r.ServeHTTP(w, req) // Передаем запрос роутеру
    })

    // 7. Запуск сервера
    fmt.Printf("Сервер запущен на порту %s\n", port)
    log.Fatal(http.ListenAndServe(port, handler)) // Используем handler с CORS
}