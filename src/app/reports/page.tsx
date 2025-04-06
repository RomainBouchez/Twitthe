// src/app/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExpenseStatistics } from "@/actions/expense.action";
import { CalendarIcon, Download, TrendingDown, TrendingUp } from "lucide-react";
import ExpenseChart from "@/components/ExpenseChart";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [comparisonStats, setComparisonStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getExpenseStatistics(period as "week" | "month" | "year");
        setStats(result);

        // Get previous period for comparison
        const prevResult = await getExpenseStatistics(period as "week" | "month" | "year");
        setComparisonStats(prevResult);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get period title
  const getPeriodTitle = () => {
    switch(period) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      default:
        return "This Month";
    }
  };

  // Get date range string
  const getDateRangeString = () => {
    const now = new Date();
    
    switch(period) {
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return `${format(startOfWeek, "MMM d")} - ${format(now, "MMM d, yyyy")}`;
      case "month":
        return format(now, "MMMM yyyy");
      case "year":
        return format(now, "yyyy");
      default:
        return format(now, "MMMM yyyy");
    }
  };

  // Calculate change percentage
  const calculateChange = () => {
    if (!stats || !comparisonStats) return 0;
    
    if (comparisonStats.total === 0) return 100;
    
    return ((stats.total - comparisonStats.total) / comparisonStats.total) * 100;
  };

  const changePercentage = calculateChange();
  const isIncreasing = changePercentage > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Analysis and insights for your expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : !stats ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">No expense data available</p>
              <Button asChild>
                <a href="/expenses/new">Add Your First Expense</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="overview" className="space-y-6">
              {/* Period Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">{getPeriodTitle()}</h2>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getDateRangeString()}
                </div>
              </div>

              {/* Summary Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Expenses</p>
                      <p className="text-3xl font-bold">{formatCurrency(stats.total)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {isIncreasing ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-500">+{Math.abs(changePercentage).toFixed(1)}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-500">-{Math.abs(changePercentage).toFixed(1)}%</span>
                          </>
                        )}
                        <span className="text-xs text-muted-foreground">vs. previous {period}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm">Top Category</p>
                      {stats.byCategory.length > 0 ? (
                        <>
                          <p className="text-xl font-semibold">{stats.byCategory[0].name}</p>
                          <p className="text-sm">{formatCurrency(stats.byCategory[0].total)}</p>
                        </>
                      ) : (
                        <p className="text-xl">No data</p>
                      )}
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm">Daily Average</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(stats.dailyExpenses.length > 0 
                          ? stats.total / stats.dailyExpenses.length 
                          : 0
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Spending Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ExpenseChart data={stats.dailyExpenses} />
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Top Categories</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <CategoryBreakdown categories={stats.byCategory} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <CategoryBreakdown categories={stats.byCategory} />
                </CardContent>
              </Card>

              {/* Category details table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Category Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium">Category</th>
                          <th className="px-4 py-3 text-right font-medium">Amount</th>
                          <th className="px-4 py-3 text-right font-medium">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.byCategory.map((category: any) => (
                          <tr key={category.id} className="border-b">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              ></div>
                              {category.name}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(category.total)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {((category.total / stats.total) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Spending Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ExpenseChart data={stats.dailyExpenses} />
                </CardContent>
              </Card>

              {/* Comparison with previous periods */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Period Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Current {period}</div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(stats.total)}</div>
                        <div className="text-xs text-muted-foreground">{getDateRangeString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Previous {period}</div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(comparisonStats?.total || 0)}</div>
                        <div className="text-xs text-muted-foreground">
                          {comparisonStats ? "Previous period" : "No data available"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm font-medium">Change</div>
                      <div className={`font-medium ${isIncreasing ? "text-red-500" : "text-green-500"}`}>
                        {isIncreasing ? "+" : "-"}{Math.abs(changePercentage).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}