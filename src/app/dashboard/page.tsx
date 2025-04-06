// src/app/dashboard/page.tsx
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  Calendar,
  AlertCircle
} from "lucide-react";
import { getExpenseStatistics } from "@/actions/expense.action";
import { getBudgetInsights } from "@/actions/budget.action";
import { getUpcomingPayments } from "@/actions/membership.action";
import { format } from "date-fns";
import DashboardLoading from "./loading";
import ExpenseChart from "@/components/ExpenseChart";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import RecentExpenses from "@/components/RecentExpenses";
import UpcomingPayments from "@/components/UpcomingPayments";
import BudgetStatus from "@/components/BudgetStatus";

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // Fetch data in parallel for better performance
  const [expenseStats, budgetInsights, upcomingPayments] = await Promise.all([
    getExpenseStatistics("month"),
    getBudgetInsights(),
    getUpcomingPayments(7)
  ]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get today's date
  const today = format(new Date(), "MMMM d, yyyy");
  
  // Handle the case where data isn't available yet
  if (!expenseStats || !budgetInsights) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Welcome to your personal expense tracker. Start adding expenses to see your financial insights.</p>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No data available yet.</p>
                <a href="/expenses/new" className="text-primary hover:underline">
                  Add your first expense
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Destructure data for easier access
  const { total: monthlyExpenses, byCategory: expensesByCategory, dailyExpenses } = expenseStats;
  const { 
    summary: { totalBudgeted, totalSpent, remaining, usagePercentage },
    monthlyComparison: { currentMonth, previousMonth, changePercentage },
    budgets,
    topCategories
  } = budgetInsights;

  // Determine if spending is increasing or decreasing from previous month
  const isIncreasing = changePercentage > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">As of {today}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {isIncreasing ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{Math.abs(changePercentage).toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{Math.abs(changePercentage).toFixed(1)}%</span>
                </>
              )}
              <span>vs. {previousMonth.name}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Budget Status
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(remaining)}</div>
            <div className="flex items-center mt-1 space-x-2">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">{usagePercentage.toFixed(0)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalSpent)} of {formatCurrency(totalBudgeted)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Top Category
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{topCategories[0].name}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(topCategories[0].amount)} this month
                </p>
              </>
            ) : (
              <>
                <div className="text-lg">No expenses yet</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Add expenses to see top categories
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Payments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingPayments.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{upcomingPayments.length}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  {formatCurrency(upcomingPayments.reduce((sum, payment) => 
                    sum + payment.amount.toNumber(), 0
                  ))} due in the next 7 days
                </p>
              </>
            ) : (
              <>
                <div className="text-lg">No upcoming payments</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All clear for the next 7 days
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ExpenseChart data={dailyExpenses} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <CategoryBreakdown categories={expensesByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Budget and Recent Expenses Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetStatus budgets={budgets} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Expenses</CardTitle>
              <a 
                href="/expenses" 
                className="text-sm text-primary hover:underline"
              >
                View all
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <RecentExpenses />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments Row */}
      {upcomingPayments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Payments</CardTitle>
              <a 
                href="/memberships" 
                className="text-sm text-primary hover:underline"
              >
                View all
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <UpcomingPayments payments={upcomingPayments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}