"use client"
import { useEffect, useState } from "react"
import { getMe, type UserData } from "../services/api"
import { Loading } from "@/components/loading"
import PioneerPage from "./PioneerPage"
import StaffPage from "./StaffPage"

export default function UserPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const me = await getMe()
        setUserData(me)
      } catch (err) {
        console.error("Ошибка загрузки:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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

  return userData.staff ? <StaffPage /> : <PioneerPage />
}
