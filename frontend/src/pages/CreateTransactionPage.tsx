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
import {Search, X, AlertTriangle} from "lucide-react"
import {getUsers, type UserListItem, createTransaction} from "@/services/api"
import {Navbar} from "@/components/Navbar"
import {Loading} from "@/components/loading"
import {TransactionUserItem} from "@/components/TransactionUserItem"
import {useNavigate} from "react-router-dom"
interface UserTransactionListItem extends UserListItem {
    isSelected: boolean;
    bucks: number;
}

export default function CreateTransactionPage() {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [userTransactions, setUserTransactions] = useState<UserTransactionListItem[]>([])
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [description, setDescription] = useState("")
    const [transactionType, setTransactionType] = useState("")
    const [amount, setAmount] = useState<number>(0)

    // Check if too many recipients are selected for P2P
    const selectedUsers = userTransactions.filter(user => user.isSelected)
    const tooManyP2PRecipients = transactionType === "p2p" && selectedUsers.length > 1

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            try {
                const fetchedUsers = await getUsers()
                setUserTransactions(fetchedUsers
                    .filter(user => !user.staff)
                    .map(user => {
                        return {
                            ...user, isSelected: false, bucks: 0
                        }
                    }));
            } catch (err) {
                console.error("Error fetching users:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    // Reset selection when transaction type changes
    useEffect(() => {
        setUserTransactions(prev =>
            prev.map(u => ({...u, isSelected: false, bucks: 0}))
        )
    }, [transactionType])

    const filteredUsers = userTransactions.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelectUser = (user: UserTransactionListItem) => {
        setUserTransactions(prev => {
            // For P2P transactions, only allow one user to be selected
            if (transactionType === "p2p") {
                return prev.map(u => ({
                    ...u,
                    isSelected: u.id === user.id ? !u.isSelected : false,
                    bucks: u.id === user.id && !u.isSelected ? amount : u.bucks
                }))
            } else {
                // For other transaction types, allow multiple selections
                return prev.map(u =>
                    u.id === user.id
                        ? {...u, isSelected: !u.isSelected, bucks: !u.isSelected ? amount : 0}
                        : u
                )
            }
        })
    }

    function userAmountChanged(uid: number, newAmount: number) {
        if (isNaN(newAmount)) {
            return; // игнорируем некорректный ввод
        }
        setUserTransactions(prev =>
            prev.map(u =>
                u.id === uid
                    ? {...u, bucks: newAmount}
                    : u
            )
        );
    }

    const handleCustomAmountChange = (uid: number) => {
        setUserTransactions(prev =>
            prev.map(u =>
                u.id === uid
                    ? {...u, bucks: amount}
                    : u
            )
        )
    }

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

            if (transactionType === "p2p" && selectedUsers.length > 1) {
                alert("Для перевода между пионерами можно выбрать только одного получателя")
                setSubmitting(false)
                return
            }

            const transactionData = {
                type: transactionType,
                description: description,
                recipients: selectedUsers.map(user => ({
                    id: user.id,
                    amount: user.bucks
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
                                <div className="space-y-2">
                                    <Select
                                        value={transactionType}
                                        onValueChange={setTransactionType}
                                        required
                                    >
                                        <SelectTrigger className="bg-white" id="type">

                                            <SelectValue placeholder="Выберите тип перевода"/>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="p2p">Перевод между пионерами</SelectItem>
                                            <SelectItem value="fine">Штраф</SelectItem>
                                            <SelectItem value="reward">Награда</SelectItem>
                                            <SelectItem value="lecture">За лекцию</SelectItem>
                                            <SelectItem value="seminar">За семинар</SelectItem>
                                            <SelectItem value="lab">За лабораторную</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Textarea
                                        id="description"
                                        placeholder="Введите описание перевода"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
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

                                {transactionType === "p2p" && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                        <p className="text-amber-800 text-sm flex items-center gap-2">
                                            <AlertTriangle size={16} />
                                            Для перевода между пионерами можно выбрать только одного получателя
                                        </p>
                                    </div>
                                )}

                                {tooManyP2PRecipients && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-red-800 text-sm flex items-center gap-2">
                                            <AlertTriangle size={16} />
                                            <strong>Внимание!</strong> Выбрано слишком много получателей для перевода между пионерами.
                                            Пожалуйста, выберите только одного получателя.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <div className="flex justify-center">
                            <Button
                                type="submit"
                                disabled={submitting || !description || !transactionType || amount === 0 || !userTransactions.some(u => u.isSelected) || tooManyP2PRecipients}
                            >
                                {submitting ? "Создание..." : "Создать перевод"}
                            </Button>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Получатели</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative mb-4">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                    />
                                    <Input
                                        placeholder="Найти жертву..."
                                        className="pl-10 pr-10"  // добавляем отступ справа
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <X
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary"
                                        />
                                    )}
                                </div>

                                {/* User list with custom amount inputs */}
                                <div className="rounded-md divide-y max-h-80 overflow-y-auto">
                                    {loading ? (
                                        <div className="p-4 text-center">
                                            <Loading text="Загрузка списка пионеров..." />
                                        </div>
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <TransactionUserItem
                                                key={user.id}
                                                user={user}
                                                onSelect={handleSelectUser}
                                                onAmountChange={userAmountChanged}
                                                onResetAmount={handleCustomAmountChange}
                                                defaultAmount={amount}
                                            />
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-muted-foreground">
                                            {searchQuery ? "Пионеры не найдены" : "Пионеров больше нет. ЛФМШ мертва😭"}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>


                    </div>
                </form>
            </div>
        </Background>
    )
} 