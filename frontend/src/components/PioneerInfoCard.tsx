import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Wallet, AlertTriangle, Send, Plus, Minus, Upload, X } from "lucide-react"
import { type UserData, uploadAvatar, deleteAvatar, getAvatarUrl } from "@/services/api"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"

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
  }, [userData.username])

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
      await uploadAvatar(userData.id, file)
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
      await deleteAvatar(userData.id)
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
            <User className="h-5 w-5" />
            {userData.name}
            <div className="flex gap-2 ml-2">
              {userData.party > 0 && (
                <Badge variant="default">{userData.party} отряд</Badge>
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
            <Avatar className="h-16 w-16 border-2 border-primary">
              {hasAvatar ? (
                <AvatarImage src={getAvatarUrl(userData.username)} alt={userData.name} />
              ) : (
                <AvatarFallback>{getInitials()}</AvatarFallback>
              )}
            </Avatar>
            
            {/* Avatar controls - only show if it's the user's own profile */}
            {isOwnProfile && (
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