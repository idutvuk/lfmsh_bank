import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { TransactionItem } from "@/components/TransactionItem"
import { type Transaction } from "@/services/api"

interface TransactionsCardProps {
  transactions: Transaction[]
  isStaff: boolean
  currentUser?: string
  onTransactionCancel?: (transactionId: number) => void
  onTransactionEdit?: (transactionId: number) => void
  onTransactionDuplicate?: (transactionId: number) => void
  onTransactionApprove?: (transactionId: number) => void
}

export function TransactionsCard({ 
  transactions, 
  isStaff,
  currentUser = "",
  onTransactionCancel,
  onTransactionEdit,
  onTransactionDuplicate,
  onTransactionApprove
}: TransactionsCardProps) {
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false)

  if (transactions.length === 0) {
    return null
  }

  // Filter transactions for non-staff users (hide declined and substituted transactions)
  const filteredTransactions = isStaff 
    ? transactions 
    : transactions.filter(transaction => 
        transaction.status !== "declined" && transaction.status !== "substituted"
      )

  const displayedTransactions = showAllTransactions 
    ? filteredTransactions 
    : filteredTransactions.sort((a, b) => {
        return new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      }).slice(0, 3)

  return (
    <Card variant="clean">
      <CardHeader>
        <CardTitle className="text-lg flex justify-center">
          Мои транзакции
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedTransactions.map(transaction => (
          <TransactionItem 
            key={transaction.id} 
            {...transaction}
            currentUser={currentUser}
            isStaff={isStaff}
            onCancel={onTransactionCancel}
            onEdit={onTransactionEdit}
            onDuplicate={onTransactionDuplicate}
            onApprove={onTransactionApprove}
          />
        ))}
      </CardContent>
      {filteredTransactions.length > 3 && (
        <CardFooter>
          <Button
            variant="neutral"
            className="w-full flex items-center justify-center"
            onClick={() => setShowAllTransactions(!showAllTransactions)}
          >
            {showAllTransactions ? "Скрыть" : "Показать все"}
            <ChevronDown className={`h-5 w-5 ml-1 transition-transform ${showAllTransactions ? "rotate-180" : "rotate-0"}`} />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
} 