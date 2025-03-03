"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { getProfileByUsername, getUserPosts, isFollowing } from "@/actions/profile.action";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, LinkIcon, MapPinIcon, FileTextIcon } from "lucide-react";
import { format } from "date-fns";
import { toggleFollow } from "@/actions/user.action";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PostCard from "@/components/PostCard";
import { SignInButton } from "@clerk/nextjs";

interface ProfileModalProps {
  username: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileModal({ username, open, onOpenChange }: ProfileModalProps) {
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isUserFollowing, setIsUserFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!username || !open) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const profileData = await getProfileByUsername(username);
        
        if (!profileData) {
          setError("User not found");
          return;
        }
        
        setProfile(profileData);
        
        // Fetch additional data only if we have a valid profile
        const [userPosts, followStatus] = await Promise.all([
          getUserPosts(profileData.id),
          isFollowing(profileData.id)
        ]);
        
        setPosts(userPosts);
        setIsUserFollowing(followStatus);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [username, open]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      setIsUpdatingFollow(true);
      await toggleFollow(profile.id);
      setIsUserFollowing(!isUserFollowing);
      toast.success(isUserFollowing ? "Unfollowed user" : "Followed user");
    } catch (error) {
      toast.error("Failed to update follow status");
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const isOwnProfile = currentUser?.username === username;
  const formattedDate = profile ? format(new Date(profile.createdAt), "MMMM yyyy") : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2Icon className="size-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12 px-6 text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : profile ? (
          <div className="max-h-[80vh] overflow-y-auto">
            <Card className="bg-card border-0 rounded-none">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.image ?? "/avatar.png"} />
                  </Avatar>
                  <h1 className="mt-4 text-2xl font-bold">{profile.name ?? profile.username}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  <p className="mt-2 text-sm">{profile.bio}</p>

                  {/* PROFILE STATS */}
                  <div className="w-full mt-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <div className="font-semibold">{profile._count.following.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Following</div>
                      </div>
                      <Separator orientation="vertical" />
                      <div>
                        <div className="font-semibold">{profile._count.followers.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </div>
                      <Separator orientation="vertical" />
                      <div>
                        <div className="font-semibold">{profile._count.posts.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Posts</div>
                      </div>
                    </div>
                  </div>

                  {/* "FOLLOW & EDIT PROFILE" BUTTONS */}
                  {!currentUser ? (
                    <SignInButton mode="modal">
                      <Button className="w-full mt-4">Follow</Button>
                    </SignInButton>
                  ) : !isOwnProfile ? (
                    <Button
                      className="w-full mt-4"
                      onClick={handleFollow}
                      disabled={isUpdatingFollow}
                      variant={isUserFollowing ? "outline" : "default"}
                    >
                      {isUserFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  ) : null}

                  {/* LOCATION & WEBSITE */}
                  <div className="w-full mt-6 space-y-2 text-sm">
                    {profile.location && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPinIcon className="size-4 mr-2" />
                        {profile.location}
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center text-muted-foreground">
                        <LinkIcon className="size-4 mr-2" />
                        <a
                          href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                          className="hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground">
                      <CalendarIcon className="size-4 mr-2" />
                      Joined {formattedDate}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="posts" className="p-4">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="posts"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
                  data-[state=active]:bg-transparent px-6 font-semibold"
                >
                  <FileTextIcon className="size-4" />
                  Posts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-6">
                <div className="space-y-6">
                  {posts.length > 0 ? (
                    posts.slice(0, 3).map((post) => (
                      <PostCard key={post.id} post={post} dbUserId={currentUser?.id ?? null} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No posts yet</div>
                  )}
                  
                  {posts.length > 3 && (
                    <div className="text-center">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          window.location.href = `/profile/${profile.username}`;
                        }}
                      >
                        View all posts
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}