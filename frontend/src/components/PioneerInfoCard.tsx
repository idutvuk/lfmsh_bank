import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Wallet, AlertTriangle, TrendingUp, Send, Plus, Minus } from "lucide-react"
import { type UserData, type Statistics } from "@/services/api"

interface PioneerInfoCardProps {
  userData: UserData
  statistics: Statistics | null
  onNavigate: (path: string) => void
  isOwnProfile?: boolean
  isStaffViewing?: boolean
  onReward?: () => void
  onPenalty?: () => void
}

export function PioneerInfoCard({ 
  userData, 
  statistics, 
  onNavigate, 
  isOwnProfile = false,
  isStaffViewing = false,
  onReward,
  onPenalty
}: PioneerInfoCardProps) {
  const showCreateTransaction = isOwnProfile
  const showStaffButtons = isStaffViewing && !isOwnProfile

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {userData.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <Card className="bg-[#1e99a0]/10 shadow border-0 shadow-0">
            <CardContent className="flex items-center gap-3 p-3">
              <Wallet className="h-6 w-6 text-[#1e99a0]" />
              <div>
                <p className="text-sm text-[#1e99a0] font-bold">Баланс</p>
                <p className="text-xl font-bold text-[#1e99a0]">{userData.balance}@</p>
              </div>
            </CardContent>
          </Card>

          {userData.expected_penalty > 0 && (
            <Card className="bg-[#d84081]/10 border-0 shadow-0">
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

        {showCreateTransaction && (
          <Button
            className="w-full h-12"
            onClick={() => onNavigate('/create-transfer')}
          >
            <Send className="h-5 w-5 mr-2" />
            Создать транзакцию
          </Button>
        )}

        {showStaffButtons && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-12"
              onClick={onReward}
              variant="default"
            >
              <Plus className="h-5 w-5 mr-2" />
              Начислить
            </Button>
            <Button
              className="h-12"
              onClick={onPenalty}
              variant="destructive"
            >
              <Minus className="h-5 w-5 mr-2" />
              Отштрафовать
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 