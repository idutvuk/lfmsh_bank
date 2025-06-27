import type { UserListItem } from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    defaultAmount
}: TransactionUserItemProps) {
    return (
        <div
            key={user.id}
            className={`flex items-center px-4 py-3 hover:bg-muted cursor-pointer ${user.isSelected ? 'bg-muted/50' : ''}`}
        >
            <div className="flex-1 flex items-center">
                <Checkbox
                    className="mr-3"
                    checked={user.isSelected}
                    onClick={() => onSelect(user)}
                />
                <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">Баланс: {user.balance}@</p>
                </div>
            </div>

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
                        className="bg-transparent w-20"
                        onChange={(e) => onAmountChange(user.id, Number(e.target.value))}
                    />
                </div>
            )}
        </div>
    );
} 