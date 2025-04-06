// src/components/BudgetCard.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronRightIcon, 
  EditIcon, 
  MoreHorizontalIcon, 
  Trash2Icon 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { DeleteAlertDialog } from "@/components/DeleteAlertDialog";
import Link from "next/link";
import toast from "react-hot-toast";
import { deleteBudget } from "@/actions/budget.action";

// Define types based on your Prisma schema
type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Budget = {
  id: string;
  name: string;
  amount: number;
  period: "monthly" | "quarterly" | "yearly";
  startDate: Date;
  endDate: Date | null;
  spent?: number;  // This would be calculated
  category: Category | null;
};

interface BudgetCardProps {
  budget: Budget;
  onDelete?: () => void;
}

export default function BudgetCard({ budget, onDelete }: BudgetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!budget.spent) return 0;
    const percentage = (budget.spent / budget.amount) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };
  
  const progressPercentage = calculateProgress();
  
  // Determine background color based on percentage
  const getProgressColor = () => {
    if (progressPercentage >= 90) return "bg-red-500";
    if (progressPercentage >= 75) return "bg-orange-500";
    if (progressPercentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteBudget(budget.id);
      
      if (result.success) {
        toast.success("Budget deleted successfully");
        if (onDelete) onDelete();
      } else {
        throw new Error(result.error || "Failed to delete budget");
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete budget");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format period for display
  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };
  
  // Get category color or default
  const categoryColor = budget.category?.color || "#A7C5EB";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8" style={{ backgroundColor: categoryColor }}>
            <AvatarImage src={`/icons/${budget.category?.icon || 'more-horizontal'}.svg`} />
          </Avatar>
          <CardTitle className="text-base font-medium">{budget.name}</CardTitle>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/budgets/edit/${budget.id}`}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit budget
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500"
              onClick={handleDelete}
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              Delete budget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between mt-2">
          <div className="text-2xl font-bold">
            {formatCurrency(budget.amount)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatPeriod(budget.period)}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>
              {budget.spent 
                ? `${formatCurrency(budget.spent)} spent` 
                : 'No expenses yet'}
            </span>
            <span className={progressPercentage >= 90 ? "text-red-500 font-medium" : ""}>
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`${getProgressColor()} h-2 rounded-full`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="text-muted-foreground">Category: </span>
            <span>{budget.category?.name || "Uncategorized"}</span>
          </div>
          <Link href={`/budgets/${budget.id}`}>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Details
              <ChevronRightIcon className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}