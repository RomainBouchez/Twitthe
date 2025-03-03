import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FollowButton from "./FollowButton";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Skeleton } from "./ui/skeleton";

type UserItem = {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
};

interface UserListsModalProps {
  userId: string;
  username: string;
  initialTab?: "followers" | "following";
  followersCount: number;
  followingCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserListsModal({
  userId,
  username,
  initialTab = "followers",
  followersCount,
  followingCount,
  open,
  onOpenChange,
}: UserListsModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useUser();

  // Need to memoize the fetchUsers function to avoid dependency issues
  const fetchUsers = React.useCallback(async (tab: "followers" | "following") => {
    if (!open) return;
    
    setIsLoading(true);
    try {
      // Make sure the URL matches your folder structure exactly
      const endpoint = `/api/users/${encodeURIComponent(userId)}/${tab}`;
      console.log(`Fetching ${tab} for user ID: ${userId} from ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.error(`Failed to fetch ${tab}:`, response.status, response.statusText, 'Response:', await response.text().catch(() => 'Could not get response text'));
        throw new Error(`Failed to fetch ${tab}: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received ${tab} data:`, data);
      
      if (tab === "followers") {
        setFollowers(data);
      } else {
        setFollowing(data);
      }
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, open]);

  // Use useEffect to fetch data when modal opens or tab changes
  React.useEffect(() => {
    if (open) {
      console.log(`Modal is open, active tab: ${activeTab}`);
      fetchUsers(activeTab);
    }
  }, [open, activeTab, fetchUsers]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as "followers" | "following";
    setActiveTab(tab);
  };

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* IMPORTANT: No need for a manual close button here, the Dialog component adds one automatically */}
        <DialogHeader>
          <DialogTitle className="text-center">{username}'s Connections</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={initialTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="followers">
              Followers ({followersCount})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({followingCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-4 max-h-[60vh] overflow-y-auto">
            {isLoading && activeTab === "followers" ? (
              <UserListSkeleton count={3} />
            ) : followers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No followers yet
              </div>
            ) : (
              <div className="space-y-4">
                {followers.map(user => (
                  <UserListItem 
                    key={user.id} 
                    user={user} 
                    onUserClick={handleUserClick}
                    currentUserId={userId} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="following" className="mt-4 max-h-[60vh] overflow-y-auto">
            {isLoading && activeTab === "following" ? (
              <UserListSkeleton count={3} />
            ) : following.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Not following anyone yet
              </div>
            ) : (
              <div className="space-y-4">
                {following.map(user => (
                  <UserListItem 
                    key={user.id} 
                    user={user} 
                    onUserClick={handleUserClick}
                    currentUserId={userId} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// User list item component
function UserListItem({ 
  user, 
  onUserClick,
  currentUserId 
}: { 
  user: UserItem;
  onUserClick: (username: string) => void;
  currentUserId: string;
}) {
  const isCurrentUser = user.id === currentUserId;
  const { user: clerkUser } = useUser();
  
  return (
    <div className="flex items-center justify-between">
      <div 
        className="flex items-center gap-3 flex-1 cursor-pointer"
        onClick={() => onUserClick(user.username)}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.image ?? "/avatar.png"} />
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name || user.username}</p>
          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
        </div>
      </div>
      
      {clerkUser && !isCurrentUser && (
        <FollowButton userId={user.id} />
      )}
    </div>
  );
}

// Skeleton loader for user list
function UserListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}