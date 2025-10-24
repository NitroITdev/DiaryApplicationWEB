import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

function AuthPage() {
  const navigate = useNavigate();

  const savedUser = JSON.parse(localStorage.getItem("user"));
  const [hasAccount, setHasAccount] = useState(!!savedUser);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Регистрация
  const handleRegister = (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      alert("Пожалуйста, заполните все поля!");
      return;
    }

    const userData = { username, email, password };
    localStorage.setItem("user", JSON.stringify(userData));

    // После регистрации сразу на главную
    navigate("/", { replace: true });
  };

  // Вход
  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Заполните email и пароль!");
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser && email === savedUser.email && password === savedUser.password) {
      // После успешного входа — на главную
      navigate("/", { replace: true });
    } else {
      alert("Неверный email или пароль");
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {hasAccount ? (
          <>
            <h1>Вход</h1>
            <form onSubmit={handleLogin} className="register-form">
              <div className="register-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="register-form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="register-btn">Войти</button>
              <p>
                Нет аккаунта?{" "}
                <span
                  className="toggle-link"
                  onClick={() => setHasAccount(false)}
                  style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
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
                <label>Имя пользователя</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="register-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="register-form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="register-btn">Зарегистрироваться</button>
              <p>
                Уже есть аккаунт?{" "}
                <span
                  className="toggle-link"
                  onClick={() => setHasAccount(true)}
                  style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
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
