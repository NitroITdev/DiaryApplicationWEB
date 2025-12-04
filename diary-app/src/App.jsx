import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DiaryPage from "./pages/DiaryPage";
import AuthPage from "./pages/AuthPage";
import About from "./pages/About";
import VerificationPage from "./pages/VerificationPage";

function App() {
  const authToken = localStorage.getItem("authToken");

  return (
    <Router>
      <Routes>
        {/* Главная страница доступна только если есть токен */}
        <Route
          path="/"
          element={authToken ? <DiaryPage /> : <Navigate to="/auth" replace />}
        />

        {/* Страница регистрации / входа (если уже есть токен, перенаправляем на главную) */}
        <Route
          path="/auth"
          element={authToken ? <Navigate to="/" replace /> : <AuthPage />}
        />

        {/* МАРШРУТ ВЕРИФИКАЦИИ */}
        <Route path="/verify" element={<VerificationPage />} />

        {/* Страница информации о нас */}
        <Route path="/about" element={<About />} />

        {/* Все остальные маршруты → главная или авторизация */}
        <Route
          path="*"
          element={<Navigate to={authToken ? "/" : "/auth"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
