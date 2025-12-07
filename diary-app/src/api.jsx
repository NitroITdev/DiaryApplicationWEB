const API_BASE_URL = "http://localhost:8080"; // Порт Go-сервера
// const API_BASE_URL = "https://qf99w7q1-8080.euw.devtunnels.ms/";
// const API_BASE_URL = "https://acutely-triforial-susannah.ngrok-free.dev/";
// --- Функции аутентификации ---

export const registerUser = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    // Получаем текст ошибки, если доступен
    const errorText = await response.text();
    throw new Error(errorText || "Ошибка регистрации");
  }

  return response.json();
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Отправляем значение email под ключом 'username', как ожидает Go API
    body: JSON.stringify({ username: email, password }),
  });

  if (!response.ok) {
    throw new Error("Неверное имя пользователя или пароль");
  }

  const data = await response.json();

  // Сохраняем JWT-токен
  localStorage.setItem("authToken", data.token);

  return data;
};

// --- Вспомогательная функция для защищенных запросов ---

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// --- Функции для заметок (CRUD) ---

export const getNotes = async () => {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    // Обработка истечения токена
    localStorage.removeItem("authToken");
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Ошибка получения заметок");
  }

  return response.json();
};

export const createNote = async (noteData) => {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(noteData),
  });

  if (!response.ok) {
    throw new Error("Ошибка создания заметки");
  }

  return response.json();
};

// Функция для обновления заметки
export const updateNoteApi = async (noteId, noteData) => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(noteData),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!response.ok) {
    // Go-бэкенд возвращает 404, если заметка не найдена/не принадлежит пользователю
    if (response.status === 404) {
      throw new Error("Note not found or access denied");
    }
    throw new Error("Failed to update note");
  }

  // Бэкенд Go возвращает обновленную заметку (models.Note)
  return response.json();
};

export const deleteNoteApi = async (noteId) => {
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Ошибка удаления заметки");
  }

  // Удаление обычно возвращает 204 No Content
  return;
};

export const logoutUser = () => {
  localStorage.removeItem("authToken");
  window.location.href = "/auth";
};
