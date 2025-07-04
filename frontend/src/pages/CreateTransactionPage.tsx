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
import {getUsers, type UserListItem, createTransaction, getMe} from "@/services/api"
import {Navbar} from "@/components/Navbar"
import {Loading} from "@/components/loading"
import {useNavigate, useSearchParams} from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { Link } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown } from "lucide-react"
import type { ColumnDef, Table as ReactTable } from "@tanstack/react-table"

interface UserTransactionListItem extends UserListItem {
    isSelected: boolean;
    bucks: number;
}

type TableMeta = {
  onAmountChange?: (id: number, value: number) => void;
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
      <Link to={`/user/${row.original.id}`}>{row.original.name}</Link>
    ),
  },
  {
    accessorKey: "party",
    header: "Отряд",
    cell: ({ row }: { row: any }) => <span>{row.original.party} отряд</span>,
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
          value={row.original.bucks}
          onChange={e => {
            const newAmount = Number(e.target.value);
            (table.options.meta as TableMeta)?.onAmountChange?.(row.original.id, newAmount);
          }}
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
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])

    const typeParam = searchParams.get('type')
    const recipientIdParam = searchParams.get('recipientId')

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
                if (recipientIdParam) {
                    const recipientId = parseInt(recipientIdParam)
                    setUserTransactions(prev => 
                        prev.map(user => ({
                            ...user,
                            isSelected: user.id === recipientId,
                            bucks: user.id === recipientId ? amount : 0
                        }))
                    )
                }
            } catch (err) {
                console.error("Error fetching data:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [typeParam, recipientIdParam])

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

            const transactionData = {
                type: transactionType,
                description: description,
                recipients: selectedUsers.map(user => ({
                    id: user.id,
                    amount: isAttendanceType
                        ? 0
                        : user.bucks
                }))
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

    return (
        <Background>
            {/* Header */}
            <Navbar
                showBackButton={true}
                title="Создание перевода"
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
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="Введите сумму"
                                        value={amount}
                                        onChange={(e) => onAmountChanged(e)}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex justify-center">
                            <Button
                                type="submit"
                                disabled={submitting || !description || !transactionType || amount === 0 || selectedUserIds.length === 0}
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
                                            setSelectedUserIds(selectedIds);
                                            setUserTransactions(prev =>
                                              prev.map(u => ({
                                                ...u,
                                                isSelected: selectedIds.includes(u.id)
                                              }))
                                            )
                                        }}
                                        onAmountChange={(uid: number, newAmount: number) => {
                                            setUserTransactions(prev => prev.map(u => u.id === uid ? { ...u, bucks: newAmount } : u));
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