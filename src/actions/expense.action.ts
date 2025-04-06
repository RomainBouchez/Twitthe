// src/actions/expense.action.ts
"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "@/actions/user.action";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const amount = formData.get("amount");
    const description = formData.get("description");
    const expenseDate = formData.get("expenseDate");
    const receiptImage = formData.get("receiptImage");
    const paymentMethod = formData.get("paymentMethod");
    const categoryId = formData.get("categoryId");

    if (!amount || !description || !expenseDate || !categoryId) {
      return { success: false, error: "Missing required fields" };
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount.toString()),
        description: description.toString(),
        expenseDate: new Date(expenseDate.toString()),
        receiptImage: receiptImage?.toString() || null,
        paymentMethod: paymentMethod?.toString() || null,
        categoryId: categoryId.toString(),
        userId: userId,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true, expense };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { success: false, error: "Failed to create expense" };
  }
}

export async function updateExpense(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const id = formData.get("id");
    const amount = formData.get("amount");
    const description = formData.get("description");
    const expenseDate = formData.get("expenseDate");
    const receiptImage = formData.get("receiptImage");
    const paymentMethod = formData.get("paymentMethod");
    const categoryId = formData.get("categoryId");

    if (!id || !amount || !description || !expenseDate || !categoryId) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify the expense belongs to the user
    const existingExpense = await prisma.expense.findUnique({
      where: { id: id.toString() },
      select: { userId: true },
    });

    if (!existingExpense) {
      return { success: false, error: "Expense not found" };
    }

    if (existingExpense.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const expense = await prisma.expense.update({
      where: { id: id.toString() },
      data: {
        amount: parseFloat(amount.toString()),
        description: description.toString(),
        expenseDate: new Date(expenseDate.toString()),
        receiptImage: receiptImage?.toString() || null,
        paymentMethod: paymentMethod?.toString() || null,
        categoryId: categoryId.toString(),
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true, expense };
  } catch (error) {
    console.error("Failed to update expense:", error);
    return { success: false, error: "Failed to update expense" };
  }
}

export async function deleteExpense(id: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    // Verify the expense belongs to the user
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!expense) {
      return { success: false, error: "Expense not found" };
    }

    if (expense.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.expense.delete({
      where: { id },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

export async function getExpenses(options: {
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
  limit?: number;
  page?: number;
} = {}) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { expenses: [], pagination: { total: 0, pages: 0, page: 1, limit: 10 } };

    const { 
      categoryId, 
      startDate, 
      endDate, 
      searchQuery, 
      limit = 10, 
      page = 1 
    } = options;

    // Build the where clause based on provided filters
    const where: any = {
      userId,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = startDate;
      }
      if (endDate) {
        where.expenseDate.lte = endDate;
      }
    }

    if (searchQuery) {
      where.OR = [
        {
          description: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          paymentMethod: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          expenseDate: "desc",
        },
        take: limit,
        skip,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { 
      expenses: [], 
      pagination: { total: 0, pages: 0, page: 1, limit: 10 } 
    };
  }
}

export async function getExpenseById(id: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return null;

    const expense = await prisma.expense.findUnique({
      where: {
        id,
        userId, // Security: ensure expense belongs to user
      },
      include: {
        category: true,
      },
    });

    return expense;
  } catch (error) {
    console.error("Error fetching expense:", error);
    return null;
  }
}

export async function getExpenseStatistics(period: "week" | "month" | "year" = "month") {
  try {
    const userId = await getDbUserId();
    if (!userId) return null;

    // Calculate date ranges based on period
    const now = new Date();
    let startDate = new Date();

    if (period === "week") {
      // Set to start of current week (Sunday)
      startDate.setDate(now.getDate() - now.getDay());
    } else if (period === "month") {
      // Set to start of current month
      startDate.setDate(1);
    } else if (period === "year") {
      // Set to start of current year
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Reset time to start of the day
    startDate.setHours(0, 0, 0, 0);

    // Get total expenses for the period
    const totalExpenses = await prisma.expense.aggregate({
      where: {
        userId,
        expenseDate: {
          gte: startDate,
          lte: now,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get expenses by category
    const expensesByCategory = await prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { isDefault: true },
        ],
        expenses: {
          some: {
            userId,
            expenseDate: {
              gte: startDate,
              lte: now,
            },
          },
        },
      },
      include: {
        expenses: {
          where: {
            userId,
            expenseDate: {
              gte: startDate,
              lte: now,
            },
          },
          select: {
            amount: true,
          },
        },
      },
    });

    // Calculate totals by category
    const categoryTotals = expensesByCategory.map(category => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      total: category.expenses.reduce((sum, expense) => sum + expense.amount.toNumber(), 0),
    }));

    // Get daily expenses for the period (for chart data)
    const dailyExpenses = await prisma.expense.groupBy({
      by: ['expenseDate'],
      where: {
        userId,
        expenseDate: {
          gte: startDate,
          lte: now,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        expenseDate: 'asc',
      },
    });

    return {
      total: totalExpenses._sum.amount?.toNumber() || 0,
      byCategory: categoryTotals,
      dailyExpenses: dailyExpenses.map(item => ({
        date: item.expenseDate,
        amount: item._sum.amount?.toNumber() || 0,
      })),
      period,
    };
  } catch (error) {
    console.error("Error getting expense statistics:", error);
    return null;
  }
}