import {useState, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Background} from "@/components/Background"
import {Label} from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {Search, X} from "lucide-react"
import {getUsers, type UserListItem, createTransaction, getMe, getTransactionById} from "@/services/api"
import {Navbar} from "@/components/Navbar"
import {Loading} from "@/components/loading"
import {useNavigate, useSearchParams} from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { Link } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown } from "lucide-react"
import type { ColumnDef, Table as ReactTable } from "@tanstack/react-table"
import { getPartyTextColorClass } from "@/lib/utils"
import { UserName } from "@/components/UserName"

interface UserTransactionListItem extends UserListItem {
    isSelected: boolean;
    bucks: number;
}

type TableMeta = {
  onAmountChange?: (userId: number, value: number) => void;
};

const userColumns: ColumnDef<UserTransactionListItem, any>[] = [
  {
    id: "select",
    header: ({ table }: { table: ReactTable<UserTransactionListItem> }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: { row: any }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }: { column: any }) => (
      <Button
        type="button"
        variant="noShadow"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Имя
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }: { row: any }) => (
      <UserName
        user={row.original}
        showPartyColor={true}
      />
    ),
  },
  {
    accessorKey: "party",
    header: "Отряд",
    cell: ({ row }: { row: any }) => (
      <span className={`font-medium ${getPartyTextColorClass(row.original.party)}`}>
        {row.original.party} отряд
      </span>
    ),
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === "" || filterValue === null || filterValue === undefined) {
        return true
      }
      const cellValue = row.getValue(columnId)
      return cellValue === filterValue
    },
  },
  {
    accessorKey: "balance",
    header: "Баланс",
    cell: ({ row }: { row: any }) => <span>{row.original.balance}@</span>,
  },
  {
    accessorKey: "bucks",
    header: "Сумма",
    cell: ({ row, table }: { row: any, table: ReactTable<UserTransactionListItem> }) => (
      row.getIsSelected() ? (
        <Input
          type="number"
          value={row.original.bucks || ""}
          onChange={e => {
            const newAmount = Number(e.target.value);
            (table.options.meta as TableMeta)?.onAmountChange?.(row.original.id, newAmount);
          }}
          placeholder="0"
          className="w-20 text-right"
        />
      ) : null
    ),
  },
];



