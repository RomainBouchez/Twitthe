"use client";

import Link from "next/link";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

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
  category: Category | null;
  spent: number;
  percentage: number;
  status: "exceeded" | "warning" | "good";
};

interface BudgetStatusProps {
  budgets: Budget[];
}

export default function BudgetStatus({ budgets }: BudgetStatusProps) {
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get appropriate progress bar color based on status
  const getProgressColor = (status: string) => {
    switch (status) {
      case "exceeded":
        return "bg-red-500";
      case "warning":
        return "bg-orange-500";
      default:
        return "bg-green-500";
    }
  };

  if (budgets.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-2">No budgets created yet</p>
        <Link 
          href="/budgets/new" 
          className="text-sm text-primary hover:underline"
        >
          Create your first budget
        </Link>
      </div>
    );
  }

  // Sort budgets by status: exceeded first, then warning, then good
  const sortedBudgets = [...budgets].sort((a, b) => {
    const statusOrder = { exceeded: 0, warning: 1, good: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="space-y-4">
      {sortedBudgets.map((budget) => (
        <div 
          key={budget.id}
          className="p-3 rounded-md border hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border" style={{ backgroundColor: budget.category?.color || "#A7C5EB" }}>
                <AvatarImage src={`/icons/${budget.category?.icon || 'more-horizontal'}.svg`} />
              </Avatar>
              <Link 
                href={`/budgets/${budget.id}`}
                className="font-medium hover:underline"
              >
                {budget.name}
              </Link>
            </div>
            <div className="text-sm">
              <span className={budget.status === "exceeded" ? "text-red-500 font-semibold" : ""}>
                {formatCurrency(budget.spent)}
              </span>
              <span className="text-muted-foreground"> / {formatCurrency(budget.amount)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(budget.status)}`} 
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              ></div>
            </div>
            <span className={`text-xs font-medium ${
              budget.status === "exceeded" 
                ? "text-red-500"
                : budget.status === "warning"
                  ? "text-orange-500"
                  : "text-muted-foreground"
            }`}>
              {budget.percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}