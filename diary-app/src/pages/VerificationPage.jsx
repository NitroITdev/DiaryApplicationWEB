import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../styles/register.css"; // Импорт стилей

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем email, переданный со страницы регистрации через location.state
  const initialEmail = location.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null); // Добавлено для сообщений об успехе/инфо

  const handleResendCode = async () => {
    setMessage(null);
    setError(null);
    setLoading(true);

    const apiUrl = "http://localhost:8080/resend-code";

    try {
      console.log(`Отправка запроса на повторную отправку кода для: ${email}`);

      // вызов для повторной отправки
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        // Успешная отправка
        setMessage(
          "Код верификации успешно отправлен повторно. Проверьте почту."
        );
      } else {
        // Ошибка отправки
        const data = await response.json();
        setError(data.message || "Ошибка повторной отправки кода.");
      }
    } catch (err) {
      console.error("Ошибка сети при повторной отправке:", err);
      setError("Ошибка сети при повторной отправке. Проверьте адрес сервера.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null); // Сброс сообщений

    try {
      const response = await fetch("http://localhost:8080/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        // Успешная верификация: получаем токен, сохраняем его и переходим на главную
        localStorage.setItem("authToken", data.token);
        console.log(data.message || "Аккаунт успешно верифицирован!");
        navigate("/", { replace: true });
      } else {
        // Ошибка верификации (неверный код, просрочен и т.д.)
        setError(
          data.message || "Ошибка верификации. Пожалуйста, проверьте код."
        );
      }
    } catch (err) {
      console.error("Ошибка сети:", err);
      setError("Ошибка сети. Попробуйте снова или проверьте адрес сервера.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1 className="register-title">Подтверждение аккаунта</h1>
        {/* Используем общие стили для подзаголовка */}
        <p
          className="auth-subtitle"
          style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}
        >
          Введите 6-значный код, отправленный на:{" "}
          <strong>{email || "ваш адрес"}</strong>
        </p>

        {/* Сообщения об ошибке и успехе */}
        {error && (
          <p
            className="error-message"
            style={{ color: "red", marginTop: "10px", textAlign: "center" }}
          >
            {error}
          </p>
        )}
        {message && (
          <p
            className="success-message"
            style={{ color: "green", marginTop: "10px", textAlign: "center" }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Введите ваш Email"
              className="form-input"
              disabled={initialEmail !== ""} // Если email передан, делаем поле неактивным
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="code" className="form-label">
              Код верификации (6 цифр)
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              maxLength="6"
              required
              placeholder="******"
              className="form-input"
            />
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Проверяем..." : "Подтвердить аккаунт"}
          </button>
        </form>

        <div
          className="auth-footer"
          style={{ textAlign: "center", marginTop: "15px", fontSize: "0.9rem" }}
        >
          <p>
            Не получили код?{" "}
            {/* Добавлена логика отключения и изменения курсора при загрузке */}
            <span
              onClick={loading ? null : handleResendCode}
              style={{
                cursor: loading ? "default" : "pointer",
                color: loading ? "#999" : "blue",
                textDecoration: "underline",
              }}
            >
              {loading && !error && !message
                ? "Отправка..."
                : "Отправить повторно"}
            </span>
          </p>
          <p style={{ marginTop: "10px" }}>
            <Link
              to="/login"
              className="toggle-link"
              style={{ color: "coral", textDecoration: "underline" }}
            >
              Вернуться ко входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