export default function CreateTransactionPage() {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [userTransactions, setUserTransactions] = useState<UserTransactionListItem[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [searchQuery, setSearchQuery] = useState("")
    const [description, setDescription] = useState("")
    const [transactionType, setTransactionType] = useState("")
    const [amount, setAmount] = useState<number>(0)
    const [selectedUsernames, setSelectedUsernames] = useState<string[]>([])

    const typeParam = searchParams.get('type')
    const recipientParam = searchParams.get('recipient')
    const editParam = searchParams.get('edit')
    const duplicateParam = searchParams.get('duplicate')

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [fetchedUsers, me] = await Promise.all([
                    getUsers(),
                    getMe()
                ])
                
                setCurrentUser(me)
                
                // Filter users to only show non-staff users
                const filteredUsers = fetchedUsers
                    .filter(user => !user.staff)
                    .map(user => {
                        return {
                            ...user, 
                            isSelected: false, 
                            bucks: 0
                        }
                    })
                
                setUserTransactions(filteredUsers)

                // Set transaction type based on URL parameter or user role
                if (typeParam) {
                    setTransactionType(typeParam)
                } else if (!me.staff) {
                    // For non-staff users, default to p2p
                    setTransactionType("p2p")
                }

                // Auto-select recipient if provided in URL
                if (recipientParam) {
                    setUserTransactions(prev => 
                        prev.map(user => ({
                            ...user,
                            isSelected: user.username === recipientParam,
                            bucks: user.username === recipientParam ? amount : 0
                        }))
                    )
                }

                // Load transaction data for editing or duplicating
                if (editParam || duplicateParam) {
                    const transactionId = parseInt(editParam || duplicateParam || '0')
                    if (transactionId) {
                        try {
                            const transactionData = await getTransactionById(transactionId)
                            
                            // Set form data from transaction
                            setTransactionType(transactionData.type)
                            setDescription(transactionData.description)
                            
                            // Set recipients data
                            setUserTransactions(prev => 
                                prev.map(user => {
                                    const receiverData = transactionData.receivers.find(r => r.username === user.username)
                                    if (receiverData) {
                                        return {
                                            ...user,
                                            isSelected: true,
                                            bucks: receiverData.bucks
                                        }
                                    }
                                    return user
                                })
                            )
                        } catch (error) {
                            console.error("Error loading transaction data:", error)
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [typeParam, recipientParam, editParam, duplicateParam])

    // Reset selection when transaction type changes
    // useEffect(() => {
    //     // setUserTransactions(prev =>
    //     //     prev.map(u => ({...u, bucks: 0}))
    //     // )
    // }, [transactionType])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const selectedUsers = userTransactions.filter(user => user.isSelected)
            if (selectedUsers.length === 0) {
                alert("Выберите хотя бы одного получателя")
                setSubmitting(false)
                return
            }

            // For attendance transaction types, the amount should be 0
            const isAttendanceType = ["fac_attend", "lec_attend", "sem_attend", "lab_pass"].includes(transactionType)
            
            // Check balance for p2p transactions
            if (hasInsufficientBalance()) {
                const totalAmount = getTotalTransactionAmount()
                alert(`Недостаточно средств для перевода. Необходимо: ${totalAmount}@, доступно: ${currentUser.balance}@`)
                setSubmitting(false)
                return
            }

            const transactionData = {
                type: transactionType,
                description: description,
                recipients: selectedUsers.map(user => ({
                    id: user.id,
                    amount: isAttendanceType
                        ? 0
                        : user.bucks
                })),
                // Add update_of for transaction replacement
                ...(editParam && { update_of: parseInt(editParam) })
            }

            await createTransaction(transactionData)

            // Navigate back after successful submission
            navigate('/')
        } catch (error) {
            console.error("Error creating transaction:", error)
            alert("Ошибка при создании транзакции: " + (error instanceof Error ? error.message : "неизвестная ошибка"))
        } finally {
            setSubmitting(false)
        }
    }

    function onAmountChanged(e: React.ChangeEvent<HTMLInputElement>) {
        const prevAmount = amount
        const newAmount = e.target.value ? Number(e.target.value) : 0
        setAmount(newAmount)
        setUserTransactions(prev =>
            prev.map(u =>
                u.bucks === prevAmount
                    ? {...u, bucks: newAmount}
                    : u
            )
        )
    }

    // Show transaction type selector only for staff users
    const showTransactionTypeSelector = currentUser?.staff

    // Helper function to calculate total transaction amount
    const getTotalTransactionAmount = () => {
        return userTransactions
            .filter(user => user.isSelected)
            .reduce((sum, user) => sum + (user.bucks || 0), 0)
    }

    // Check if user has sufficient balance for p2p transaction
    const hasInsufficientBalance = () => {
        return transactionType === "p2p" && currentUser && getTotalTransactionAmount() > currentUser.balance
    }

    // Determine page title based on mode
    const getPageTitle = () => {
        if (editParam) return "Редактирование транзакции"
        if (duplicateParam) return "Дублирование транзакции"
        return "Создание перевода"
    }

    return (
        <Background>
            {/* Header */}
            <Navbar
                showBackButton={true}
                title={getPageTitle()}
            />

            <div className="max-w-4xl mx-auto px-4 py-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Детали перевода</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {showTransactionTypeSelector && (
                                    <div className="space-y-2">
                                        <Select
                                            value={transactionType}
                                            onValueChange={setTransactionType}
                                            required
                                        >
                                            <SelectTrigger id="type">
                                                <SelectValue placeholder="Выберите тип перевода"/>
                                            </SelectTrigger>
                                            <SelectContent className="">
                                                <SelectItem value="fine">Штраф</SelectItem>
                                                <SelectItem value="general">Награда</SelectItem>
                                                <SelectItem value="fac_attend">Посещение факультатива</SelectItem>
                                                <SelectItem value="lec_attend">Посещение лекции</SelectItem>
                                                <SelectItem value="sem_attend">Посещение семинара</SelectItem>
                                                <SelectItem value="lab_pass">Лабораторная работа</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Textarea
                                        id="description"
                                        placeholder="Введите описание перевода"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        maxLength={511}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Сумма</Label>
                                    {/* Show balance info for p2p transactions */}
                                    {transactionType === "p2p" && currentUser && (
                                        <div className="text-sm text-gray-600 mb-2">
                                            Ваш баланс: <span className="font-semibold">{currentUser.balance}@</span>
                                            {(() => {
                                                const totalAmount = getTotalTransactionAmount()
                                                if (totalAmount > 0) {
                                                    const remaining = currentUser.balance - totalAmount
                                                    return (
                                                        <span className={`ml-2 ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                            | Сумма перевода: {totalAmount}@ | Остаток: {remaining}@
                                                        </span>
                                                    )
                                                }
                                                return null
                                            })()}
                                        </div>
                                    )}
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="Введите сумму"
                                        value={amount}
                                        onChange={(e) => onAmountChanged(e)}
                                        required
                                        className={hasInsufficientBalance() ? "border-red-500" : ""}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex justify-center">
                            <Button
                                type="submit"
                                disabled={
                                    submitting || 
                                    !description || 
                                    !transactionType || 
                                    amount === 0 || 
                                    selectedUsernames.length === 0 ||
                                    hasInsufficientBalance()
                                }
                            >
                                {submitting ? "Создание..." : "Создать перевод"}
                            </Button>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Получатели</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="p-4 text-center">
                                        <Loading text="Загрузка списка пионеров..." />
                                    </div>
                                ) : (
                                    <DataTable
                                        columns={userColumns}
                                        data={userTransactions}
                                        filterKey="name"
                                        filterPlaceholder="Найти жертву..."
                                        rowSelectionMode={transactionType === "p2p" ? "single" : "multiple"}
                                        onRowSelectionChange={(selectedIds: number[]) => {
                                            const selectedUsernames = userTransactions
                                                .filter(user => selectedIds.includes(user.id))
                                                .map(user => user.username);
                                            setSelectedUsernames(selectedUsernames);
                                            setUserTransactions(prev =>
                                              prev.map(u => ({
                                                ...u,
                                                isSelected: selectedIds.includes(u.id)
                                              }))
                                            )
                                        }}
                                        onAmountChange={(userId: number, newAmount: number) => {
                                            setUserTransactions(prev => prev.map(u => u.id === userId ? { ...u, bucks: newAmount } : u));
                                        }}
                                        emptyMessage={searchQuery ? "Пионеры не найдены" : "Пионеров больше нет. ЛФМШ мертва😭"}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </Background>
    )
} 