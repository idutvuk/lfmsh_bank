"use client"
import { useEffect, useState } from "react"
import { getUserByUsername, getMe, type UserData } from "../services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Background } from "@/components/Background"
import { Navbar } from "@/components/Navbar"
import { Loading } from "@/components/loading"
import { PioneerInfoCard } from "@/components/PioneerInfoCard"
import { useNavigate, useParams } from "react-router-dom"

export default function UserProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { username } = useParams<{ username: string }>()

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return
      
      setLoading(true)
      try {
        const [user, me] = await Promise.all([
          getUserByUsername(username),
          getMe()
        ])
 
        setUserData(user)
        setCurrentUser(me)
      } catch (err) {
        console.error("Ошибка загрузки данных пользователя:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [username])

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

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  const handleReward = () => {
    // Navigate to create transaction page with reward type and recipient
    navigate(`/create-transfer?type=general&recipient=${userData?.username}`)
  }

  const handlePenalty = () => {
    // Navigate to create transaction page with fine type and recipient
    navigate(`/create-transfer?type=fine&recipient=${userData?.username}`)
  }
  
  // Handle avatar changes
  const handleAvatarChange = (updatedUser: UserData) => {
    setUserData(updatedUser)
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!userData || !currentUser) {
    return (
      <div className="min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Ошибка загрузки данных пользователя</p>
        </div>
      </div>
    )
  }

  // Определяем контекст просмотра
  const isOwnProfile = currentUser.username === userData.username
  const isStaffViewing = currentUser.staff && !isOwnProfile

  return (
    <Background>
      <Navbar
        showBackButton={true}
        showRulesButton={true}
        showSearch={true}
        isStaff={currentUser.staff}
        customTitle={"."}
        onLogout={handleLogout}
      />

      <div className="w-full max-w-4xl mx-auto py-6 space-y-4 min-h-[100dvh]">

        {/* User info */}
        <PioneerInfoCard 
          userData={userData} 
          onNavigate={handleNavigate}
          isOwnProfile={isOwnProfile}
          isStaffViewing={isStaffViewing}
          onReward={handleReward}
          onPenalty={handlePenalty}
          onAvatarChange={handleAvatarChange}
        />

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