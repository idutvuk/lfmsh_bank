"use client"
import { useEffect, useState } from "react"
import { getMe, getTransactions, getStatistics, type UserData, type Statistics, type Transaction } from "../services/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import {
  User,
  Wallet,
  TrendingUp,
  Send,
  AlertTriangle,
  BookOpen,
  Users,
  FileText,
  ChevronDown,
} from "lucide-react"
import { useNavigate } from "react-router-dom";
import { TransactionItem } from "@/components/TransactionItem";
import { Navbar } from "@/components/Navbar";


export default function UserPage() {
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false)
  const [userData, setUserData] = useState<UserData | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    fetchData();
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

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Загрузка...</p>
        </div>
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

  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 3)

  return (
      <div className="min-h-screen w-full items-center justify-center bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px]">
      {/* Header */}
      <Navbar 
        showRulesButton={true}
        isStaff={userData.staff}
        onLogout={handleLogout}
      />

      <div className="w-full max-w-250 mx-auto py-6 space-y-4 min-h-[100dvh]">
        {/* User info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {userData.staff ? "Профиль" : userData.name}
              </div>

            </CardTitle>
          </CardHeader>
          <CardContent>
            {!userData.staff && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  <Card className="bg-[#1e99a0]/10 shadow">
                    <CardContent className="flex items-center gap-3 p-3">
                      <Wallet className="h-6 w-6 text-[#1e99a0]" />
                      <div>
                        <p className="text-sm text-[#1e99a0]  font-bold">Баланс</p>
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

                  {statistics && (
                    <Card className="bg-[#31a4d7]/10 border-0 shadow-none">
                      <CardContent className="flex items-center gap-3 p-3">
                        <TrendingUp className="h-6 w-6 text-[#31a4d7]" />
                        <div>
                          <p className="text-sm text-muted-foreground">Средний баланс</p>
                          <p className="text-xl font-bold text-[#31a4d7]">{statistics.avg_balance}@</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Create transfer button */}
                <Button
                  className="w-full h-12 "
                  onClick={() => navigate('/create-transfer')}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Создать перевод
                </Button>
              </>
            )}

            {userData.staff && (
              <Button className="h-12 w-full bg-[#f3bb4c] hover:bg-[#f3bb4c]/90">
                <Users className="h-5 w-5 mr-2" />
                Пионеры
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Staff statistics */}
        {userData.staff && statistics && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-[#31a4d7]/10">
                  <CardContent className="text-center p-4">
                    <p className="text-sm text-muted-foreground mb-1">Средний баланс</p>
                    <p className="text-2xl font-bold text-[#31a4d7]">{statistics.avg_balance}@</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#1e99a0]/10">
                  <CardContent className="text-center p-4">
                    <p className="text-sm text-muted-foreground mb-1">Общий баланс</p>
                    <p className="text-2xl font-bold text-[#1e99a0]">{statistics.total_balance}@</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff actions */}
        {userData.staff && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="neutral" className="h-16 flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Мои транзакции</span>
                </Button>

                <Button
                  variant="neutral"
                  className="h-16 flex-col gap-2"
                  onClick={() => navigate('/create-transfer')}
                >
                  <Send className="h-5 w-5" />
                  <span className="text-xs">Создать перевод</span>
                </Button>

                <Button variant="neutral" className="h-16 flex-col gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-xs">Отштрафовать</span>
                </Button>

                <Button
                  variant="noShadow"
                  className="h-16 flex-col gap-2"
                  onClick={() => navigate('/rules')}
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="text-xs">Правила</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {userData.staff ? "Мои транзакции" : "Последние транзакции"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayedTransactions.map(transaction => (
                <TransactionItem key={transaction.id} {...transaction} />
              ))}
            </CardContent>
            {transactions.length > 3 && (
              <CardFooter>
                <Button
                  variant="neutral"
                  className="w-full flex items-center justify-center"
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                >
                  {showAllTransactions ? "Скрыть" : "Показать все"}
                  <ChevronDown className={`h-5 w-5 ml-1 transition-transform ${showAllTransactions ? "rotate-180" : ""}`} />
                </Button>
              </CardFooter>
            )}
          </Card>
        )}

        {/* Counters */}
        {!userData.staff && userData.counters.length > 0 && (
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
    </div>
  )
}
