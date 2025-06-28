"use client"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getUserById, type UserData } from "../services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Background } from "@/components/Background"
import { Navbar } from "@/components/Navbar"
import { User, Wallet, AlertTriangle, ArrowLeft } from "lucide-react"

export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError("ID пользователя не указан")
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const user = await getUserById(parseInt(userId))
        setUserData(user)
      } catch (err) {
        console.error("Ошибка загрузки пользователя:", err)
        setError("Не удалось загрузить данные пользователя")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  if (loading) {
    return (
      <Background>
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Загрузка профиля...</p>
          </div>
        </div>
      </Background>
    )
  }

  if (error || !userData) {
    return (
      <Background>
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || "Пользователь не найден"}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </div>
        </div>
      </Background>
    )
  }

  return (
    <Background>
      <Navbar
        showBackButton={true}
        title={`Профиль ${userData.name}`}
      />

      <div className="w-full max-w-250 mx-auto py-6 space-y-4 min-h-[100dvh]">
        {/* User info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {userData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Card className="bg-[#1e99a0]/10 shadow">
                <CardContent className="flex items-center gap-3 p-3">
                  <Wallet className="h-6 w-6 text-[#1e99a0]" />
                  <div>
                    <p className="text-sm text-[#1e99a0] font-bold">Баланс</p>
                    <p className="text-xl font-bold text-[#1e99a0]">{userData.balance}@</p>
                  </div>
                </CardContent>
              </Card>

              {userData.expected_penalty > 0 && (
                <Card className="bg-[#d84081]/10">
                  <CardContent className="flex items-center gap-3 p-3">
                    <AlertTriangle className="h-6 w-6 text-[#d84081]" />
                    <div>
                      <p className="text-sm text-[#d84081] font-bold">Ожидаемый штраф</p>
                      <p className="text-xl font-bold text-[#d84081]">{userData.expected_penalty}@</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Counters */}
            {userData.counters && userData.counters.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Счетчики</h3>
                <div className="grid grid-cols-2 gap-3">
                  {userData.counters.map((counter) => (
                    <Card key={counter.counter_name} className="bg-gray-50/50">
                      <CardContent className="p-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          {counter.counter_name}
                        </p>
                        <p className="text-lg font-bold">
                          {counter.value}/{counter.max_value}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Staff info */}
            {userData.staff && (
              <div className="mt-4 p-3 bg-blue-50/50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">
                  👨‍💼 Сотрудник
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Background>
  )
} 