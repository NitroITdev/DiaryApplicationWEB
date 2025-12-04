import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/about.css"


function About() {
    const navigate = useNavigate();
    return (
        <div className="about-container">
            <div className="about-card">
                <h1>О нас</h1>
                <p>
                    Этот сайт создан студентами специальности 
                    <strong> Программная инженерия</strong>
                </p>
                <p>
                    Наша задача создать удобный и приятный в использовании сайт для веденния личного дневника.
                </p>
                <p>
                    Создатели:
                    Щербина Никита,
                    Камилжанов Жахонгир
                </p>
                <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>

            </div>
        </div>
    )
}

export default About;