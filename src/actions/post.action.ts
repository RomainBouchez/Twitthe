"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client"; 
import { processMentions } from "@/actions/mention.action";

export async function createPost(content: string, image: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return { success: false, error: "Not authenticated" };

    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });

    revalidatePath("/");
    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function getPosts() {
  try {
    // Add some basic error handling and logging
    console.log("Attempting to fetch posts...");
    
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    console.log(`Successfully fetched ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error("Error in getPosts:", error);
    // Return an empty array instead of throwing to prevent server crashes
    return [];
  }
}

export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) return { success: false, error: "Post not found" };

    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: NotificationType.LIKE,
                  userId: post.authorId,
                  creatorId: userId,
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return { success: false, error: "Not authenticated" };
    if (!content) return { success: false, error: "Content is required" };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) return { success: false, error: "Post not found" };

    const [comment] = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: NotificationType.COMMENT,
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) return { success: false, error: "Post not found" };
    if (post.authorId !== userId) return { success: false, error: "Unauthorized" };

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function getSinglePost(id: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}