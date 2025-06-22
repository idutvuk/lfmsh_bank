import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UserPage from "./pages/UserPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Перенаправление с корня на /user */}
        <Route path="/" element={<Navigate to="/user" replace />} />

        {/* Основной маршрут страницы пользователя */}
        <Route path="/user" element={<UserPage />} />

        {/* Необязательно: «404» для всех прочих путей */}
        <Route
          path="*"
          element={
            <main>
              <h1>Страница не найдена</h1>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
