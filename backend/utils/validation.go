package utils

import "regexp"

// const passwordRegexPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,}).*$"

// var passwordRegex = regexp.MustCompile(passwordRegexPattern)

var lengthRegex = regexp.MustCompile(`.{8,}`)
var lowerRegex = regexp.MustCompile(`[a-z]`)
var upperRegex = regexp.MustCompile(`[A-Z]`)
var digitRegex = regexp.MustCompile(`[0-9]`)
var specRegex = regexp.MustCompile(`[!@#$%^&*]`)

// ValidatePassword проверяет, соответствует ли пароль заданным правилам
func ValidatePassword(password string) bool {
    // Метод MatchString проверяет, соответствует ли строка шаблону
    return lengthRegex.MatchString(password) && 
	lowerRegex.MatchString(password) && 
	upperRegex.MatchString(password) && 
	digitRegex.MatchString(password) && 
	specRegex.MatchString(password)
}
