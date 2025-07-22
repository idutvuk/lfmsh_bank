import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Check, X, AlertCircle } from "lucide-react"
import { getAvatarUrl } from "@/services/api"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
}

// Функция для выбора цвета рамки по номеру party
const getAvatarBorderClass = (party: number) => {
  switch (party) {
    case 1:
      return "outline outline-2 outline-[var(--lfmsh-1)]";
    case 2:
      return "outline outline-2 outline-[var(--lfmsh-2)]";
    case 3:
      return "outline outline-2 outline-[var(--lfmsh-3)]";
    case 4:
      return "outline outline-2 outline-[var(--lfmsh-4)]";
    default:
      return "outline outline-2 outline-black";
  }
};

export function TransactionItem({
  description,
  author,
  status,
  receivers,
  currentUser,
  type,
  date_created,
}: TransactionProps) {
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
    status === "declined"
      ? "text-muted-foreground line-through"
      : bucks >= 0
      ? "text-teal-600"
      : "text-pink-600"

  // Не показываем получателей, если их только один и это текущий пользователь
  const showReceivers =
    receivers.length > 1 || receivers[0]?.username !== currentUser

  // Получатели после стрелки
  const renderedReceivers = () => {
    if (!showReceivers) return null
    return receivers.map((r) => (
      <span key={r.username} className="flex items-center gap-2">
        <a
          href={`/user/${r.username}`}
          className="text-sm hover:underline"
        >
          {r.username}
        </a>
      </span>
    ))
  }

  return (
    <Card variant="clean" className="p-0">
      <CardContent className="p-4 px- sm:px-4 overflow-x-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 w-full">
          {/* Левая часть: аватар + автор + получатели */}
          <div className="flex items-start gap-2 sm:gap-4 w-full min-w-0">
            {/*todo добавить ссылку на профиль по кшлику на аватар*/}
            {/*todo убрать растяжение (форма прямоугольная и квадратыне картинки растягиваются*/}
            <Avatar className={`h-15 w-10 min-w-[40px] ${getAvatarBorderClass(authorParty)}`}>
              <AvatarImage src={getAvatarUrl(author, 'small')} alt={author} />
              <AvatarFallback>{author[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 w-full">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 justify-between w-full min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span key={author} className="flex items-center gap-2">
                      <a
                        href={`/user/${author}`}
                        className="text-sm hover:underline"
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
                <span className="text-xs text-muted-foreground whitespace-nowrap sm:justify-end">
                  {new Date(date_created).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long'
                  })} в {new Date(date_created).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground break-words max-w-[90vw]">{type}</p>
              {/* message bubble */}
              <Card variant="clean" className="mt-2 inline-block bg-muted px-3 py-1 rounded-2xl text-sm bg-foreground/10 break-words max-w-[90vw]">
                {description}
              </Card>
            </div>
          </div>

          {/* Правая часть: иконка статуса + сумма */}
          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            {getStatusIcon()}
            <span className={`font-bold text-xl ${bucksClass} whitespace-nowrap`}>
              {bucks >= 0 ? "+" : ""}
              {bucks}@
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
