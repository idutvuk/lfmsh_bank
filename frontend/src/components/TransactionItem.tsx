import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Check, X, AlertCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Receiver = {
  username: string;
  bucks: number;
  certs: number;
  lab: number;
  lec: number;
  sem: number;
  fac: number;
}

type TransactionProps = {
  id: number;
  description: string;
  author: string;
  date_created: string;
  status: string;
  receivers: Receiver[];
}

export function TransactionItem({ id, description, author, date_created, status, receivers }: TransactionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = () => {
    switch(status) {
      case "processed":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                  <Check className="h-4 w-4 text-green-600" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Эта транзакция одобрена Банкиром</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "declined":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                  <X className="h-4 w-4 text-red-600" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Эта транзакция отменена и не учитывается</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Эта транзакция ожидает одобрения Банкиром</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
    }
  }

  return (
    <Card className="bg-card">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className={`font-medium ${status === 'declined' ? 'line-through text-muted-foreground' : ''}`}>
              {description}
            </p>
            <p className="text-sm text-muted-foreground">от {author}</p>
          </div>
          {getStatusIcon()}
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(date_created)}
          </span>
          <span
            className={`font-medium ${status === 'declined' 
              ? 'text-muted-foreground line-through' 
              : receivers[0]?.bucks >= 0 
                ? "text-[#1e99a0]" 
                : "text-[#d84081]"}`}
          >
            {receivers[0]?.bucks >= 0 ? "+" : ""}
            {receivers[0]?.bucks || 0}@
          </span>
        </div>
      </CardContent>
    </Card>
  )
} 