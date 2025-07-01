"use client"
import { useEffect, useState } from "react"
import { getUserById, type UserData } from "../services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Background } from "@/components/Background"
import { Navbar } from "@/components/Navbar"
import { Loading } from "@/components/loading"
import { User, Wallet, AlertTriangle, TrendingUp } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return
      
      setLoading(true)
      try {
        const user = await getUserById(parseInt(userId))
        setUserData(user)
      } catch (err) {
        console.error("Ошибка загрузки данных пользователя:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [userId])

  const getCounterLabel = (counterName: string) => {
    const labels: Record<string, string> = {
      lab: "Лабораторные",
      lec: "Лекции",
      sem: "Семинары",
      fac: "Факультативы",
    }
    return labels[counterName] || counterName
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    navigate("/login", { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Ошибка загрузки данных пользователя</p>
        </div>
      </div>
    )
  }

  return (
    <Background>
      <Navbar
        showBackButton={true}
        showRulesButton={true}
        isStaff={true}
        customTitle={`Профиль: ${userData.name}`}
        onLogout={handleLogout}
      />

      <div className="w-full max-w-4xl mx-auto py-6 space-y-4 min-h-[100dvh]">

        {/* User info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {userData.name}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
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

              <Card className="bg-[#31a4d7]/10 border-0 shadow-none">
                <CardContent className="flex items-center gap-3 p-3">
                  <TrendingUp className="h-6 w-6 text-[#31a4d7]" />
                  <div>
                    <p className="text-sm text-muted-foreground">Логин</p>
                    <p className="text-xl font-bold text-[#31a4d7]">{userData.username}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Counters */}
        {userData.counters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Посещаемость</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData.counters.map((counter, idx) => (
                  <div key={idx} className="space-y-1 max-w-md mx-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{getCounterLabel(counter.counter_name)}</span>
                      <span className="text-sm font-medium">
                        {counter.value}/{counter.max_value}
                      </span>
                    </div>
                    <Progress
                      value={(counter.value / counter.max_value) * 100}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Background>
  )
} 