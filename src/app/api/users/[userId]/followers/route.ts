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

    // Get all followers for this user
    const followers = await prisma.follows.findMany({
      where: {
        followingId: userId, // People who are following this user
      },
      include: {
        follower: {
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

    // Extract follower users from the results
    const followerUsers = followers.map(follow => follow.follower);

    return NextResponse.json(followerUsers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}