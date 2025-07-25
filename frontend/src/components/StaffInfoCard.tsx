import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Users, Edit, Upload, X, GraduationCap, Check } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { uploadAvatar, deleteAvatar, getAvatarUrl, type UserData } from "@/services/api"
import { Textarea } from "@/components/ui/textarea"

interface StaffInfoCardProps {
  onNavigate: (path: string) => void
  userData: UserData
  onAvatarChange?: (userData: UserData) => void
}

export function StaffInfoCard({ onNavigate, userData, onAvatarChange }: StaffInfoCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hasAvatar, setHasAvatar] = useState<boolean>(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState(userData.bio || "")
  const [editingPosition, setEditingPosition] = useState(false)
  const [position, setPosition] = useState(userData.position || "")

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
    setPosition(userData.position || "")
  }, [userData.username, userData.bio, userData.position])

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

  // Handler for position edit toggle
  const handleEditPositionClick = () => {
    setEditingPosition(!editingPosition)
    if (!editingPosition) {
      // If starting to edit, set position to current value
      setPosition(userData.position || "")
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

  // Handler for position save
  const handleSavePosition = async () => {
    try {
      // API call to update user position
      const response = await fetch(`/api/v1/users/${userData.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          username: userData.username,
          position: position
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        toast.success('Должность обновлена')

        // Update user data in parent component if needed
        if (onAvatarChange) {
          onAvatarChange({...userData, position})
        }

        setEditingPosition(false)
      } else {
        toast.error('Не удалось обновить должность')
      }
    } catch (error) {
      toast.error('Ошибка при обновлении должности')
      console.error('Position update error:', error)
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
      <CardContent>
        {/* Position section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Должность</h3>
            <Button
              variant="text"
              size="sm"
              className="h-6 px-2"
              onClick={handleEditPositionClick}
            >
              {editingPosition ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
          </div>

          {editingPosition ? (
            <div className="space-y-2">
              <Textarea
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Укажите вашу должность..."
                className="min-h-[60px] resize-none"
                maxLength={200}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setEditingPosition(false)
                    setPosition(userData.position || "")
                  }}
                >
                  Отмена
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSavePosition}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {userData.position || "Должность не указана"}
            </p>
          )}
        </div>

        {/* Bio section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">О себе</h3>
            <Button
              variant="text"
              size="sm"
              className="h-6 px-2"
              onClick={handleEditBioClick}
            >
              {editingBio ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
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
              {userData.bio || "Нет информации"}
            </p>
          )}
        </div>

        <div className="space-y-3">
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
        </div>
      </CardContent>
    </Card>
  )
} 