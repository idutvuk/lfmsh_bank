// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Background } from "@/components/Background";
import { login } from "@/services/api";
import { useTheme } from "@/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const data = await login(username, password);
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);
      navigate("/user", { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Не удалось подключиться к серверу");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
      <Background className="flex flex-col items-center justify-center p-4 min-h-screen" navbar={null}>
      <Card className="w-full max-w-sm relative">
        <Button
          variant="text"
          size="icon"
          onClick={toggleTheme}
          className="absolute top-2 right-2 z-10"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <CardHeader>
          <CardTitle className="text-center">Вход в Банк ЛФМШ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Входим..." : "Войти"}
            </Button>

            <div className="text-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="text" className="text-sm">
                    Забыли пароль?
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-2xl p-0 bg-transparent">
                  <div className="relative">
                    <AlertDialogCancel asChild>
                      <Button 
                        variant="text" 
                        size="icon"
                        className="absolute top-2 right-2 z-10 bg-transparent border-0 shadow-0"
                      >
                        ✕
                      </Button>
                    </AlertDialogCancel>
                    <video 
                      autoPlay
                      loop
                      className="w-full rounded-lg"
                      src="/src/assets/hahaha.mp4"
                    >
                      Ваш браузер не поддерживает видео.
                    </video>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </Background>
  );
}
