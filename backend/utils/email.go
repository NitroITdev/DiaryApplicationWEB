package utils

import (
	"fmt"
	"log"
	"net/smtp"
)

// КОНФИГУРАЦИЯ SMTP. ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ.
const (
    smtpHost = "smtp.gmail.com" 
    smtpPort = "587"
    senderEmail = "gamee060400@gmail.com" // Email, с которого отправляете
    senderPassword = "taxclepcqzdizzag" // Пароль приложения для SMTP
)

// SendVerificationEmail отправляет письмо с кодом верификации на указанный адрес.
// Функция экспортирована
func SendVerificationEmail(toEmail, code string) error {
    
    // Формирование заголовков и MIME-типа
    subject := "Subject: Код верификации для DiaryApp\r\n"
    mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\r\n"
    
    // Тело письма в формате HTML
    body := fmt.Sprintf(`
        <html>
        <body>
            <p>Здравствуйте!</p>
            <p>Ваш код для верификации аккаунта DiaryApp:</p>
            <h1 style="color: coral; font-size: 24px;">%s</h1>
            <p>Срок действия кода истекает через 15 минут.</p>
            <p>С уважением, Команда DiaryApp</p>
        </body>
        </html>
    `, code)
    
    msg := []byte(subject + mime + "\r\n" + body)

    // Аутентификация
    auth := smtp.PlainAuth("", senderEmail, senderPassword, smtpHost)

    // Отправка письма
    addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
    err := smtp.SendMail(addr, auth, senderEmail, []string{toEmail}, msg)

    if err != nil {
        log.Printf("Ошибка при отправке письма на %s: %v", toEmail, err)
        return fmt.Errorf("ошибка отправки email: %w", err)
    }
    log.Printf("Письмо верификации успешно отправлено на: %s", toEmail)
    return nil
}