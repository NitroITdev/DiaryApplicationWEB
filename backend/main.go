package main

import (
	"database/sql"
	"diary-backend/handlers"
	"diary-backend/middleware"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

const (
	dbConnStr = "user=postgres password=postgreAdmin dbname=diarydb sslmode=disable"
	port      = ":8080"
)

func main() {
	db, err := sql.Open("postgres", dbConnStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal("Ошибка подключения к БД: %v", err)
	}
	fmt.Println("Успешное подключение к PostgreSQL.")


	// 2. Настройка маршрутизатора
	r := mux.NewRouter()

	// 3. Обработчики Аутентификации (публичный доступ)
	r.HandleFunc("/register", handlers.RegisterUser(db)).Methods("POST")
	r.HandleFunc("/login", handlers.LoginUser(db)).Methods("POST")

	// 4. Группа защищенных маршрутов (требуется JWT)
	protectedRouter := r.PathPrefix("/notes").Subrouter()
	// Применяем middleware для проверки токена
	protectedRouter.Use(middleware.AuthMiddleware)

	// 5. Обработчики Заметок (CRUD)
	protectedRouter.HandleFunc("", handlers.GetNotes(db)).Methods("GET")
	protectedRouter.HandleFunc("", handlers.CreateNote(db)).Methods("POST")
	//..
	protectedRouter.HandleFunc("/{id}", handlers.GetNote(db)).Methods("GET")
	protectedRouter.HandleFunc("/{id}", handlers.DeleteNote(db)).Methods("DELETE")

	// Настройка CORS(так как реакт на другом порту)
	handler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if req.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		r.ServeHTTP(w, req)
	})

	// 6. Запуск сервера
	fmt.Printf("Сервер запущен на порту %s\n", port)
	log.Fatal(http.ListenAndServe(port, handler)) // Используем handler с CORS
}
