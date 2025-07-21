import {useState, useEffect, useRef} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Background} from "@/components/Background"
import {Label} from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {Search, X, User} from "lucide-react"
import {getUsers, type UserListItem, getMe, createSeminar, type SeminarCreate} from "@/services/api"
import {Navbar} from "@/components/Navbar"
import {Loading} from "@/components/loading"
import {useNavigate} from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { Link } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown } from "lucide-react"
import type { ColumnDef, Table as ReactTable } from "@tanstack/react-table"

interface UserAttendanceItem extends UserListItem {
    isSelected: boolean;
}

type TableMeta = {
  // No amount change needed for attendance
};

// todo fix table users selection

const attendanceColumns: ColumnDef<UserAttendanceItem, any>[] = [
  {
    id: "select",
    header: ({ table }: { table: ReactTable<UserAttendanceItem> }) => (
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
      <Link to={`/user/${row.original.username}`}>{row.original.name}</Link>
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
];

interface SeminarEvaluationForm {
  contentQuality: number;
  knowledgeQuality: number;
  presentationQuality: number;
  presentationQuality2: number;
  presentationQuality3: number;
  materials: number;
  unusualThings: number;
  discussion: number;
  generalQuality: number;
}

const seminarBlocks = [
  { value: "first", label: "First" },
  { value: "second", label: "Second" },
  { value: "third", label: "Third" }
];

export default function SeminarPage() {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [users, setUsers] = useState<UserListItem[]>([])
    const [attendees, setAttendees] = useState<UserAttendanceItem[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const navigate = useNavigate()
    
    // Speaker search state
    const [speakerSearchQuery, setSpeakerSearchQuery] = useState("")
    const [speakerSearchResults, setSpeakerSearchResults] = useState<UserListItem[]>([])
    const [showSpeakerResults, setShowSpeakerResults] = useState(false)
    const [selectedSpeaker, setSelectedSpeaker] = useState<UserListItem | null>(null)
    const speakerSearchRef = useRef<HTMLDivElement>(null)
    
    // Form state
    const [seminarBlock, setSeminarBlock] = useState("")
    const [seminarDescription, setSeminarDescription] = useState("")
    const [evaluation, setEvaluation] = useState<SeminarEvaluationForm>({
      contentQuality: undefined as any,
      knowledgeQuality: undefined as any,
      presentationQuality: undefined as any,
      presentationQuality2: undefined as any,
      presentationQuality3: undefined as any,
      materials: undefined as any,
      unusualThings: undefined as any,
      discussion: undefined as any,
      generalQuality: undefined as any,
    })
    
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])

    // Speaker search effect
    useEffect(() => {
        const searchSpeakers = async () => {
            if (speakerSearchQuery.trim().length < 2) {
                setSpeakerSearchResults([]);
                setShowSpeakerResults(false);
                return;
            }

            const filtered = users.filter(user => 
                !user.staff && // Only students can be speakers
                (user.name.toLowerCase().includes(speakerSearchQuery.toLowerCase()) ||
                user.username.toLowerCase().includes(speakerSearchQuery.toLowerCase()))
            );
            setSpeakerSearchResults(filtered);
            setShowSpeakerResults(true);
        };

        const timeoutId = setTimeout(searchSpeakers, 300);
        return () => clearTimeout(timeoutId);
    }, [speakerSearchQuery, users]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (speakerSearchRef.current && !speakerSearchRef.current.contains(event.target as Node)) {
                setShowSpeakerResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [fetchedUsers, me] = await Promise.all([
                    getUsers(),
                    getMe()
                ])
                
                setCurrentUser(me)
                setUsers(fetchedUsers)
                
                // Filter users to only show non-staff users for attendance
                const filteredUsers = fetchedUsers
                    .filter(user => !user.staff)
                    .map(user => ({
                        ...user, 
                        isSelected: false
                    }))
                
                setAttendees(filteredUsers)
            } catch (err) {
                console.error("Error fetching data:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleSpeakerSelect = (user: UserListItem) => {
        setSelectedSpeaker(user);
        setSpeakerSearchQuery(user.name);
        setShowSpeakerResults(false);
    };

    const clearSpeakerSearch = () => {
        setSpeakerSearchQuery("");
        setSelectedSpeaker(null);
        setSpeakerSearchResults([]);
        setShowSpeakerResults(false);
    };

    const handleEvaluationChange = (field: keyof SeminarEvaluationForm, value: number) => {
        setEvaluation(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const calculateTotalScore = () => {
        return Object.values(evaluation).reduce((sum, value) => sum + (value !== undefined ? value : 0), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            if (!selectedSpeaker) {
                alert("Выберите докладчика")
                setSubmitting(false)
                return
            }

            if (!seminarBlock) {
                alert("Выберите блок семинара")
                setSubmitting(false)
                return
            }

            if (!seminarDescription) {
                alert("Введите описание семинара")
                setSubmitting(false)
                return
            }

            const selectedAttendeesData = attendees.filter(user => user.isSelected)

            const totalScore = calculateTotalScore();

            const seminarData: SeminarCreate = {
                speaker: selectedSpeaker.username,
                block: seminarBlock,
                description: seminarDescription,
                evaluation: evaluation,
                totalScore: totalScore,
                attendees: selectedAttendeesData.map(user => user.username)
            }

            // Call actual API
            const response = await createSeminar(seminarData);
            
            alert(response.message || `Семинар успешно проведен! Докладчик ${selectedSpeaker.name} получил ${totalScore} баллов.`);

            // Navigate back after successful submission
            navigate('/')
        } catch (error) {
            console.error("Error creating seminar:", error)
            alert("Ошибка при создании семинара: " + (error instanceof Error ? error.message : "неизвестная ошибка"))
        } finally {
            setSubmitting(false)
        }
    }

    // Check if form is valid
    const isFormValid = () => {
        return selectedSpeaker && 
               seminarBlock && 
               seminarDescription &&
               Object.values(evaluation).every(value => value !== undefined);
    };

    return (
        <Background>
            <Navbar
                showBackButton={true}
                title="Проведение семинара"
            />

            <div className="max-w-4xl mx-auto px-4 py-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6">
                        {/* Speaker Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Выбор докладчика</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="relative" ref={speakerSearchRef}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="Поиск докладчика..."
                                                value={speakerSearchQuery}
                                                onChange={(e) => setSpeakerSearchQuery(e.target.value)}
                                                className="pl-10 pr-10"
                                            />
                                            {speakerSearchQuery && (
                                                <Button
                                                    type="button"
                                                    variant="text"
                                                    size="sm"
                                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                                    onClick={clearSpeakerSearch}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        {/* Speaker Search Results */}
                                        {showSpeakerResults && speakerSearchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-20">
                                                {speakerSearchResults.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="px-4 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                                                        onClick={() => handleSpeakerSelect(user)}
                                                    >
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground">@{user.username} • {user.party} отряд</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Speaker Display */}
                                    {selectedSpeaker && (
                                        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                                            <User className="h-5 w-5" />
                                            <div>
                                                <div className="font-medium">{selectedSpeaker.name}</div>
                                                <div className="text-sm text-muted-foreground">@{selectedSpeaker.username} • {selectedSpeaker.party} отряд</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Block Selection */}
                                    <div className="space-y-3">
                                        <Label>Блок семинара</Label>
                                        <RadioGroup value={seminarBlock} onValueChange={setSeminarBlock}>
                                            {seminarBlocks.map(block => (
                                                <div key={block.value} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={block.value} id={block.value} />
                                                    <Label htmlFor={block.value} className="cursor-pointer">{block.label}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    {/* Description Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="seminarDescription">Описание семинара</Label>
                                        <Input
                                            id="seminarDescription"
                                            type="text"
                                            placeholder="Введите описание семинара"
                                            value={seminarDescription}
                                            onChange={(e) => setSeminarDescription(e.target.value)}
                                            required
                                            maxLength={200}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Evaluation Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Оценка семинара</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Question 1 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">1. Соответствует ли содержание заявленной теме?</Label>
                                    <RadioGroup 
                                        value={evaluation.contentQuality !== undefined ? evaluation.contentQuality.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('contentQuality', parseInt(value))}
                                    >
                                        {[
                                            { value: -1, label: 'Нет' },
                                            { value: 0, label: 'Не очень' },
                                            { value: 1, label: 'Да' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`content-${option.value}`} />
                                                <Label htmlFor={`content-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Question 2 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">2. Степень ознакомленности рассказчика с темой семинара, степень понимания материала:</Label>
                                    <RadioGroup 
                                        value={evaluation.knowledgeQuality !== undefined ? evaluation.knowledgeQuality.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('knowledgeQuality', parseInt(value))}
                                    >
                                        {[
                                            { value: -1, label: 'Отсутствует' },
                                            { value: 0, label: 'Поверхностная' },
                                            { value: 1, label: 'Средняя' },
                                            { value: 2, label: 'Хорошая' },
                                            { value: 3, label: 'Высокая' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`knowledge-${option.value}`} />
                                                <Label htmlFor={`knowledge-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Question 3 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">3. Последовательность и логичность изложения:</Label>
                                    <RadioGroup 
                                        value={evaluation.presentationQuality !== undefined ? evaluation.presentationQuality.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('presentationQuality', parseInt(value))}
                                    >
                                        {[
                                            { value: -1, label: 'Отсутствует' },
                                            { value: 0, label: 'Прослеживается с трудом' },
                                            { value: 1, label: 'Прослеживается, но существуют явные недочеты' },
                                            { value: 2, label: 'Явных недочетов нет' },
                                            { value: 3, label: 'Недочетов нет вовсе' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`presentation-${option.value}`} />
                                                <Label htmlFor={`presentation-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Question 4 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">4. Степень того, насколько рассказчик раскрыл тему, наличие интересных фактов:</Label>
                                    <RadioGroup 
                                        value={evaluation.presentationQuality2 !== undefined ? evaluation.presentationQuality2.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('presentationQuality2', parseInt(value))}
                                    >
                                        {[
                                            { value: -1, label: 'Тема не раскрыта' },
                                            { value: 0, label: 'Тема раскрыта не полностью' },
                                            { value: 1, label: 'Тема раскрыта не полностью, но присутствуют интересные факты' },
                                            { value: 2, label: 'Тема раскрыта' },
                                            { value: 3, label: 'Тема раскрыта, интересные факты присутствуют' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`presentation2-${option.value}`} />
                                                <Label htmlFor={`presentation2-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Question 5a */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">5.а Считаете ли Вы, что докладчик продемонстрировал неординарные ораторские способности?</Label>
                                    <RadioGroup 
                                        value={evaluation.presentationQuality3 !== undefined ? evaluation.presentationQuality3.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('presentationQuality3', parseInt(value))}
                                    >
                                        {[
                                            { value: 0, label: 'Нет' },
                                            { value: 1, label: 'Да' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`presentation3-${option.value}`} />
                                                <Label htmlFor={`presentation3-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Question 5b */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">5.б Наличие иллюстрирующего материала:</Label>
                                    <RadioGroup 
                                        value={evaluation.materials !== undefined ? evaluation.materials.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('materials', parseInt(value))}
                                    >
                                        {[
                                            { value: 0, label: 'Отсутствует' },
                                            { value: 1, label: 'Присутствует' },
                                            { value: 2, label: 'Присутствует в разных формах' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`materials-${option.value}`} />
                                                <Label htmlFor={`materials-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Question 5c */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">5.в Можете ли Вы отметить что-то необычное в форме проведения семинара?</Label>
                                    <RadioGroup 
                                        value={evaluation.unusualThings !== undefined ? evaluation.unusualThings.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('unusualThings', parseInt(value))}
                                    >
                                        {[
                                            { value: 0, label: 'Нет или почти нет' },
                                            { value: 1, label: 'Да' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`unusual-${option.value}`} />
                                                <Label htmlFor={`unusual-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Question 6 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">6. Вызвал ли семинар обсуждение среди слушателей?</Label>
                                    <RadioGroup 
                                        value={evaluation.discussion !== undefined ? evaluation.discussion.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('discussion', parseInt(value))}
                                    >
                                        {[
                                            { value: 0, label: 'Нет или почти нет' },
                                            { value: 1, label: 'Непродолжительное' },
                                            { value: 2, label: 'Продолжительное' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`discussion-${option.value}`} />
                                                <Label htmlFor={`discussion-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Question 7 */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">7. Дополнительные баллы на ваше усмотрение:</Label>
                                    <RadioGroup 
                                        value={evaluation.generalQuality !== undefined ? evaluation.generalQuality.toString() : ""} 
                                        onValueChange={(value) => handleEvaluationChange('generalQuality', parseInt(value))}
                                    >
                                        {[
                                            { value: -1, label: '-1' },
                                            { value: 0, label: '0' },
                                            { value: 1, label: '1' },
                                            { value: 2, label: '2' },
                                            { value: 3, label: '3' }
                                        ].map(option => (
                                            <div key={option.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.value.toString()} id={`general-${option.value}`} />
                                                <Label htmlFor={`general-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Total Score Display */}
                                <div className="mt-6 p-4 bg-muted rounded-md">
                                    <div className="text-center">
                                        <div className="text-lg font-semibold">Общий балл: {calculateTotalScore()}</div>
                                        <div className="text-sm text-muted-foreground">Докладчик получит этот балл в виде баксов</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attendees Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Участники семинара</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="p-4 text-center">
                                        <Loading text="Загрузка списка пионеров..." />
                                    </div>
                                ) : (
                                    <DataTable
                                        columns={attendanceColumns}
                                        data={attendees}
                                        filterKey="name"
                                        filterPlaceholder="Найти участника..."
                                        rowSelectionMode="multiple"
                                        onRowSelectionChange={(selectedUsernames: string[]) => {
                                            setSelectedAttendees(selectedUsernames);
                                            setAttendees(prev =>
                                              prev.map(u => ({
                                                ...u,
                                                isSelected: selectedUsernames.includes(u.username)
                                              }))
                                            )
                                        }}
                                        emptyMessage="Пионеры не найдены"
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-center">
                            <Button
                                type="submit"
                                disabled={submitting || !isFormValid()}
                                size="lg"
                            >
                                {submitting ? "Обработка..." : "Начислить"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Background>
    )
} 