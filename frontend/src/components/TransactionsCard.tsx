import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { TransactionItem } from "@/components/TransactionItem"
import { type Transaction } from "@/services/api"

interface TransactionsCardProps {
  transactions: Transaction[]
  isStaff: boolean
}

export function TransactionsCard({ transactions, isStaff }: TransactionsCardProps) {
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false)

  if (transactions.length === 0) {
    return null
  }

  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 3)

  return (
    <Card className="shadow-0 border-0">
      <CardHeader>
        <CardTitle className="text-lg flex justify-center">
          Мои транзакции
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
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
  )
} 