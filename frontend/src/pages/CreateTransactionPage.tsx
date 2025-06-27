import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Search, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getUsers, type UserListItem } from "@/services/api"

export default function CreateTransactionPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<UserListItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [description, setDescription] = useState("")
  const [transactionType, setTransactionType] = useState("")
  const [amount, setAmount] = useState<number | "">("")

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const fetchedUsers = await getUsers()
        setUsers(fetchedUsers.filter(user => !user.staff)) // Filter out staff members
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedUsers.some(selected => selected.id === user.id)
  )

  const handleSelectUser = (user: UserListItem) => {
    setSelectedUsers([...selectedUsers, user])
  }
  
  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Here would be the API call to create a transaction
    console.log({
      type: transactionType,
      description,
      amount,
      recipients: selectedUsers.map(user => user.id),
    })
    
    // Navigate back to home after successful submission
    // navigate('/')
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="w-full bg-background/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center">
          <Button 
            variant="neutral" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
            Назад
          </Button>
          <h1 className="text-xl font-bold">
            Создание перевода
          </h1>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Детали перевода</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Тип перевода</Label>
                  <Select
                    value={transactionType}
                    onValueChange={setTransactionType}
                    required
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Выберите тип перевода" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="description">Описание перевода</Label>
                  <Input
                    id="description"
                    placeholder="Введите описание перевода"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Сумма (в @)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Введите сумму"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Получатели</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Selected users */}
                {selectedUsers.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm text-muted-foreground mb-2">Выбранные пионеры:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <Badge key={user.id} variant="neutral" className="pl-3 pr-2 py-1.5">
                          {user.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(user.id)}
                            className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск пионера..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* User list */}
                <div className="border rounded-md divide-y max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Загрузка списка пионеров...</p>
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center px-4 py-3 hover:bg-muted cursor-pointer"
                        onClick={() => handleSelectUser(user)}
                      >
                        <Checkbox className="mr-3" />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">Баланс: {user.balance}@</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchQuery ? "Пионеры не найдены" : "Пионеров больше нет. ЛФМШ мертва"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-[#1e99a0] hover:bg-[#1e99a0]/90"
                disabled={!description || !transactionType || amount === "" || selectedUsers.length === 0}
              >
                Создать перевод
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 