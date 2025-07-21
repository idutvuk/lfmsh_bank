"use client"
import { useEffect, useState } from "react"
import { getUsers, getAvatarUrl, type UserListItem } from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Background } from "@/components/Background"
import { Navbar } from "@/components/Navbar"
import { Loading } from "@/components/loading"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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

  const handleUserClick = (username: string) => {
    navigate(`/user/${username}`);
  };

  // Get initial letters for avatar fallback
  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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
              key={user.username}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-gray-50/50"
              onClick={() => handleUserClick(user.username)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(user.username, 'small')} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
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