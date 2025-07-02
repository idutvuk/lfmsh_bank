import { Card, CardContent } from "@/components/ui/card"
import { type Statistics } from "@/services/api"

interface StatisticsCardProps {
  statistics: Statistics
}

export function StatisticsCard({ statistics }: StatisticsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#31a4d7]/10 border-0 shadow-0">
            <CardContent className="text-center p-4">
              <p className="text-sm text-muted-foreground mb-1">Средний баланс</p>
              <p className="text-2xl font-bold text-[#31a4d7]">{statistics.avg_balance}@</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1e99a0]/10 border-0 shadow-0">
            <CardContent className="text-center p-4">
              <p className="text-sm text-muted-foreground mb-1">Общий баланс</p>
              <p className="text-2xl font-bold text-[#1e99a0]">{statistics.total_balance}@</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
} 