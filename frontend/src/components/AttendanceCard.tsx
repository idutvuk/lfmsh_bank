import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { type UserData } from "@/services/api"

interface AttendanceCardProps {
  userData: UserData
}

export function AttendanceCard({ userData }: AttendanceCardProps) {
  const getCounterLabel = (counterName: string) => {
    const labels: Record<string, string> = {
      lab: "Лабораторные",
      lec: "Лекции",
      sem: "Семинары",
      fac: "Факультативы",
    }
    return labels[counterName] || counterName
  }

  if (!userData.staff && userData.counters.length === 0) {
    return null
  }

  return (
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
  )
} 