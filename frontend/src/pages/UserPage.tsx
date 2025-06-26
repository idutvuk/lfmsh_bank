"use client"
import { useEffect, useState } from "react"
import { getMe, getTransactions, getStatistics, type UserData, type Statistics, type Transaction } from "../services/api";
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
  ChevronDown,
} from "lucide-react"


export default function HomePage() {
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false)
  const [userData, setUserData] = useState<UserData | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const me = await getMe();
        const tx = await getTransactions();
        let stats = null;
        if (me.staff) {
          stats = await getStatistics();
        }
        setUserData(me);
        setTransactions(tx);
        setStatistics(stats);
      } catch (err) {
        console.error("Ошибка загрузки:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData().then(res => {
      console.log(res)
    })
  }, []);

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
        <div className="mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#31a4d7] mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="mx-auto">
          <div className="text-center py-8">
            <p className="text-[#d84081]">Ошибка загрузки данных пользователя</p>
          </div>
        </div>
      </div>
    )
  }

  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-3">
      <div className="w-full max-w-screen-xl mx-auto px-4 space-y-4">
        {/* Заголовок */}
        <div className="text-center py-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Банк ЛФМШ {new Date().getFullYear() - 1987 /* yeah */ }</h1>
          {userData.staff && <p className="text-gray-600 dark:text-gray-400">Добро пожаловать, {userData.name}</p>}
        </div>

        {/* Информация о пользователе */}
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {userData.staff ? "Профиль" : userData.name}
                {userData.staff && (
                  <Badge variant="secondary" className="bg-[#f3bb4c]/20 text-[#f3bb4c] border-[#f3bb4c]/30">
                    Педсостав
                  </Badge>
                )}
                {!userData.staff && (
                  <Badge variant="secondary" className="bg-[#1e99a0]/20 text-[#1e99a0] border-[#1e99a0]/30">
                    Пионер
                  </Badge>
                )}
              </div>
              {!userData.staff && (
                <Button className="bg-[#31a4d7] hover:bg-[#31a4d7]/90 ">
                  <FileText className="h-4 w-4 mr-1" />
                  Правила
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!userData.staff && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-[#1e99a0]/10 dark:bg-[#1e99a0]/20 rounded-lg">
                    <Wallet className="h-6 w-6 text-[#1e99a0]" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Баланс</p>
                      <p className="text-xl font-bold text-[#1e99a0]">{userData.balance}@</p>
                    </div>
                  </div>

                  {userData.expected_penalty > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-[#d84081]/10 dark:bg-[#d84081]/20 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-[#d84081]" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ожидаемый штраф</p>
                        <p className="text-xl font-bold text-[#d84081]">{userData.expected_penalty}@</p>
                      </div>
                    </div>
                  )}

                  {statistics && (
                    <div className="flex items-center gap-3 p-3 bg-[#31a4d7]/10 dark:bg-[#31a4d7]/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-[#31a4d7]" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Средний баланс</p>
                        <p className="text-xl font-bold text-[#31a4d7]">{statistics.avg_balance}@</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Кнопка создать перевод */}
                <Button className="w-full h-12 bg-[#1e99a0] hover:bg-[#1e99a0]/90">
                  <Send className="h-5 w-5 mr-2" />
                  Создать перевод
                </Button>
              </>
            )}

            {userData.staff && (
              <Button className="flex-1 h-12 bg-[#f3bb4c] hover:bg-[#f3bb4c]/90 text-white">
                <Users className="h-5 w-5 mr-2" />
                Пионеры
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Статистика для педсостава */}
        {userData.staff && statistics && (
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-[#31a4d7]/10 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Средний баланс</p>
                  <p className="text-2xl font-bold text-[#31a4d7]">{statistics.avg_balance}@</p>
                </div>
                <div className="text-center p-4 bg-[#1e99a0]/10 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Общий баланс</p>
                  <p className="text-2xl font-bold text-[#1e99a0]">{statistics.total_balance}@</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Действия для педсостава */}
        {userData.staff && (
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Мои транзакции</span>
                </Button>

                <Button variant="outline" className="h-16 flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Send className="h-5 w-5" />
                  <span className="text-xs">Создать перевод</span>
                </Button>

                <Button variant="outline" className="h-16 flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-xs">Отштрафовать</span>
                </Button>

                <Button variant="outline" className="h-16 flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-xs">Факультатив</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Блок посещений - только для пионеров */}
        {!userData.staff && userData.counters.length > 0 && (
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                {userData.counters.map((counter, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {getCounterLabel(counter.counter_name)}
                    </p>
                    <p className="text-lg font-bold dark:text-gray-100">
                      {counter.value}/{counter.max_value}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-[#31a4d7] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(counter.value / counter.max_value) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Последние транзакции */}
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <p className="text-xl text-black">@</p>
              Последние транзакции
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="relative">
                <div className="space-y-3">
                  {displayedTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
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
                        <span
                          className={`font-medium ${transaction.receivers[0]?.bucks >= 0 ? "text-[#1e99a0]" : "text-[#d84081]"}`}
                        >
                          {transaction.receivers[0]?.bucks >= 0 ? "+" : ""}
                          {transaction.receivers[0]?.bucks || 0}@
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gradient и кнопка развертывания для пионеров */}
                {!userData.staff && transactions.length > 2 && !showAllTransactions && (
                  <div className="relative">
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => setShowAllTransactions(true)}
                        className="rounded-full w-12 h-12 bg-[#31a4d7] hover:bg-[#31a4d7]/90 text-white p-0"
                      >
                        <ChevronDown className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
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
