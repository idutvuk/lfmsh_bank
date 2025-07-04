"use client"
import { useEffect, useState } from "react"
import { getUsers, type UserListItem } from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Background } from "@/components/Background"
import { Navbar } from "@/components/Navbar"
import { Loading } from "@/components/loading"
import { User } from "lucide-react"
import { useNavigate } from "react-router-dom";

export default function PioneersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersData = await getUsers();
        // Фильтруем только пионеров (не staff)
        const pioneers = usersData.filter(user => !user.staff);
        setUsers(pioneers);
      } catch (err) {
        console.error("Ошибка загрузки пользователей:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserClick = (userId: number) => {
    navigate(`/user/${userId}`);
  };



  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <Background>
      <Navbar
        showBackButton={true}
        showRulesButton={true}
        isStaff={true}
        customTitle="Список пионеров"
        onLogout={() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          navigate("/login", { replace: true });
        }}
      />

      <div className="w-full max-w-4xl mx-auto py-6 space-y-4 min-h-[100dvh]">

        {/* Users grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card
              key={user.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-gray-50/50"
              onClick={() => handleUserClick(user.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {user.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Логин:</span>
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Отряд:</span>
                  <span className="text-sm font-medium">{user.party}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Баланс:</span>
                  <span className="text-sm font-bold text-[#1e99a0]">{user.balance}@</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Пионеры не найдены
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Background>
  )
} 