import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Wallet, AlertTriangle, Send, Plus, Minus, Upload, X, Edit, Check } from "lucide-react"
import { type UserData, uploadAvatar, deleteAvatar, getAvatarUrl } from "@/services/api"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { getPartyBgColorClass } from "@/lib/utils"
import { UserName } from "./UserName"
import { Textarea } from "@/components/ui/textarea"

interface PioneerInfoCardProps {
  userData: UserData
  onNavigate: (path: string) => void
  isOwnProfile?: boolean
  isStaffViewing?: boolean
  onReward?: () => void
  onPenalty?: () => void
  onAvatarChange?: (userData: UserData) => void
}

export function PioneerInfoCard({
  userData,
  onNavigate,
  isOwnProfile = false,
  isStaffViewing = false,
  onReward,
  onPenalty,
  onAvatarChange
}: PioneerInfoCardProps) {
  const showCreateTransaction = isOwnProfile
  const showStaffButtons = isStaffViewing && !isOwnProfile
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hasAvatar, setHasAvatar] = useState<boolean>(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState(userData.bio || "")

  // Check if avatar exists
  const checkAvatar = () => {
    if (!userData.username) return

    // Create a temporary image element to check if avatar exists
    const img = new Image()
    img.onload = () => setHasAvatar(true)
    img.onerror = () => setHasAvatar(false)
    img.src = getAvatarUrl(userData.username)
  }

  // Check for avatar on component mount and when username changes
  useEffect(() => {
    checkAvatar()
    setBio(userData.bio || "")
  }, [userData.username, userData.bio])

  // Handler for avatar upload button click
  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Handler for file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Файл должен быть изображением')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB')
      return
    }

    try {
      setIsUploading(true)
      await uploadAvatar(userData.username, file)
      toast.success('Аватар успешно обновлен')
      setHasAvatar(true)

      // Update user data in parent component if needed
      if (onAvatarChange) {
        onAvatarChange(userData)
      }
    } catch (error) {
      toast.error('Ошибка при загрузке аватара')
      console.error('Avatar upload error:', error)
    } finally {
      setIsUploading(false)
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handler for avatar deletion
  const handleDeleteAvatar = async () => {
    if (!hasAvatar) return

    try {
      setIsUploading(true)
      await deleteAvatar(userData.username)
      toast.success('Аватар удален')
      setHasAvatar(false)

      // Update user data in parent component if needed
      if (onAvatarChange) {
        onAvatarChange(userData)
      }
    } catch (error) {
      toast.error('Ошибка при удалении аватара')
      console.error('Avatar deletion error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  // Handler for bio edit toggle
  const handleEditBioClick = () => {
    setEditingBio(!editingBio)
    if (!editingBio) {
      // If starting to edit, set bio to current value
      setBio(userData.bio || "")
    }
  }

  // Handler for bio save
  const handleSaveBio = async () => {
    try {
      // API call to update user bio
      const response = await fetch(`/api/v1/users/${userData.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          username: userData.username,
          bio: bio
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        toast.success('Биография обновлена')

        // Update user data in parent component if needed
        if (onAvatarChange) {
          onAvatarChange({...userData, bio})
        }

        setEditingBio(false)
      } else {
        toast.error('Не удалось обновить биографию')
      }
    } catch (error) {
      toast.error('Ошибка при обновлении биографии')
      console.error('Bio update error:', error)
    }
  }

  // Get initial letters for avatar fallback
  const getInitials = () => {
    const nameParts = userData.name.split(' ')
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }
    return userData.name.slice(0, 2).toUpperCase()
  }

  return (
    <Card variant="clean">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserName
              user={userData}
              showPartyColor={true}
              badgeSize="large"
            />
            <div className="flex gap-2 ml-2">
              {userData.party > 0 && (
                <Badge
                  variant="default"
                  className={`${getPartyBgColorClass(userData.party)} text-white border-none`}
                >
                  {userData.party} отряд
                </Badge>
              )}
              {isOwnProfile === false && !userData.is_active && (
                <Badge variant="neutral" className="bg-red-300">неактивен</Badge>
              )}
              <Badge variant={userData.staff ? "default" : "neutral"}>
                {userData.staff ? "педсостав" : "пионер"}
              </Badge>
            </div>
          </CardTitle>

          {/* Avatar section */}
          <div className="relative">
            <div className="border-2 border-primary overflow-hidden rounded-md">
              {hasAvatar ? (
                <img
                  src={getAvatarUrl(userData.username, 'large')}
                  alt={userData.name}
                  className="h-24 w-24 object-cover"
                />
              ) : (
                <div className="h-24 w-24 flex items-center justify-center bg-secondary-background text-foreground font-base">
                  {getInitials()}
                </div>
              )}
            </div>

            {/* Avatar controls - only show if it's the user's own profile */}
            {isOwnProfile && userData.staff && (
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <Button
                  size="icon"
                  className="h-7 w-7 rounded-full bg-background"
                  onClick={handleAvatarUploadClick}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4" />
                </Button>

                {hasAvatar && (
                  <Button
                    size="icon"
                    className="h-7 w-7 rounded-full bg-background text-destructive"
                    onClick={handleDeleteAvatar}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bio section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">О себе</h3>
            {isOwnProfile && (
              <Button
                variant="text"
                size="sm"
                className="h-6 px-2"
                onClick={handleEditBioClick}
              >
                {editingBio ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {editingBio ? (
            <div className="space-y-2">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о себе..."
                className="min-h-[100px] resize-none"
                maxLength={1000}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setEditingBio(false)
                    setBio(userData.bio || "")
                  }}
                >
                  Отмена
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveBio}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {userData.bio || (isOwnProfile ? "Добавьте информацию о себе..." : "Нет информации")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <Card variant="clean" className="bg-[#1e99a0]/10">
            <CardContent className="flex items-center gap-3 p-3">
              <Wallet className="h-6 w-6 text-[#1e99a0]" />
              <div>
                <p className="text-sm text-[#1e99a0] font-bold">Баланс</p>
                <p className="text-xl font-bold text-[#1e99a0]">{userData.balance}@</p>
              </div>
            </CardContent>
          </Card>

          {userData.expected_penalty > 0 && (
            <Card variant="clean" className="bg-[#d84081]/10">
              <CardContent className="flex items-center gap-3 p-3">
                <AlertTriangle className="h-6 w-6 text-[#d84081]" />
                <div>
                  <p className="text-sm text-[#d84081] font-bold">Ожидаемый штраф</p>
                  <p className="text-xl font-bold text-[#d84081]">{userData.expected_penalty}@</p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {showCreateTransaction && (
          <Button
            className="w-full h-12"
            onClick={() => onNavigate('/create-transfer')}
          >
            <Send className="h-5 w-5 mr-2" />
            Создать транзакцию
          </Button>
        )}

        {showStaffButtons && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-12"
              onClick={onReward}
              variant="default"
            >
              <Plus className="h-5 w-5 mr-2" />
              Начислить
            </Button>
            <Button
              className="h-12 bg-red-500"
              onClick={onPenalty}
            >
              <Minus className="h-5 w-5 mr-2" />
              Штраф
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 