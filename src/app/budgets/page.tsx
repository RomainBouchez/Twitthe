// src/app/budgets/page.tsx
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { getBudgets, deleteBudget } from "@/actions/budget.action";
import BudgetCard from "@/components/BudgetCard";
import Link from "next/link";

export default function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetsLoading />}>
      <BudgetsContent />
    </Suspense>
  );
}

async function BudgetsContent() {
  const budgets = await getBudgets();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">
            {budgets.length > 0
              ? `${budgets.length} active ${budgets.length === 1 ? "budget" : "budgets"}`
              : "Set budgets to manage your spending"}
          </p>
        </div>
        <Link href="/budgets/new">
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Create Budget
          </Button>
        </Link>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard 
              key={budget.id} 
              budget={budget}
              onDelete={() => {
                deleteBudget(budget.id);
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No budgets found</p>
            <Link href="/budgets/new">
              <Button>Create Your First Budget</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BudgetsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-10 w-40 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-60 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg overflow-hidden shadow-sm">
            <div className="p-4">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                  <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
              </div>
              <div className="h-7 w-28 bg-muted rounded animate-pulse mb-4"></div>
              <div className="h-2 w-full bg-muted rounded animate-pulse mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}