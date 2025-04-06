// src/app/expenses/page.tsx
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { getExpenses } from "@/actions/expense.action";
import { getCategories } from "@/actions/category.action";
import ExpenseCard from "@/components/ExpenseCard";
import ExpenseFilters from "@/components/ExpenseFilters";
import ExpensesLoading from "./loading";
import Link from "next/link";
import { deleteExpense } from "@/actions/expense.action";

interface ExpensesPageProps {
  searchParams: {
    category?: string;
    startDate?: string;
    endDate?: string;
    query?: string;
    page?: string;
  };
}

export default function ExpensesPage({ searchParams }: ExpensesPageProps) {
  return (
    <Suspense fallback={<ExpensesLoading />}>
      <ExpensesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ExpensesContent({ searchParams }: ExpensesPageProps) {
  // Parse search parameters
  const categoryId = searchParams.category;
  const startDate = searchParams.startDate ? new Date(searchParams.startDate) : undefined;
  const endDate = searchParams.endDate ? new Date(searchParams.endDate) : undefined;
  const searchQuery = searchParams.query;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  // Fetch data in parallel for better performance
  const [expensesData, categories] = await Promise.all([
    getExpenses({
      categoryId,
      startDate,
      endDate,
      searchQuery,
      page,
      limit: 10,
    }),
    getCategories(),
  ]);

  const { expenses, pagination } = expensesData;

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Calculate total expenses for the current filter
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount.toNumber(),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            {expenses.length > 0
              ? `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"} • ${formatCurrency(totalExpenses)}`
              : "Track and manage your expenses"}
          </p>
        </div>
        <Link href="/expenses/new">
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseFilters categories={categories} currentFilters={searchParams} />
        </CardContent>
      </Card>

      {/* Expenses List */}
      {expenses.length > 0 ? (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <ExpenseCard 
              key={expense.id} 
              expense={expense}
              onDelete={(id) => deleteExpense(id)}
            />
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {page > 1 && (
                <Link
                  href={{
                    pathname: "/expenses",
                    query: {
                      ...searchParams,
                      page: page - 1,
                    },
                  }}
                >
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </Link>
              )}

              <div className="flex items-center text-sm">
                Page {page} of {pagination.pages}
              </div>

              {page < pagination.pages && (
                <Link
                  href={{
                    pathname: "/expenses",
                    query: {
                      ...searchParams,
                      page: page + 1,
                    },
                  }}
                >
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No expenses found</p>
            <Link href="/expenses/new">
              <Button>Add Your First Expense</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}