// src/components/RecentExpenses.tsx
"use client";

import { useEffect, useState } from "react";
import { getExpenses } from "@/actions/expense.action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Expense = {
  id: string;
  amount: { toNumber: () => number };
  description: string | null;
  expenseDate: Date;
  category: Category | null;
};

export default function RecentExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        const result = await getExpenses({ limit: 5 });
        setExpenses(result.expenses);
      } catch (error) {
        console.error("Error fetching recent expenses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-2">No expenses recorded yet</p>
        <Link 
          href="/expenses/new" 
          className="text-sm text-primary hover:underline"
        >
          Add your first expense
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <div 
          key={expense.id}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border" style={{ backgroundColor: expense.category?.color || "#A7C5EB" }}>
              <AvatarImage src={`/icons/${expense.category?.icon || 'more-horizontal'}.svg`} />
            </Avatar>
            <div>
              <div className="font-medium">{expense.description}</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(expense.expenseDate), { addSuffix: true })}
                {expense.category && (
                  <> • {expense.category.name}</>
                )}
              </div>
            </div>
          </div>
          <div className="font-semibold">
            {formatCurrency(expense.amount.toNumber())}
          </div>
        </div>
      ))}
    </div>
  );
}