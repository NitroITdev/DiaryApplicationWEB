import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/about.css";

function HowToStart() {
    const navigate = useNavigate();
    return (
        <div className="about-container">
            <div className="about-card">
                <h1>Как начать?</h1>

                <h2>1. Зарегистрируйтесь на сайте</h2>
                <p>Введите свою почту, придумайте никнейм и пароль — этого достаточно, чтобы начать.</p>

                <h2>2. Создайте первую запись</h2>
                <p>Вы можете добавить заметку на сегодняшний день или любую другую дату — прошедшую или будущую.</p>

                <h2>3. Запишите свои мысли</h2>
                <p>DiaryApp позволяет удобно добавлять, фильтровать и удалять заметки. Вы можете структурировать свои мысли, отслеживать настроение и вести личный дневник в простом и стильном интерфейсе.</p>

                <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>
            </div>
        </div>
    );
}

export default HowToStart;
