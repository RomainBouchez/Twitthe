// src/actions/budget.action.ts
"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "@/actions/user.action";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function createBudget(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const name = formData.get("name");
    const amount = formData.get("amount");
    const period = formData.get("period");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate") || null;
    const categoryId = formData.get("categoryId");

    if (!name || !amount || !period || !startDate) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate period is one of the allowed values
    if (!["monthly", "quarterly", "yearly"].includes(period.toString())) {
      return { success: false, error: "Invalid period" };
    }

    const budget = await prisma.budget.create({
      data: {
        name: name.toString(),
        amount: parseFloat(amount.toString()),
        period: period.toString() as any, // Cast to Prisma enum
        startDate: new Date(startDate.toString()),
        endDate: endDate ? new Date(endDate.toString()) : null,
        categoryId: categoryId?.toString() || null,
        userId: userId,
      },
    });

    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return { success: true, budget };
  } catch (error) {
    console.error("Failed to create budget:", error);
    return { success: false, error: "Failed to create budget" };
  }
}

export async function updateBudget(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const id = formData.get("id");
    const name = formData.get("name");
    const amount = formData.get("amount");
    const period = formData.get("period");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate") || null;
    const categoryId = formData.get("categoryId");

    if (!id || !name || !amount || !period || !startDate) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate period is one of the allowed values
    if (!["monthly", "quarterly", "yearly"].includes(period.toString())) {
      return { success: false, error: "Invalid period" };
    }

    // Verify the budget belongs to the user
    const existingBudget = await prisma.budget.findUnique({
      where: { id: id.toString() },
      select: { userId: true },
    });

    if (!existingBudget) {
      return { success: false, error: "Budget not found" };
    }

    if (existingBudget.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const budget = await prisma.budget.update({
      where: { id: id.toString() },
      data: {
        name: name.toString(),
        amount: parseFloat(amount.toString()),
        period: period.toString() as any, // Cast to Prisma enum
        startDate: new Date(startDate.toString()),
        endDate: endDate ? new Date(endDate.toString()) : null,
        categoryId: categoryId?.toString() || null,
      },
    });

    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return { success: true, budget };
  } catch (error) {
    console.error("Failed to update budget:", error);
    return { success: false, error: "Failed to update budget" };
  }
}

export async function deleteBudget(id: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    // Verify the budget belongs to the user
    const budget = await prisma.budget.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    if (budget.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete budget:", error);
    return { success: false, error: "Failed to delete budget" };
  }
}

export async function getBudgets() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Enhance budgets with spending data
    const enhancedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await getBudgetSpending(budget.id);
        return {
          ...budget,
          spent: spent || 0,
        };
      })
    );

    return enhancedBudgets;
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return [];
  }
}

export async function getBudgetById(id: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return null;

    const budget = await prisma.budget.findUnique({
      where: {
        id,
        userId, // Security: ensure budget belongs to user
      },
      include: {
        category: true,
      },
    });

    if (!budget) return null;

    // Enhance budget with spending data
    const spent = await getBudgetSpending(id);
    return {
      ...budget,
      spent: spent || 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    return null;
  }
}

async function getBudgetSpending(budgetId: string) {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      select: {
        userId: true,
        categoryId: true,
        period: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!budget) return 0;

    // Determine date range based on budget period
    let startDate = new Date(budget.startDate);
    let endDate = budget.endDate || new Date();

    // For active budgets without end date, set the appropriate period window
    if (!budget.endDate) {
      switch (budget.period) {
        case "monthly":
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case "quarterly":
          // Start 3 months ago or from budget start date, whichever is later
          const quarterStart = subMonths(startOfMonth(new Date()), 2);
          startDate = budget.startDate > quarterStart ? budget.startDate : quarterStart;
          endDate = endOfMonth(new Date());
          break;
        case "yearly":
          // Start from beginning of year or budget start date, whichever is later
          const yearStart = new Date(new Date().getFullYear(), 0, 1);
          startDate = budget.startDate > yearStart ? budget.startDate : yearStart;
          endDate = new Date();
          break;
      }
    }

    // Query expenses for the given category and date range
    const expenses = await prisma.expense.findMany({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    });

    // Sum up the expenses
    const totalSpent = expenses.reduce(
      (sum, expense) => sum + expense.amount.toNumber(),
      0
    );

    return totalSpent;
  } catch (error) {
    console.error("Error calculating budget spending:", error);
    return 0;
  }
}

export async function getBudgetInsights() {
  try {
    const userId = await getDbUserId();
    if (!userId) return null;

    // Get all budgets with their categories
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
      },
    });

    // Calculate spending for each budget
    const budgetWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await getBudgetSpending(budget.id);
        const percentage = budget.amount.toNumber() > 0 
          ? (spent / budget.amount.toNumber()) * 100 
          : 0;
        
        return {
          id: budget.id,
          name: budget.name,
          amount: budget.amount.toNumber(),
          spent,
          percentage,
          category: budget.category,
          status: percentage >= 100 
            ? "exceeded" 
            : percentage >= 90 
              ? "warning" 
              : "good",
        };
      })
    );

    // Get summary statistics
    const totalBudgeted = budgets.reduce(
      (sum, budget) => sum + budget.amount.toNumber(),
      0
    );

    const totalSpent = budgetWithSpending.reduce(
      (sum, budget) => sum + budget.spent,
      0
    );

    // Find biggest expenses by category this month
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    const categorySpending = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        expenseDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: 5,
    });

    // Get category details
    const topCategories = await Promise.all(
      categorySpending.map(async (item) => {
        if (!item.categoryId) {
          return {
            id: "uncategorized",
            name: "Uncategorized",
            color: "#A7C5EB",
            icon: "more-horizontal",
            amount: item._sum.amount?.toNumber() || 0,
          };
        }
        
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId },
        });

        return {
          id: item.categoryId,
          name: category?.name || "Unknown",
          color: category?.color || "#A7C5EB",
          icon: category?.icon || "more-horizontal",
          amount: item._sum.amount?.toNumber() || 0,
        };
      })
    );

    // Compare to previous month
    const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
    const prevMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const prevMonthTotal = await prisma.expense.aggregate({
      where: {
        userId,
        expenseDate: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate month-over-month change
    const prevMonthAmount = prevMonthTotal._sum.amount?.toNumber() || 0;
    const currentMonthAmount = totalSpent;
    const monthlyChange = prevMonthAmount > 0
      ? ((currentMonthAmount - prevMonthAmount) / prevMonthAmount) * 100
      : 0;

    return {
      budgets: budgetWithSpending,
      summary: {
        totalBudgeted,
        totalSpent,
        remaining: totalBudgeted - totalSpent,
        usagePercentage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      },
      topCategories,
      monthlyComparison: {
        currentMonth: {
          name: format(new Date(), "MMMM"),
          amount: currentMonthAmount,
        },
        previousMonth: {
          name: format(subMonths(new Date(), 1), "MMMM"),
          amount: prevMonthAmount,
        },
        changePercentage: monthlyChange,
      },
    };
  } catch (error) {
    console.error("Error fetching budget insights:", error);
    return null;
  }
}