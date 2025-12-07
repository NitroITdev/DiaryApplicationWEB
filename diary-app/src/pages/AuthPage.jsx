import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api"; // <-- Импорт API
import "../styles/register.css";

function AuthPage() {
  const navigate = useNavigate();

  const [hasAccount, setHasAccount] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e, fromRegister = false) => {
    if (e && e.preventDefault && !fromRegister) {
      e.preventDefault();
    }
    setError(null);

    if (!email || !password) {
      setError("Заполните имя пользователя и пароль!");
      return;
    }

    try {
      await loginUser(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Ошибка входа");
    }
  };

  // const passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");

  // const isPasswordValid = (password) => {
  //     return passwordRegex.test(password);
  // };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. Регистрируем пользователя на бэкенде
      const response = await registerUser(username, email, password);
      alert(response.message || "Аккаунт создан. Проверьте почту!");

      // Перенаправление на страницу ввода кода, передавая email
      navigate("/verify", { state: { email: email } });
    } catch (err) {
      // Go-бэкенд вернет ошибку, если username или email уже заняты
      setError(err.message || "Ошибка регистрации");
    }
  };

  const toggleForm = () => {
    setHasAccount(!hasAccount);
    setError(null);
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {hasAccount ? (
          <>
            <h1>Вход</h1>
            <form onSubmit={handleLogin} className="register-form">
              <div className="register-form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="register-form-group">
                <label className="form-label">Пароль</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
              )}

              <button type="submit" className="register-btn">
                Войти
              </button>
              <p>
                Нет аккаунта?{" "}
                <span
                  className="toggle-link"
                  onClick={toggleForm}
                  style={{
                    cursor: "pointer",
                    color: "blue",
                    textDecoration: "underline",
                  }}
                >
                  Зарегистрироваться
                </span>
              </p>
            </form>
          </>
        ) : (
          <>
            <h1>Регистрация</h1>
            <form onSubmit={handleRegister} className="register-form">
              <div className="register-form-group">
                <label className="form-label">Имя пользователя</label>
                <input
                  className="form-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="register-form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="register-form-group">
                <label className="form-label">Пароль</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
              )}
              <button type="submit" className="register-btn">
                Зарегистрироваться
              </button>
              <p>
                Уже есть аккаунт?{" "}
                <span
                  className="toggle-link"
                  onClick={toggleForm}
                  style={{
                    cursor: "pointer",
                    color: "blue",
                    textDecoration: "underline",
                  }}
                >
                  Войти
                </span>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
