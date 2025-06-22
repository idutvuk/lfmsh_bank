"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Wallet,
  TrendingUp,
  Send,
  AlertTriangle,
  BookOpen,
  Users,
  FileText,
  Calendar,
  DollarSign,
} from "lucide-react"

interface Counter {
  counter_name: string
  value: number
  max_value: number
}

interface UserData {
  username: string
  name: string
  staff: boolean
  balance: number
  expected_penalty: number
  counters: Counter[]
}

interface Statistics {
  avg_balance: number
  total_balance: number
}

interface Transaction {
  id: number
  author: string
  description: string
  type: string
  status: string
  date_created: string
  receivers: Array<{
    username: string
    bucks: number
    certs: number
    lab: number
    lec: number
    sem: number
    fac: number
  }>
}

export default function HomePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Симуляция загрузки данных с API
    const fetchData = async () => {
      try {
        // Симулируем данные пользователя
        const mockUserData: UserData = {
          username: "petya.ivanov",
          name: "Пётр Иванов",
          staff: true,
          balance: 120.5,
          expected_penalty: 10,
          counters: [
            { counter_name: "lab", value: 2, max_value: 3 },
            { counter_name: "lec", value: 5, max_value: 10 },
          ],
        }

        const mockStatistics: Statistics = {
          avg_balance: 75.32,
          total_balance: 43210.5,
        }

        const mockTransactions: Transaction[] = [
          {
            id: 123,
            author: "staff.member",
            description: "Бонус за экзамен",
            type: "exam",
            status: "created",
            date_created: "2025-06-21T12:34:56Z",
            receivers: [
              {
                username: "ivan.petrov",
                bucks: 50,
                certs: 0,
                lab: 0,
                lec: 0,
                sem: 0,
                fac: 0,
              },
            ],
          },
        ]

        setUserData(mockUserData)
        setStatistics(mockStatistics)
        setTransactions(mockTransactions)
      } catch (error) {
        console.error("Ошибка загрузки данных:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getCounterLabel = (counterName: string) => {
    const labels: Record<string, string> = {
      lab: "Лабораторные",
      lec: "Лекции",
      sem: "Семинары",
      fac: "Факультативы",
    }
    return labels[counterName] || counterName
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600">Ошибка загрузки данных пользователя</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Банк ЛФМШ</h1>
          <p className="text-gray-600">Добро пожаловать, {userData.name}</p>
        </div>

        {/* Информация о пользователе */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Профиль
              {userData.staff && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Педсостав
                </Badge>
              )}
              {!userData.staff && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Пионер
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Wallet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Баланс</p>
                  <p className="text-2xl font-bold text-green-600">{userData.balance} @</p>
                </div>
              </div>

              {userData.expected_penalty > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Ожидаемый штраф</p>
                    <p className="text-2xl font-bold text-red-600">{userData.expected_penalty} @</p>
                  </div>
                </div>
              )}

              {statistics && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Средний баланс</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.avg_balance} @</p>
                  </div>
                </div>
              )}
            </div>

            {/* Счетчики посещений */}
            {userData.counters.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Посещения</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {userData.counters.map((counter, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">{getCounterLabel(counter.counter_name)}</p>
                      <p className="text-lg font-bold">
                        {counter.value}/{counter.max_value}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(counter.value / counter.max_value) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Действия */}
        <Card>
          <CardHeader>
            <CardTitle>Действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Общие действия */}
              <Button variant="outline" className="h-20 flex-col gap-2 bg-white text-gray-700">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Мои транзакции</span>
              </Button>

              <Button variant="outline" className="h-20 flex-col gap-2 bg-white text-gray-700">
                <Send className="h-6 w-6" />
                <span className="text-sm">Создать перевод</span>
              </Button>

              {/* Действия для педсостава */}
              {userData.staff && (
                <>
                  <Button variant="outline" className="h-20 flex-col gap-2 bg-white text-gray-700">
                    <AlertTriangle className="h-6 w-6" />
                    <span className="text-sm">Отштрафовать</span>
                  </Button>

                  <Button variant="outline" className="h-20 flex-col gap-2 bg-white text-gray-700">
                    <BookOpen className="h-6 w-6" />
                    <span className="text-sm">Факультатив</span>
                  </Button>

                  <Button variant="outline" className="h-20 flex-col gap-2 bg-white text-gray-700">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Пионеры</span>
                  </Button>
                </>
              )}

              {/* Действия для пионеров */}
              {!userData.staff && (
                <Button variant="outline" className="h-20 flex-col gap-2 bg-white text-gray-700">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Правила</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Последние транзакции */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Последние транзакции
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">от {transaction.author}</p>
                      </div>
                      <Badge variant={transaction.status === "created" ? "secondary" : "default"}>
                        {transaction.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(transaction.date_created)}
                      </span>
                      <span className="font-medium text-green-600">+{transaction.receivers[0]?.bucks || 0} @</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Транзакций пока нет</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
