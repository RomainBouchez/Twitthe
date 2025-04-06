// src/actions/membership.action.ts
"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "@/actions/user.action";
import { revalidatePath } from "next/cache";
import { addDays, addMonths, addWeeks, addYears, isBefore } from "date-fns";

export async function createMembership(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const name = formData.get("name");
    const amount = formData.get("amount");
    const billingCycle = formData.get("billingCycle");
    const startDate = formData.get("startDate");
    const nextBillingDate = formData.get("nextBillingDate");
    const description = formData.get("description");
    const isActive = formData.get("isActive") === "true";
    const categoryId = formData.get("categoryId");

    if (!name || !amount || !billingCycle || !startDate || !nextBillingDate) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate billingCycle is one of the allowed values
    if (!["weekly", "monthly", "quarterly", "yearly"].includes(billingCycle.toString())) {
      return { success: false, error: "Invalid billing cycle" };
    }

    const membership = await prisma.membership.create({
      data: {
        name: name.toString(),
        amount: parseFloat(amount.toString()),
        billingCycle: billingCycle.toString() as any, // Cast to Prisma enum
        startDate: new Date(startDate.toString()),
        nextBillingDate: new Date(nextBillingDate.toString()),
        description: description?.toString() || null,
        isActive,
        categoryId: categoryId?.toString() || null,
        userId,
      },
    });

    revalidatePath("/memberships");
    revalidatePath("/dashboard");
    return { success: true, membership };
  } catch (error) {
    console.error("Failed to create membership:", error);
    return { success: false, error: "Failed to create membership" };
  }
}

export async function updateMembership(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const id = formData.get("id");
    const name = formData.get("name");
    const amount = formData.get("amount");
    const billingCycle = formData.get("billingCycle");
    const startDate = formData.get("startDate");
    const nextBillingDate = formData.get("nextBillingDate");
    const description = formData.get("description");
    const isActive = formData.get("isActive") === "true";
    const categoryId = formData.get("categoryId");

    if (!id || !name || !amount || !billingCycle || !startDate || !nextBillingDate) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate billingCycle is one of the allowed values
    if (!["weekly", "monthly", "quarterly", "yearly"].includes(billingCycle.toString())) {
      return { success: false, error: "Invalid billing cycle" };
    }

    // Verify the membership belongs to the user
    const existingMembership = await prisma.membership.findUnique({
      where: { id: id.toString() },
      select: { userId: true },
    });

    if (!existingMembership) {
      return { success: false, error: "Membership not found" };
    }

    if (existingMembership.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const membership = await prisma.membership.update({
      where: { id: id.toString() },
      data: {
        name: name.toString(),
        amount: parseFloat(amount.toString()),
        billingCycle: billingCycle.toString() as any, // Cast to Prisma enum
        startDate: new Date(startDate.toString()),
        nextBillingDate: new Date(nextBillingDate.toString()),
        description: description?.toString() || null,
        isActive,
        categoryId: categoryId?.toString() || null,
      },
    });

    revalidatePath("/memberships");
    revalidatePath("/dashboard");
    return { success: true, membership };
  } catch (error) {
    console.error("Failed to update membership:", error);
    return { success: false, error: "Failed to update membership" };
  }
}

export async function deleteMembership(id: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    // Verify the membership belongs to the user
    const membership = await prisma.membership.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!membership) {
      return { success: false, error: "Membership not found" };
    }

    if (membership.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.membership.delete({
      where: { id },
    });

    revalidatePath("/memberships");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete membership:", error);
    return { success: false, error: "Failed to delete membership" };
  }
}

export async function getMemberships() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const memberships = await prisma.membership.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
      },
      orderBy: {
        nextBillingDate: "asc",
      },
    });

    return memberships;
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return [];
  }
}

export async function getMembershipById(id: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return null;

    const membership = await prisma.membership.findUnique({
      where: {
        id,
        userId, // Security: ensure membership belongs to user
      },
      include: {
        category: true,
      },
    });

    return membership;
  } catch (error) {
    console.error("Error fetching membership:", error);
    return null;
  }
}

