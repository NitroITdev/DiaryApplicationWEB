import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import DiaryPage from "./pages/DiaryPage";
import AuthPage from "./pages/AuthPage";
import Functions from "./pages/Functions";
import WhyJournal from "./pages/WhyJournal";
import HowToStart from "./pages/HowToStart";
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

        <Route path="/about" element={<About />} />

        <Route path="/why-journal" element={<WhyJournal />} />

        <Route path="/how-to-start" element={<HowToStart />} />

        <Route path="/functions" element={<Functions />} />


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
