import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UserPage from "./pages/UserPage";
import UserProfilePage from "./pages/UserProfilePage";
import PioneersPage from "./pages/PioneersPage";
import LoginPage from "./pages/LoginPage";
import RulesPage from "./pages/RulesPage";
import CreateTransactionPage from "./pages/CreateTransactionPage";
import SeminarPage from "./pages/SeminarPage";
import {ThemeProvider} from "@/ThemeProvider.tsx";

const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <BrowserRouter>
      <Routes>
        {/* Redirect to user page or login based on authentication status */}
        <Route 
          path="/" 
          element={
            isAuthenticated() 
              ? <Navigate to="/user" replace /> 
              : <Navigate to="/login" replace />
          }
        />

        {/* Public login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Private routes */}
        <Route
          path="/user"
          element={
            <PrivateRoute>
              <UserPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/rules"
          element={
            <PrivateRoute>
              <RulesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/create-transfer"
          element={
            <PrivateRoute>
              <CreateTransactionPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/create-transaction"
          element={
            <PrivateRoute>
              <CreateTransactionPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/user/:username"
          element={
            <PrivateRoute>
              <UserProfilePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/pioneers"
          element={
            <PrivateRoute>
              <PioneersPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/seminar"
          element={
            <PrivateRoute>
              <SeminarPage />
            </PrivateRoute>
          }
        />

        {/* 404 page */}
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
  </ThemeProvider>
  );
}
