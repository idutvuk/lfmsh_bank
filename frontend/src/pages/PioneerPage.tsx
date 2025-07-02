"use client"
import { useEffect, useState } from "react"
import { getMe, getTransactions, getStatistics, type UserData, type Statistics, type Transaction } from "../services/api"
import { Background } from "@/components/Background"
import { Navbar } from "@/components/Navbar"
import { Loading } from "@/components/loading"
import { PioneerInfoCard } from "@/components/PioneerInfoCard"
import { TransactionsCard } from "@/components/TransactionsCard"
import { AttendanceCard } from "@/components/AttendanceCard"
import { useNavigate } from "react-router-dom"

export default function PioneerPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const me = await getMe()
        const tx = await getTransactions()
        let stats = null
        if (me.staff) {
          stats = await getStatistics()
        }
        setUserData(me)
        setTransactions(tx)
        setStatistics(stats)
      } catch (err) {
        console.error("Ошибка загрузки:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    navigate("/login", { replace: true })
  }

  const handleNavigate = (path: string) => {
    navigate(path)
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
    <Background
      navbar={
        <Navbar
          showRulesButton={true}
          isStaff={userData.staff}
          onLogout={handleLogout}
        />
      }
      className="px-2"
    >
      <div className="w-full max-w-250 mx-auto py-6 space-y-4 min-h-[100dvh]">
        <PioneerInfoCard 
          userData={userData} 
          statistics={statistics} 
          onNavigate={handleNavigate}
          isOwnProfile={true}
        />
        <TransactionsCard 
          transactions={transactions} 
          isStaff={userData.staff} 
        />
        <AttendanceCard userData={userData} />
      </div>
    </Background>
  )
} 