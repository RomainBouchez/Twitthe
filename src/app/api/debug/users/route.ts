// src/app/api/debug/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Disable caching for this route

/**
 * This is a debug endpoint to check if users exist in the database
 * Only use this during development
 */
export async function GET(request: NextRequest) {
  try {
    // Count total users
    const userCount = await prisma.user.count();
    
    // Get a sample of users (max 5)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          }
        }
      },
      take: 5,
    });

    // Get database provider info if possible
    let providerInfo = "Unknown";
    try {
      // This is a hacky way to get provider info and may not work in all cases
      // @ts-ignore - Accessing internal Prisma property
      providerInfo = prisma._engineConfig?.datamodelPath || "Unknown";
    } catch (e) {
      // Ignore error
    }

    return NextResponse.json({
      totalUsers: userCount,
      userSamples: users,
      databaseProvider: providerInfo
    });
  } catch (error) {
    console.error("Error in debug users endpoint:", error);
    return NextResponse.json({
      error: "Failed to fetch user debug info",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}