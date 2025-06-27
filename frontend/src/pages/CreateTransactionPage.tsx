import {useState, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {Checkbox} from "@/components/ui/checkbox"
import {Search} from "lucide-react"
import {useNavigate} from "react-router-dom"
import {getUsers, type UserTransactionListItem} from "@/services/api"
import {Navbar} from "@/components/Navbar"


export default function CreateTransactionPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [userTransactions, setUserTransactions] = useState<UserTransactionListItem[]>([])

    const [searchQuery, setSearchQuery] = useState("")
    const [description, setDescription] = useState("")
    const [transactionType, setTransactionType] = useState("")
    const [amount, setAmount] = useState<number>(0)

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

    const filteredUsers = userTransactions.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
        // Remove filter to keep users in the list even after selection
    )

    const handleSelectUser = (user: UserTransactionListItem) => {
        setUserTransactions(prev =>
            prev.map(u =>
                u.id === user.id
                    ? {...u, isSelected: !u.isSelected, bucks: amount}
                    : u
            )
        )
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Here would be the API call to create a transaction
        console.log({
            type: transactionType,
            description,
            recipients: userTransactions.map(user => ({
                id: user.id,
                amount: user.bucks
            })),
        })

        // Navigate back to home after successful submission
        // navigate('/')
    }

    function onAmountChanged(e: React.ChangeEvent<HTMLInputElement>) {
        const prevAmount = amount
        const newAmount = e.target.value ? Number(e.target.value) : 0
        if (typeof newAmount === 'number') {
            setAmount(newAmount)

            setUserTransactions(prev =>
                prev.map(u =>
                    u.bucks === prevAmount
                        ? {...u, bucks: newAmount}
                        : u
                )
            )

        }
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <Navbar
                showBackButton={true}
                title="Создание перевода"
            />

            <div className="max-w-screen-xl mx-auto px-4 py-6">
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
                            </CardContent>
                        </Card>
                        <div className="flex justify-center">
                            <Button
                                type="submit"
                                disabled={!description || !transactionType || amount === 0 || userTransactions.length === 0}
                            >
                                Создать перевод
                            </Button>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Получатели</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative mb-4">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        placeholder="Поиск пионера..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* User list with custom amount inputs */}
                                <div className="rounded-md divide-y max-h-80 overflow-y-auto">
                                    {loading ? (
                                        <div className="p-4 text-center">
                                            <div
                                                className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                            <p className="mt-2 text-muted-foreground">Загрузка списка пионеров...</p>
                                        </div>
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => {
                                            // const selectedUser = selectedUsers.find(selected => selected.id === user.id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    className={`flex items-center px-4 py-3 hover:bg-muted cursor-pointer ${user.isSelected ? 'bg-muted/50' : ''}`}
                                                >
                                                    <div className="flex-1 flex items-center">
                                                        <Checkbox
                                                            className="mr-3"
                                                            checked={user.isSelected}
                                                            onClick={() => handleSelectUser(user)}
                                                        />
                                                        <div>
                                                            <p className="font-medium">{user.name}</p>
                                                            <p className="text-sm text-muted-foreground">Баланс: {user.balance}@</p>
                                                        </div>
                                                    </div>

                                                    {user.isSelected && amount !== 0 && (
                                                        <div className="flex items-center">
                                                            {user.bucks !== amount && (
                                                                <Button
                                                                    variant="text"
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => handleCustomAmountChange(user.id)}
                                                                    className="text-xl mr-2"
                                                                >
                                                                    ⟳
                                                                </Button>
                                                            )}
                                                            <Input
                                                                value={user.bucks}
                                                                className="bg-transparent w-20"
                                                                onChange={(e) => userAmountChanged(user.id, Number(e.target.value))}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
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
        </div>
    )
} 