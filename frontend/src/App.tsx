import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UserPage from "./pages/UserPage";
import LoginPage from "./pages/LoginPage";

const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* если не аутентифицированы — сразу на /login */}
        <Route path="/" element={
          isAuthenticated()
            ? <Navigate to="/user" replace />
            : <Navigate to="/login" replace />
        }/>

        {/* публичная страница входа */}
        <Route path="/login" element={<LoginPage />} />

        {/* приватный маршрут */}
        <Route
          path="/user"
          element={
            <PrivateRoute>
              <UserPage />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <main className="p-8 text-center">
              <h1 className="text-2xl">Страница не найдена</h1>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
