"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { getSinglePost } from "@/actions/post.action";
import PostCard from "@/components/PostCard";
import { getDbUserId } from "@/actions/user.action";
import { Loader2Icon } from "lucide-react";

interface PostModalProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostModal({ postId, open, onOpenChange }: PostModalProps) {
  const [post, setPost] = useState<any>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!postId || !open) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [postData, userId] = await Promise.all([
          getSinglePost(postId),
          getDbUserId()
        ]);
        
        if (!postData) {
          setError("Post not found");
        } else {
          setPost(postData);
          setDbUserId(userId);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [postId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2Icon className="size-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12 px-6 text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : post ? (
          <div className="max-h-[80vh] overflow-y-auto p-1">
            <PostCard post={post} dbUserId={dbUserId} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}