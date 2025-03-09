"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { PlusIcon, XIcon } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "./ui/dialog";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Avatar, AvatarImage } from "./ui/avatar";
import { createPost } from "@/actions/post.action";
import { processMentions } from "@/actions/mention.action";
import toast from "react-hot-toast";
import MentionInput from "./MentionInput";
import ImageUpload from "./ImageUpload";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";

export default function FloatingPostButton() {
  const { user, isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;
  
    setIsPosting(true);
    try {
      const result = await createPost(content, imageUrl);
      if (result?.success) {
        // Process mentions after post is created
        if (result.post && content.includes('@')) {
          await processMentions({
            content,
            postId: result.post.id,
            mentionerId: result.post.authorId
          });
        }
        
        // reset the form
        setContent("");
        setImageUrl("");
        setShowImageUpload(false);
        setIsOpen(false);
  
        toast.success("Post created successfully");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 flex items-center justify-center p-0"
        size="icon"
      >
        <PlusIcon className="h-6 w-6" />
      </Button>

      {/* Create Post Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
            <DialogClose asChild>
              <Button 
                className="h-6 w-6 p-0 rounded-full absolute right-4 top-4" 
                variant="ghost"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          {!isSignedIn ? (
            <div className="p-6 flex flex-col items-center justify-center">
              <p className="mb-4 text-center">Sign in to create a post</p>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    @{user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0]}
                  </p>
                </div>
              </div>

              <MentionInput
                value={content}
                onChange={setContent}
                className="min-h-[150px] resize-none border-none focus-visible:ring-0 p-0 text-base"
                placeholder="What's on your mind?"
              />

              {(showImageUpload || imageUrl) && (
                <div className="border border-border rounded-lg p-4 bg-card/30">
                  <ImageUpload
                    endpoint="postImage"
                    value={imageUrl}
                    onChange={(url) => {
                      setImageUrl(url);
                      if (!url) setShowImageUpload(false);
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  disabled={isPosting}
                >
                  <ImageIcon className="size-4 mr-2" />
                  Photo
                </Button>
                
                <Button
                  className="flex items-center"
                  onClick={handleSubmit}
                  disabled={(!content.trim() && !imageUrl) || isPosting}
                >
                  {isPosting ? (
                    <>
                      <Loader2Icon className="size-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <SendIcon className="size-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}