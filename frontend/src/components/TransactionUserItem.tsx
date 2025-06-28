import type { UserListItem } from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import { Link } from "react-router-dom"
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
}

export function TransactionUserItem({
    user,
    onSelect,
    onAmountChange,
    onResetAmount,
    defaultAmount,
}: TransactionUserItemProps) {
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
                className="col-span-3 flex items-center justify-between"
            >
                <Link to={`/user/${user.id}`}>
                     <Button variant="link" className="font-medium">
                        {user.name}
                     </Button>
                </Link>
                <span className="text-sm text-muted-foreground">{user.balance}@</span>
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
                            value={user.bucks}
                            className="bg-transparent w-16 border-0 text-right"
                            onChange={(e) => onAmountChange(user.id, Number(e.target.value))}
                        />
                    </div>
                )}
            </div>
        </Label>
    );
} 