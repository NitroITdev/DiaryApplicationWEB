
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DiaryPage from "./pages/DiaryPage";
import AuthPage from "./pages/AuthPage";

function App() {
  const user = localStorage.getItem("user");

  return (
    <Router>
      <Routes>
        {/* Главная страница доступна только если есть пользователь */}
        <Route
          path="/"
          element={user ? <DiaryPage /> : <Navigate to="/auth" replace />}
        />

        {/* Страница регистрации / входа */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Все остальные маршруты → главная или авторизация */}
        <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
