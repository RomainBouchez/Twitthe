// src/app/api/users/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Disable caching for this route

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    
    console.log(`Search API called with query: "${query}"`);
    
    if (!query || query.trim() === "") {
      console.log("Empty query, returning empty results");
      return NextResponse.json([], { status: 200 });
    }

    // Make search query more compatible with different database providers
    // by using a more basic approach
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query,
              // Don't specify mode to ensure compatibility
            },
          },
          {
            name: {
              contains: query,
              // Don't specify mode to ensure compatibility
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      orderBy: {
        username: 'asc', // Sort results alphabetically
      },
      take: 10, // Limit to 10 results
    });

    console.log(`Search found ${users.length} users`);
    
    // If no users found, try a simpler approach with startsWith for username
    if (users.length === 0) {
      console.log("No users found with contains, trying startsWith...");
      const usersWithStartsWith = await prisma.user.findMany({
        where: {
          username: {
            startsWith: query,
          },
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          _count: {
            select: {
              followers: true,
            },
          },
        },
        take: 10,
      });
      
      console.log(`StartsWith approach found ${usersWithStartsWith.length} users`);
      return NextResponse.json(usersWithStartsWith);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}