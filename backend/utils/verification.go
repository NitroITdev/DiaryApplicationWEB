package utils // ⬅️ Пакет utils должен быть объявлен

import (
    "fmt"
    "math/rand"
    "time"
)

// GenerateVerificationCode создает 6-значный код.
// ⭐ ФУНКЦИЯ ДОЛЖНА БЫТЬ ЭКСПОРТИРУЕМА (начинаться с заглавной буквы)
func GenerateVerificationCode() string {
    rand.Seed(time.Now().UnixNano()) 
    return fmt.Sprintf("%06d", rand.Intn(1000000))
}