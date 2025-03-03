import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Disable caching for this route

// Define the expected params type
interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all users this user is following
    const following = await prisma.follows.findMany({
      where: {
        followerId: userId, // Users this person is following
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Extract following users from the results
    const followingUsers = following.map(follow => follow.following);

    return NextResponse.json(followingUsers);
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following users", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}