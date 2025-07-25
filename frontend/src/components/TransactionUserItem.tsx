import type { UserListItem } from "@/services/api";
import { getAvatarUrl } from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

interface UserTransactionListItem extends UserListItem {
    isSelected: boolean;
    bucks: number;
}

interface TransactionUserItemProps {
    user: UserTransactionListItem;
    onSelect: (user: UserTransactionListItem) => void;
    onAmountChange: (userId: number, amount: number) => void;
    onResetAmount: (userId: number) => void;
    defaultAmount: number;
    transactionType?: string;
}

export function TransactionUserItem({
    user,
    onSelect,
    onAmountChange,
    onResetAmount,
    defaultAmount,
    transactionType,
}: TransactionUserItemProps) {
    const displayAmount = transactionType === "fine" ? -user.bucks : user.bucks;
    const [hasAvatar, setHasAvatar] = useState<boolean>(false);
    
    // Check if avatar exists
    useEffect(() => {
        if (!user.username) return;
        
        // Create a temporary image element to check if avatar exists
        const img = new Image();
        img.onload = () => setHasAvatar(true);
        img.onerror = () => setHasAvatar(false);
        img.src = getAvatarUrl(user.username, 'small');
    }, [user.username]);
    
    // Get initial letters for avatar fallback
    const getInitials = () => {
        const nameParts = user.name.split(' ');
        if (nameParts.length >= 2) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return user.name.slice(0, 2).toUpperCase();
    };
    
    return (
        <Label
            htmlFor={user.id.toString()}
            key={user.id}
            className="grid grid-cols-7 items-center px-4 py-3 hover:bg-gray-600/10 border-b border-gray-200/20"
        >
            {/* Checkbox column */}
            <div className="col-span-1">
                <Checkbox
                    id={user.id.toString()}
                    className="rounded-xs border-none"
                    checked={user.isSelected}
                    onClick={() => onSelect(user)}
                />
            </div>

            {/* User info column */}
            <div
                className="col-span-3 flex items-center"
            >
                <Avatar className="h-8 w-8 mr-2">
                    {hasAvatar ? (
                        <AvatarImage src={getAvatarUrl(user.username, 'small')} alt={user.name} />
                    ) : (
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                    )}
                </Avatar>
                
                <div className="flex items-center justify-between flex-1">
                    <Link to={`/user/${user.id}`}>
                        <Button variant="link" className="font-medium">
                            {user.name}
                        </Button>
                    </Link>
                    <p className="col-span-2">{user.party} отряд</p>
                    <span className="text-sm text-muted-foreground">{user.balance}@</span>
                </div>
            </div>

            {/* Amount input column */}
            <div className="col-span-3 flex items-center justify-end">
                {user.isSelected && defaultAmount !== 0 && (
                    <div className="flex items-center">
                        {user.bucks !== defaultAmount && (
                            <Button
                                variant="text"
                                type="button"
                                size="sm"
                                onClick={() => onResetAmount(user.id)}
                                className="text-xl mr-2"
                            >
                                ⟳
                            </Button>
                        )}
                        <Input
                            value={displayAmount}
                            className="bg-transparent w-16 border-0 text-right"
                            onChange={(e) => {
                                const inputValue = Number(e.target.value);
                                onAmountChange(user.id, inputValue);
                            }}
                        />
                    </div>
                )}
            </div>
        </Label>
    );
} 