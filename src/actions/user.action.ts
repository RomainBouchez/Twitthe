"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;
    
    // check if user already exists in db
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (existingUser) {
      // Only update essential auth fields from Clerk, but preserve user's custom data
      // This ensures we don't overwrite profile changes made in the app
      const updates: any = {};
      
      // Only sync email if it changed
      if (user.emailAddresses[0].emailAddress !== existingUser.email) {
        updates.email = user.emailAddresses[0].emailAddress;
      }
      
      // Only sync username if the existing user has the default email-based username
      // This preserves custom usernames set in the app
      const emailBasedUsername = user.emailAddresses[0].emailAddress.split("@")[0];
      if (existingUser.username === emailBasedUsername && user.username && user.username !== existingUser.username) {
        updates.username = user.username;
      }
      
      // Only update if we have changes to make
      if (Object.keys(updates).length > 0) {
        return await prisma.user.update({
          where: { clerkId: userId },
          data: updates,
        });
      }
      
      return existingUser;
    }

    // Create a new user if it doesn't exist
    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        username: user.username || user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });

    return dbUser;
  } catch (error) {
    console.log("Error in syncUser", error);
  }
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);

  if (!user) throw new Error("User not found");

  return user.id;
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    if (!userId) return [];

    // get 3 random users exclude ourselves & users that we already follow
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
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
      take: 3,
    });

    return randomUsers;
  } catch (error) {
    console.log("Error fetching random users", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user following
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}

export async function getUserFollowing() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];
    
    const following = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    // Return the users this user is following
    return following.map(follow => follow.following);
  } catch (error) {
    console.error("Error fetching following users:", error);
    return [];
  }
}

export async function updateUserImage(imageUrl: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    // Set a flag in the database that this update came from the app
    // This will help prevent sync conflicts
    await prisma.user.update({
      where: { clerkId },
      data: { 
        image: imageUrl,
        // You could add a lastUpdatedBy field to track the source of updates
        // lastUpdatedBy: 'app'
      },
    });

    try {
      // Import required Clerk SDK
      const { clerkClient } = require("@clerk/nextjs/server");
      
      // Update the image in Clerk
      await clerkClient.users.updateUser(clerkId, {
        imageUrl: imageUrl,
      });
    } catch (clerkError) {
      console.error("Error updating image in Clerk:", clerkError);
      // Don't fail the whole operation if just Clerk update fails
    }

    // Revalidate paths to ensure fresh data is shown
    revalidatePath("/");
    revalidatePath("/profile");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating profile image:", error);
    return { success: false, error: "Failed to update profile image" };
  }
}