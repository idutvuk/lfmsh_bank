"use client"
import { useEffect, useState } from "react"
import { getMe, getTransactions, getStatistics, declineTransaction, processTransaction, type UserData, type Statistics, type Transaction } from "../services/api"
import { Background } from "@/components/Background"
import { Navbar } from "@/components/Navbar"
import { Loading } from "@/components/loading"
import { StaffInfoCard } from "@/components/StaffInfoCard"
import { StatisticsCard } from "@/components/StatisticsCard"
import { TransactionsCard } from "@/components/TransactionsCard"
import { useNavigate } from "react-router-dom"

export default function StaffPage() {
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
        const stats = await getStatistics()
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
  
  // Handle avatar changes
  const handleAvatarChange = (updatedUser: UserData) => {
    setUserData(updatedUser)
  }

  // Handle transaction actions
  const handleTransactionCancel = async (transactionId: number) => {
    try {
      await declineTransaction(transactionId)
      // Refresh transactions list
      const updatedTransactions = await getTransactions()
      setTransactions(updatedTransactions)
    } catch (error) {
      console.error("Error cancelling transaction:", error)
      // TODO: Show error toast
    }
  }

  const handleTransactionEdit = async (transactionId: number) => {
    // TODO: Navigate to edit transaction page
    console.log("Edit transaction", transactionId)
    navigate(`/create-transaction?edit=${transactionId}`)
  }

  const handleTransactionDuplicate = async (transactionId: number) => {
    // TODO: Navigate to create transaction page with prefilled data
    console.log("Duplicate transaction", transactionId)
    navigate(`/create-transaction?duplicate=${transactionId}`)
  }

  const handleTransactionApprove = async (transactionId: number) => {
    try {
      await processTransaction(transactionId)
      // Refresh transactions list
      const updatedTransactions = await getTransactions()
      setTransactions(updatedTransactions)
    } catch (error) {
      console.error("Error approving transaction:", error)
      // TODO: Show error toast
    }
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
          showSearch={true}
          showTheme={true}
          isStaff={userData.staff}
          onLogout={handleLogout}
        />
      }
      className="px-2"
    >
      <div className="w-full max-w-250 mx-auto py-6 space-y-4 min-h-[100dvh]">
        <StaffInfoCard
          onNavigate={handleNavigate} 
          userData={userData}
          onAvatarChange={handleAvatarChange}
        />

        {statistics && <StatisticsCard statistics={statistics} />}

        <TransactionsCard 
          transactions={transactions} 
          isStaff={userData.staff}
          currentUser={userData.username}
          onTransactionCancel={handleTransactionCancel}
          onTransactionEdit={handleTransactionEdit}
          onTransactionDuplicate={handleTransactionDuplicate}
          onTransactionApprove={handleTransactionApprove}
        />
      </div>
    </Background>
  )
} 