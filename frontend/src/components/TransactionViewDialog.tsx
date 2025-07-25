import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Edit, X, Check } from "lucide-react"

type Receiver = {
  username: string
  bucks: number
  certs: number
  lab: number
  lec: number
  sem: number
  fac: number
}

type TransactionViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: number
    description: string
    author: string
    date_created: string
    status: string
    type: string
    receivers: Receiver[]
  }
  isStaff: boolean
  onCancel?: (transactionId: number) => void
  onEdit?: (transactionId: number) => void
  onDuplicate?: (transactionId: number) => void
  onApprove?: (transactionId: number) => void
}

export function TransactionViewDialog({
  open,
  onOpenChange,
  transaction,
  isStaff,
  onCancel,
  onEdit,
  onDuplicate,
  onApprove
}: TransactionViewDialogProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge variant="default" className="bg-green-600 text-white">Одобрена</Badge>
      case "declined":
        return <Badge variant="neutral" className="bg-red-600 text-white">Отменена</Badge>
      case "substituted":
        return <Badge variant="neutral" className="bg-gray-600 text-white">Заменена</Badge>
      default:
        return <Badge variant="neutral">Ожидает одобрения</Badge>
    }
  }

  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      'p2p': 'Перевод между пионерами',
      'initial': 'Начальные деньги',
      'staff_help': 'Помощь педсоставу',
      'dining_services': 'Столовая',
      'table': 'Настольные игры',
      'sem_attend': 'Посещение семинара',
      'workout': 'Зарядка',
      'general': 'Общая транзакция',
      'sport_event': 'Спортивное мероприятие',
      'activity': 'Мероприятие',
      'olympiad': 'Олимпиада',
      'problem': 'Решение убоек',
      'exam': 'Экзамен',
      'class_pass': 'Зачет по классу',
      'fac_attend': 'Посещение факультатива',
      'fac_pass': 'Зачет по факультативу',
      'lab': 'Лабораторная работа',
      'lec_attend': 'Посещение лекции',
      'seminar': 'Проведение семинара',
      'purchase': 'Покупка',
      'purchase_book': 'Покупка книги',
      'purchase_auction': 'Покупка на аукционе',
      'fine': 'Штраф',
      'fine_lab': 'Штраф за лабы',
      'fine_lecture': 'Штраф за лекции',
      'fine_equatorial': 'Экваториальный штраф',
      'fine_final': 'Финальный штраф',
      'fine_schedule': 'Штраф за расписание',
      'fine_damage': 'Штраф за порчу имущества',
      'fine_moral': 'Моральный штраф',
      'fine_language': 'Штраф за язык',
      'fine_safety': 'Штраф за безопасность',
      'tax': 'Налог'
    }
    return typeMap[type] || type
  }

  const formatBalanceChange = (receiver: Receiver) => {
    const parts = []
    
    if (receiver.bucks !== 0) {
      parts.push(`${receiver.bucks >= 0 ? '+' : ''}${receiver.bucks}@`)
    }
    
    if (receiver.certs !== 0) {
      parts.push(`Сертификаты: ${receiver.certs >= 0 ? '+' : ''}${receiver.certs}🕮`)
    }
    
    if (receiver.lab > 0) {
      parts.push(`Лабы: +${receiver.lab}`)
    }
    
    if (receiver.lec > 0) {
      parts.push(`Лекции: +${receiver.lec}`)
    }
    
    if (receiver.sem > 0) {
      parts.push(`Семинары: +${receiver.sem}`)
    }
    
    if (receiver.fac > 0) {
      parts.push(`Факультативы: +${receiver.fac}`)
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Нет изменений'
  }

  const canCancel = isStaff && transaction.status === "created"
  const canApprove = isStaff && transaction.status === "created"
  const canEdit = isStaff
  const canDuplicate = isStaff

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center justify-between">
            <span>Транзакция #{transaction.id}</span>
            {getStatusBadge(transaction.status)}
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          {/* Дата */}
          <div>
            <strong>Дата:</strong> {formatDate(transaction.date_created)}
          </div>
          
          {/* Автор */}
          <div>
            <strong>Автор:</strong> {transaction.author}
          </div>
          
          {/* Тип транзакции */}
          <div>
            <strong>Тип транзакции:</strong> {getTypeDisplayName(transaction.type)}
          </div>
          
          {/* Описание */}
          {transaction.description && (
            <div>
              <strong>Описание:</strong>
              <div className="mt-1 p-3 bg-muted rounded-lg">
                {transaction.description}
              </div>
            </div>
          )}
          
          {/* Получатели */}
          <div>
            <strong>Получатели:</strong>
            <div className="mt-2 space-y-2">
              {transaction.receivers.map((receiver, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="font-medium">{receiver.username}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatBalanceChange(receiver)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {isStaff && (
            <div className="flex gap-2 flex-wrap">
              {canApprove && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 text-white"
                  onClick={() => {
                    onApprove?.(transaction.id)
                    onOpenChange(false)
                  }}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Одобрить
                </Button>
              )}
              
              {canCancel && (
                <Button
                  variant="neutral"
                  size="sm"
                  className="bg-red-600 text-white"
                  onClick={() => {
                    onCancel?.(transaction.id)
                    onOpenChange(false)
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Отменить
                </Button>
              )}
              
              {canEdit && (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => {
                    onEdit?.(transaction.id)
                    onOpenChange(false)
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Изменить
                </Button>
              )}
              
              {canDuplicate && (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => {
                    onDuplicate?.(transaction.id)
                    onOpenChange(false)
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Дублировать
                </Button>
              )}
            </div>
          )}
          
          <AlertDialogCancel asChild>
            <Button variant="neutral">Закрыть</Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 