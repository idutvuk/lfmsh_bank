import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { getPartyTextColorClass } from '@/lib/utils';
import type { UserData, Badge, UserListItem, getBadgeImageUrl } from '@/services/api';
import { getBadgeImageUrl as getBadgeUrl } from '@/services/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserNameProps {
    user: UserData | UserListItem;
    showPartyColor?: boolean;
    showBadge?: boolean;
    badgeSize?: 'small' | 'medium' | 'large' | 'original';
    className?: string;
}

export function UserName({ 
    user, 
    showPartyColor = true, 
    showBadge = true,
    badgeSize = 'small',
    className = ''
}: UserNameProps) {
    const navigate = useNavigate();
    const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);

    // Форматирование имени как "Фамилия Имя Отчество"
    const formatFullName = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 3) {
            return `${parts[0]} ${parts[1]} ${parts[2]}`;
        } else if (parts.length === 2) {
            return `${parts[0]} ${parts[1]}`;
        }
        return name;
    };

    // Обработка клика на имя - переход на страницу пользователя
    const handleNameClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(`/user/${user.username}`);
    };

    // Обработка клика на плашку - открытие диалога
    const handleBadgeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setBadgeDialogOpen(true);
    };

    // Определение размера плашки
    const badgeSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6', 
        lg: 'w-8 h-8'
    };

    // Мапинг размеров badge к ключам badgeSizeClasses
    const getSizeKey = (size: 'small' | 'medium' | 'large' | 'original'): 'sm' | 'md' | 'lg' => {
        switch(size) {
            case 'small': return 'sm';
            case 'medium': return 'md';
            case 'large': 
            case 'original': 
            default: return 'lg';
        }
    };

    // Цвет текста в зависимости от отряда
    const nameColorClass = showPartyColor ? getPartyTextColorClass(user.party) : '';

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            {/* Имя пользователя с навигацией */}
            <button
                onClick={handleNameClick}
                className={`hover:underline cursor-pointer ${nameColorClass} font-medium`}
                type="button"
            >
                {formatFullName(user.name)}
            </button>

            {/* Плашка (если есть и показывается) */}
            {showBadge && user.badge && (
                <button
                    onClick={handleBadgeClick}
                    className={`p-0 ${badgeSizeClasses[getSizeKey(badgeSize)]} flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer`}
                    type="button"
                    title={user.badge.name}
                >
                    <Avatar className={`${badgeSizeClasses[getSizeKey(badgeSize)]} border-0`}>
                        {user.badge.image_filename ? (
                            <AvatarImage
                                src={getBadgeUrl(user.badge.id, badgeSize)}
                                alt={user.badge.name}
                                onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.style.display = 'none';
                                    if (target.nextElementSibling) {
                                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                    }
                                }}
                            />
                        ) : null}
                        <AvatarFallback className="bg-gray-300 text-xs font-bold">
                            {user.badge.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </button>
            )}

            {/* Диалог с информацией о плашке */}
            {user.badge && (
                <AlertDialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
                    <AlertDialogContent className="text-center">
                        <AlertDialogHeader className="items-center">
                            <div className="flex justify-center mb-4">
                                <Avatar className="w-16 h-16 flex-shrink-0 border-0">
                                    {user.badge.image_filename ? (
                                        <AvatarImage
                                            src={getBadgeUrl(user.badge.id, 'large')}
                                            alt={user.badge.name}
                                            onError={(e) => {
                                                const target = e.currentTarget as HTMLImageElement;
                                                target.style.display = 'none';
                                                if (target.nextElementSibling) {
                                                    (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <AvatarFallback className="bg-gray-300 text-sm font-bold">
                                        {user.badge.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <AlertDialogTitle className="text-center">
                                {user.badge.name}
                            </AlertDialogTitle>
                            {user.badge.description && (
                                <AlertDialogDescription className="text-center mt-2">
                                    {user.badge.description}
                                </AlertDialogDescription>
                            )}
                        </AlertDialogHeader>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
} 