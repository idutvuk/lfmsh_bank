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
import {TransactionUserItem} from "@/components/TransactionUserItem"
import {useNavigate, useSearchParams} from "react-router-dom"

interface UserTransactionListItem extends UserListItem {
    isSelected: boolean;
    bucks: number;
}

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

    const filteredUsers = userTransactions.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelectUser = (user: UserTransactionListItem) => {
        setUserTransactions(prev => {
            // For P2P transactions (pioneers), only allow one user to be selected
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

                                {!showTransactionTypeSelector && transactionType && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="text-blue-800 text-sm">
                                            Тип перевода: <strong>Перевод между пионерами</strong>
                                        </p>
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
                                disabled={submitting || !description || !transactionType || amount === 0 || !userTransactions.some(u => u.isSelected)}
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
                                                transactionType={transactionType}
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