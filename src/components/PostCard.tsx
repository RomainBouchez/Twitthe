"use client";

import { deletePost, toggleLike, createComment } from "@/actions/post.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { Button } from "./ui/button";
import { 
  BookmarkIcon, 
  HeartIcon, 
  MessageCircleIcon, 
  MoreHorizontalIcon, 
  SendIcon, 
  ShareIcon, 
  LogInIcon 
} from "lucide-react";
import { formatTextWithMentions } from "@/lib/formatText";
import { processMentions } from "@/actions/mention.action";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import MentionInput from "./MentionInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Posts = Awaited<ReturnType<typeof import("@/actions/post.action").getPosts>>;
type Post = Posts[number];

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const pathname = usePathname();
  const isPostPage = pathname.startsWith("/post/");
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some((like) => like.userId === dbUserId));
  const [optimisticLikes, setOptmisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(isPostPage);
  const [isBookmarked, setIsBookmarked] = useState(false); // We'll implement this functionality later
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      setHasLiked((prev) => !prev);
      setOptmisticLikes((prev) => prev + (hasLiked ? -1 : 1));
      await toggleLike(post.id);
    } catch (error) {
      setOptmisticLikes(post._count.likes);
      setHasLiked(post.likes.some((like) => like.userId === dbUserId));
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment);
      
      if (result?.success && result.comment) {
        // Process mentions if present
        if (newComment.includes('@')) {
          await processMentions({
            content: newComment,
            postId: post.id,
            commentId: result.comment.id,
            authorId: result.comment.authorId
          });
        }
        
        toast.success("Comment posted successfully");
        setNewComment("");
      } else {
        console.error("Failed to create comment:", result?.error);
        toast.error(result?.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error in handleAddComment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);
      if (result.success) toast.success("Post deleted successfully");
      else throw new Error(result.error);
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentClick = () => {
    setShowComments(true);
    // Give time for the comment section to render before focusing
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // For now, just show a toast. We'll implement proper bookmarking later
    toast.success(isBookmarked ? "Post removed from saved items" : "Post saved successfully");
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* POST HEADER */}
      <div className="flex items-center justify-between p-4">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={post.author.image ?? "/avatar.png"} />
          </Avatar>
          <div>
            <div className="font-semibold leading-none">{post.author.name || post.author.username}</div>
            <div className="text-xs text-muted-foreground">@{post.author.username}</div>
          </div>
        </Link>
        
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dbUserId === post.author.id ? (
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={handleDeletePost}>
                  Delete post
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem>Report post</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={toggleBookmark}>
                {isBookmarked ? "Remove from saved" : "Save post"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/post/${post.id}`}>View full post</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* POST CONTENT */}
      <div className="px-4 pb-3">
        <p className="text-sm whitespace-pre-line mb-2">{formatTextWithMentions(post.content)}</p>
      </div>

      {/* POST IMAGE */}
      {post.image && (
        <div className="border-y">
          <img 
            src={post.image} 
            alt="Post content" 
            className="w-full h-auto object-cover max-h-[500px]" 
          />
        </div>
      )}

      {/* ENGAGEMENT STATS */}
      <div className="px-4 py-2 flex items-center text-xs text-muted-foreground space-x-2">
        <span className="flex items-center hover:text-foreground cursor-pointer" onClick={() => setShowComments(!showComments)}>
          <span className="font-semibold">{post.comments.length}</span>
          <span className="ml-1">comments</span>
        </span>
        <span className="flex items-center hover:text-foreground cursor-pointer">
          <span className="font-semibold">{optimisticLikes}</span>
          <span className="ml-1">likes</span>
        </span>
      </div>

      {/* ACTION BUTTONS */}
      <div className="border-t flex items-center justify-between p-2">
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-muted-foreground flex-1 gap-1 rounded-lg",
              hasLiked && "text-red-500"
            )}
            onClick={handleLike}
          >
            {hasLiked ? (
              <HeartIcon className="size-5 fill-current" />
            ) : (
              <HeartIcon className="size-5" />
            )}
            <span className="hidden sm:inline">Like</span>
          </Button>
        ) : (
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="text-muted-foreground flex-1 gap-1 rounded-lg">
              <HeartIcon className="size-5" />
              <span className="hidden sm:inline">Like</span>
            </Button>
          </SignInButton>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-muted-foreground flex-1 gap-1 rounded-lg",
            showComments && "text-blue-500"
          )}
          onClick={handleCommentClick}
        >
          <MessageCircleIcon className="size-5" />
          <span className="hidden sm:inline">Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground flex-1 gap-1 rounded-lg"
          onClick={toggleBookmark}
        >
          <BookmarkIcon 
            className={cn("size-5", isBookmarked && "fill-current text-amber-500")}
          />
          <span className="hidden sm:inline">Save</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground flex-1 gap-1 rounded-lg"
          onClick={() => {
            // Just a temporary toast for the share function
            navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
            toast.success("Link copied to clipboard");
          }}
        >
          <ShareIcon className="size-5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      {/* COMMENTS SECTION */}
      {showComments && (
        <div className="border-t p-3 bg-muted/20">
          {/* DISPLAY COMMENTS */}
          {post.comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Link href={`/profile/${comment.author.username}`}>
                    <Avatar className="size-8 flex-shrink-0">
                      <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0 bg-muted/50 p-2 rounded-lg">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link href={`/profile/${comment.author.username}`} className="font-medium text-sm hover:underline">
                        {comment.author.name || comment.author.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm break-words">{formatTextWithMentions(comment.content)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ADD COMMENT */}
          {user ? (
            <div className="flex space-x-3">
              <Avatar className="size-8 flex-shrink-0">
                <AvatarImage src={user?.imageUrl || "/avatar.png"} />
              </Avatar>
              <div className="flex-1">
                <MentionInput
                  value={newComment}
                  onChange={setNewComment}
                  className="min-h-[60px] text-sm resize-none bg-background"
                  placeholder="Write a comment..."
                />
                {newComment.trim() && (
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleAddComment}
                      className="flex items-center gap-1 h-8"
                      disabled={!newComment.trim() || isCommenting}
                    >
                      {isCommenting ? (
                        "Posting..."
                      ) : (
                        <>
                          <SendIcon className="size-3" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-3 border rounded-lg bg-muted/20">
              <SignInButton mode="modal">
                <Button variant="outline" className="gap-2">
                  <LogInIcon className="size-4" />
                  Sign in to comment
                </Button>
              </SignInButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostCard;