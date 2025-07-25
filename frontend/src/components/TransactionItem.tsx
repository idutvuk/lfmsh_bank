import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAvatarUrl } from "@/services/api"
import { getPartyBorderClass } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Link } from "react-router-dom"
import { TransactionViewDialog } from "./TransactionViewDialog"
import { useState } from "react"

// Added currentUser prop to know who is logged in
type Receiver = {
  username: string
  bucks: number
  certs: number
  lab: number
  lec: number
  sem: number
  fac: number
}

type TransactionProps = {
  id: number
  description: string
  author: string
  date_created: string
  status: string
  type: string
  receivers: Receiver[]
  currentUser: string
  isStaff?: boolean
  onCancel?: (transactionId: number) => void
  onEdit?: (transactionId: number) => void
  onDuplicate?: (transactionId: number) => void
  onApprove?: (transactionId: number) => void
}



export function TransactionItem({
  id,
  description,
  author,
  status,
  receivers,
  currentUser,
  type,
  date_created,
  isStaff = false,
  onCancel,
  onEdit,
  onDuplicate,
  onApprove,
}: TransactionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  // Заглушка: вычисляем party по первой букве username автора
  const authorParty = (author.charCodeAt(0) % 4) + 1;

  const getStatusIcon = () => {
    switch (status) {
      case "processed":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Check className="h-5 w-5 text-green-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Эта транзакция одобрена Банкиром</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "declined":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <X className="h-5 w-5 text-red-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Эта транзакция отменена и не учитывается</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      default:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Ожидает одобрения Банкиром</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
    }
  }

  const bucks = receivers[0]?.bucks ?? 0
  const bucksClass =
    (status === "declined" || status === "substituted")
      ? "text-muted-foreground line-through"
      : bucks >= 0
      ? "text-teal-600"
      : "text-pink-600"

  // Style for transaction text when declined or substituted
  const transactionTextClass = (status === "declined" || status === "substituted") && isStaff ? "line-through text-muted-foreground" : ""

  // Не показываем получателей, если их только один и это текущий пользователь или если получателей больше 3
  const showReceivers =
    receivers.length <= 3 && (receivers.length > 1 || receivers[0]?.username !== currentUser)

  // Получатели после стрелки
  const renderedReceivers = () => {
    if (!showReceivers) return null
    return receivers.map((r) => (
      <span key={r.username} className="flex items-center gap-2">
        <a
          href={`/user/${r.username}`}
          className={`text-sm hover:underline ${transactionTextClass}`}
        >
          {r.username}
        </a>
      </span>
    ))
  }

  return (
    <>
      <Card 
        variant="clean" 
        className="p-0 cursor-pointer hover:bg-muted/70 transition-colors bg-background border"
        onClick={() => setDialogOpen(true)}
      >
        <CardContent className="p-4 px- sm:px-4 overflow-x-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 w-full">
          {/* Левая часть: аватар + автор + получатели */}
          <div className="flex items-start gap-2 sm:gap-4 w-full min-w-0">
            
            <Avatar className={`h-15 w-10 ${getPartyBorderClass(authorParty)}`} asChild>
              <Link to={`/user/${author}`}>
              <AvatarImage src={getAvatarUrl(author, 'small')} className="w-full h-full object-cover"/>
              <AvatarFallback>{author[0]}</AvatarFallback>
              </Link>
            </Avatar>
            <div className="min-w-0 w-full">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 justify-between w-full min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span key={author} className="flex items-center gap-2">
                      <a
                        href={`/user/${author}`}
                        className={`text-sm hover:underline ${transactionTextClass}`}
                      >
                        {author}
                      </a>
                    </span>
                  {showReceivers && (
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="mx-1">→</span>
                      {renderedReceivers()}
                    </span>
                  )}
                </div>
                <span className={`text-xs text-muted-foreground whitespace-nowrap sm:justify-end ${transactionTextClass}`}>
                  {new Date(date_created).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long'
                  })} в {new Date(date_created).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className={`text-sm text-muted-foreground break-words max-w-[90vw] ${transactionTextClass}`}>{type}</p>
              {/* message bubble */}
              <Card variant="clean" className={`mt-2 inline-block bg-muted px-3 py-1 rounded-2xl text-sm bg-foreground/10 break-words max-w-[90vw] ${transactionTextClass}`}>
                <span className={transactionTextClass}>{description}</span>
              </Card>
            </div>
          </div>

          {/* Правая часть: иконка статуса + сумма + кнопка отмены */}
          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            {getStatusIcon()}
            <span className={`font-bold text-xl ${bucksClass} whitespace-nowrap`}>
              {bucks >= 0 ? "+" : ""}
              {bucks}@
            </span>
            {/* Кнопка отмены для staff */}
            {isStaff && status === "created" && (
              <Button
                variant="text"
                size="sm"
                className="text-red-600 hover:text-red-800 p-1 h-auto min-w-0"
                onClick={(e) => {
                  e.stopPropagation() // Предотвращаем открытие диалога
                  onCancel?.(id)
                }}
                title="Отменить транзакцию"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    
    <TransactionViewDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      transaction={{
        id,
        description,
        author,
        date_created,
        status,
        type,
        receivers
      }}
      isStaff={isStaff}
      onCancel={onCancel}
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onApprove={onApprove}
    />
  </>
  )
}
