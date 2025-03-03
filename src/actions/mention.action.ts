// src/actions/mention.action.ts
"use server";

import prisma from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { getDbUserId } from "./user.action"; // Adjust if your user function is different

export async function processMentions({
  content,
  postId = null,
  commentId = null,
  mentionerId, // The person who mentioned someone
}: {
  content: string;
  postId?: string | null;
  commentId?: string | null;
  mentionerId: string;
}) {
  try {
    if (!content) return { success: false, error: "No content provided" };
    
    // Extract all @username mentions from the content
    const mentionRegex = /@(\w+)/g;
    const mentionMatches = [...content.matchAll(mentionRegex)];
    const usernames = mentionMatches.map(match => match[1]);
    
    if (usernames.length === 0) return { success: true, message: "No mentions found" };
    
    // Find all mentioned users that exist
    const mentionedUsers = await prisma.user.findMany({
      where: {
        username: {
          in: usernames,
        },
      },
      select: {
        id: true,
        username: true,
      },
    });
    
    if (mentionedUsers.length === 0) return { success: true, message: "No valid users mentioned" };
    
    // Create mentions and notifications for each mentioned user
    const mentions = [];
    const notifications = [];
    
    for (const user of mentionedUsers) {
      // Skip if user is mentioning themselves
      if (user.id === mentionerId) continue;
      
      // Create entry in Mention table
      const mention = await prisma.mention.create({
        data: {
          userId: user.id,        // User who was mentioned
          mentionerId: mentionerId, // User who created the mention
          postId,                 // Optional post where the mention occurred
          commentId,              // Optional comment where the mention occurred
        },
      });
      mentions.push(mention);
      
      // Create notification for the mention
      const notification = await prisma.notification.create({
        data: {
          type: NotificationType.MENTION,
          userId: user.id,     // who receives the notification
          creatorId: mentionerId, // who created the mention
          postId,
          commentId,
        },
      });
      notifications.push(notification);
    }
    
    return { 
      success: true, 
      mentions, 
      notifications,
      message: `Created ${mentions.length} mentions and notifications` 
    };
  } catch (error) {
    console.error("Error processing mentions:", error);
    return { success: false, error: "Failed to process mentions" };
  }
}