import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Users, Edit } from "lucide-react"

interface StaffInfoCardProps {
  onNavigate: (path: string) => void
}

export function StaffInfoCard({ onNavigate }: StaffInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Профиль
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="h-12 w-full bg-[#f3bb4c] hover:bg-[#f3bb4c]/90"
          onClick={() => onNavigate('/pioneers')}
        >
          <Users className="h-5 w-5 mr-2" />
          Пионеры
        </Button>
        
        <Button 
          className="h-12 w-full"
          onClick={() => onNavigate('/create-transfer')}
        >
          <Edit className="h-5 w-5 mr-2" />
          Создать транзакцию
        </Button>
      </CardContent>
    </Card>
  )
} 