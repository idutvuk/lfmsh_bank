import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Users, Edit, Upload, X, GraduationCap } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { uploadAvatar, deleteAvatar, getAvatarUrl, type UserData } from "@/services/api"

interface StaffInfoCardProps {
  onNavigate: (path: string) => void
  userData: UserData
  onAvatarChange?: (userData: UserData) => void
}

export function StaffInfoCard({ onNavigate, userData, onAvatarChange }: StaffInfoCardProps) {
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
            {userData.name}
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
            
            {/* Avatar controls */}
            <div className="absolute -bottom-2 -right-2 flex gap-1">
              <Button 
                size="icon"
                variant="noShadow"
                className="h-7 w-7 rounded-full bg-background text-destructive"
                onClick={handleAvatarUploadClick}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 text-foreground"/>
              </Button>
              
              {hasAvatar && (
                <Button 
                  size="icon"
                  variant="noShadow"
                  className="h-7 w-7 rounded-full bg-background text-destructive"
                  onClick={handleDeleteAvatar}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 text-foreground" />
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="h-12 w-full bg-[#f3bb4c] hover:bg-[#f3bb4c]/90"
          onClick={() => onNavigate('/pioneers')}
        >
          <Users className="h-5 w-5 mr-2" />
          Пионеры
        </Button>
        
        <Button 
          className="h-12 w-full"
          onClick={() => onNavigate('/create-transfer')}
        >
          <Edit className="h-5 w-5 mr-2" />
          Создать транзакцию
        </Button>

        <Button 
          className="h-12 w-full"
          onClick={() => onNavigate('/seminar')}
        >
          <GraduationCap className="h-5 w-5 mr-2" />
          Семинар
        </Button>
      </CardContent>
    </Card>
  )
} 