export async function updateNextBillingDate(id: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    // Verify the membership belongs to the user
    const membership = await prisma.membership.findUnique({
      where: { id, userId },
    });

    if (!membership) {
      return { success: false, error: "Membership not found" };
    }

    // Calculate next billing date based on the current next billing date and billing cycle
    let nextDate = new Date(membership.nextBillingDate);
    
    switch (membership.billingCycle) {
      case "weekly":
        nextDate = addWeeks(nextDate, 1);
        break;
      case "monthly":
        nextDate = addMonths(nextDate, 1);
        break;
      case "quarterly":
        nextDate = addMonths(nextDate, 3);
        break;
      case "yearly":
        nextDate = addYears(nextDate, 1);
        break;
    }

    // Update the membership with the new next billing date
    await prisma.membership.update({
      where: { id },
      data: {
        nextBillingDate: nextDate,
      },
    });

    // Optionally, create an expense record for this payment
    await prisma.expense.create({
      data: {
        amount: membership.amount,
        description: `${membership.name} - ${membership.billingCycle} subscription`,
        expenseDate: new Date(), // Today
        categoryId: membership.categoryId,
        paymentMethod: "Subscription",
        userId,
      },
    });

    revalidatePath("/memberships");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update next billing date:", error);
    return { success: false, error: "Failed to update next billing date" };
  }
}

export async function getUpcomingPayments(days: number = 7) {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const today = new Date();
    const futureDate = addDays(today, days);

    const upcomingMemberships = await prisma.membership.findMany({
      where: {
        userId,
        isActive: true,
        nextBillingDate: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        nextBillingDate: "asc",
      },
    });

    return upcomingMemberships;
  } catch (error) {
    console.error("Error fetching upcoming payments:", error);
    return [];
  }
}

export async function getMembershipStats() {
  try {
    const userId = await getDbUserId();
    if (!userId) return null;

    // Get all active memberships
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    // Calculate total monthly and yearly spending
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    memberships.forEach((membership) => {
      const amount = membership.amount.toNumber();
      
      switch (membership.billingCycle) {
        case "weekly":
          monthlyTotal += amount * 4.33; // Average weeks in a month
          yearlyTotal += amount * 52;
          break;
        case "monthly":
          monthlyTotal += amount;
          yearlyTotal += amount * 12;
          break;
        case "quarterly":
          monthlyTotal += amount / 3;
          yearlyTotal += amount * 4;
          break;
        case "yearly":
          monthlyTotal += amount / 12;
          yearlyTotal += amount;
          break;
      }
    });

    // Categorize memberships by billing cycle
    const categorizedByCycle = {
      weekly: memberships.filter(m => m.billingCycle === "weekly"),
      monthly: memberships.filter(m => m.billingCycle === "monthly"),
      quarterly: memberships.filter(m => m.billingCycle === "quarterly"),
      yearly: memberships.filter(m => m.billingCycle === "yearly"),
    };

    // Get payments due soon (next 7 days)
    const upcomingPayments = await getUpcomingPayments(7);

    // Calculate total by category
    const categoryTotals = [];
    const categories = new Map();

    memberships.forEach((membership) => {
      const categoryId = membership.categoryId || "uncategorized";
      const categoryName = membership.category?.name || "Uncategorized";
      const categoryColor = membership.category?.color || "#A7C5EB";
      const categoryIcon = membership.category?.icon || "more-horizontal";
      const amount = membership.amount.toNumber();
      
      // Convert to monthly amount
      let monthlyAmount = 0;
      switch (membership.billingCycle) {
        case "weekly":
          monthlyAmount = amount * 4.33;
          break;
        case "monthly":
          monthlyAmount = amount;
          break;
        case "quarterly":
          monthlyAmount = amount / 3;
          break;
        case "yearly":
          monthlyAmount = amount / 12;
          break;
      }
      
      if (categories.has(categoryId)) {
        categories.get(categoryId).amount += monthlyAmount;
      } else {
        categories.set(categoryId, {
          id: categoryId,
          name: categoryName,
          color: categoryColor,
          icon: categoryIcon,
          amount: monthlyAmount,
        });
      }
    });

    categories.forEach((value) => {
      categoryTotals.push(value);
    });

    return {
      totalCount: memberships.length,
      monthlyCost: monthlyTotal,
      yearlyCost: yearlyTotal,
      categorizedByCycle,
      upcomingPayments,
      byCategory: categoryTotals.sort((a, b) => b.amount - a.amount),
    };
  } catch (error) {
    console.error("Error getting membership stats:", error);
    return null;
  }
}