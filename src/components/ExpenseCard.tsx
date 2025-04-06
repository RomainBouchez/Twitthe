// src/components/ExpenseCard.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontalIcon, 
  Receipt, 
  Trash2Icon, 
  PencilIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DeleteAlertDialog } from "@/components/DeleteAlertDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import Link from "next/link";

// Define the expense type based on your Prisma schema
type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Expense = {
  id: string;
  amount: number;
  description: string | null;
  expenseDate: Date;
  receiptImage: string | null;
  paymentMethod: string | null;
  createdAt: Date;
  category: Category | null;
};

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (id: string) => Promise<void>;
}

export default function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(expense.id);
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get appropriate category color or default
  const categoryColor = expense.category?.color || "#A7C5EB";
  
  // Format the expense date
  const formattedDate = formatDistanceToNow(new Date(expense.expenseDate), { addSuffix: true });

  return (
    <Card className="bg-card rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* EXPENSE HEADER */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border" style={{ backgroundColor: categoryColor }}>
            <AvatarImage src={`/icons/${expense.category?.icon || 'more-horizontal'}.svg`} />
          </Avatar>
          <div>
            <div className="font-semibold leading-none">{expense.category?.name || "Uncategorized"}</div>
            <div className="text-xs text-muted-foreground">{formattedDate}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatCurrency(expense.amount)}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/expenses/edit/${expense.id}`}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit expense
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={handleDelete}>
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete expense
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* EXPENSE CONTENT */}
      <CardContent className="pt-0 pb-4">
        <div className="text-sm">{expense.description}</div>
        
        {/* PAYMENT METHOD IF EXISTS */}
        {expense.paymentMethod && (
          <div className="mt-2 text-xs text-muted-foreground">
            Payment: {expense.paymentMethod}
          </div>
        )}
        
        {/* RECEIPT IMAGE IF EXISTS */}
        {expense.receiptImage && (
          <div className="mt-3">
            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
              <Receipt className="h-3 w-3" />
              <span>Receipt</span>
            </div>
            <div className="rounded-md overflow-hidden border">
              <img 
                src={expense.receiptImage} 
                alt="Receipt" 
                className="w-full h-auto object-cover max-h-40" 
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}