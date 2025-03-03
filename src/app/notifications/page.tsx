"use client";

import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action";
import { NotificationsSkeleton } from "@/components/NotificationSkeleton";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { AtSignIcon, HeartIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PostModal from "@/components/PostModal";
import ProfileModal from "@/components/ProfileModal";
import { Button } from "@/components/ui/button";

type Notifications = Awaited<ReturnType<typeof getNotifications>>;
type Notification = Notifications[number];

// Function to group notifications by date
const groupNotificationsByDate = (notifications: Notification[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  
  const thisMonth = new Date(today);
  thisMonth.setDate(1);
  
  return {
    today: notifications.filter(n => new Date(n.createdAt) >= today),
    yesterday: notifications.filter(n => {
      const date = new Date(n.createdAt);
      return date >= yesterday && date < today;
    }),
    thisWeek: notifications.filter(n => {
      const date = new Date(n.createdAt);
      return date >= thisWeekStart && date < yesterday;
    }),
    earlier: notifications.filter(n => new Date(n.createdAt) < thisWeekStart)
  };
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "LIKE":
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900">
        <HeartIcon className="size-4 text-pink-500" />
      </div>;
    case "COMMENT":
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
        <MessageCircleIcon className="size-4 text-blue-500" />
      </div>;
    case "FOLLOW":
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
        <UserPlusIcon className="size-4 text-green-500" />
      </div>;
    case "MENTION":
      return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900">
        <AtSignIcon className="size-4 text-purple-500" />
      </div>;
    default:
      return null;
  }
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for modals
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);

        const unreadIds = data.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length > 0) await markNotificationsAsRead(unreadIds);
      } catch (error) {
        toast.error("Failed to fetch notifications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // If it's a follow notification, open the profile modal
    if (notification.type === "FOLLOW") {
      setSelectedUsername(notification.creator.username);
      setProfileModalOpen(true);
      return;
    }

    // For other notifications, open the post modal if a post exists
    if (notification.postId) {
      setSelectedPostId(notification.postId);
      setPostModalOpen(true);
    }
  };

  const handleProfileClick = (username: string) => {
    setSelectedUsername(username);
    setProfileModalOpen(true);
  };

  if (isLoading) return <NotificationsSkeleton />;

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-card border-none rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b sticky top-0 bg-card z-10">
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        <div className="divide-y">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-muted rounded-full p-6 mb-4">
                <BellIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-1">No notifications yet</h3>
              <p className="text-muted-foreground">
                When you get notifications, they'll appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Today's notifications */}
              {groupedNotifications.today.length > 0 && (
                <div>
                  <h2 className="p-4 text-sm font-medium text-muted-foreground">Today</h2>
                  {groupedNotifications.today.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                      onProfileClick={handleProfileClick}
                    />
                  ))}
                </div>
              )}

              {/* Yesterday's notifications */}
              {groupedNotifications.yesterday.length > 0 && (
                <div>
                  <h2 className="p-4 text-sm font-medium text-muted-foreground">Yesterday</h2>
                  {groupedNotifications.yesterday.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                      onProfileClick={handleProfileClick}
                    />
                  ))}
                </div>
              )}

              {/* This week's notifications */}
              {groupedNotifications.thisWeek.length > 0 && (
                <div>
                  <h2 className="p-4 text-sm font-medium text-muted-foreground">This Week</h2>
                  {groupedNotifications.thisWeek.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                      onProfileClick={handleProfileClick}
                    />
                  ))}
                </div>
              )}

              {/* Earlier notifications */}
              {groupedNotifications.earlier.length > 0 && (
                <div>
                  <h2 className="p-4 text-sm font-medium text-muted-foreground">Earlier</h2>
                  {groupedNotifications.earlier.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onClick={handleNotificationClick}
                      onProfileClick={handleProfileClick}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Post Modal */}
      <PostModal 
        postId={selectedPostId}
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
      />

      {/* Profile Modal */}
      <ProfileModal
        username={selectedUsername}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </div>
  );
}

// Single notification item component
function NotificationItem({ 
  notification, 
  onClick,
  onProfileClick
}: { 
  notification: Notification; 
  onClick: (notification: Notification) => void;
  onProfileClick: (username: string) => void;
}) {
  const getActionText = () => {
    switch (notification.type) {
      case "FOLLOW":
        return "started following you";
      case "LIKE":
        return "liked your post";
      case "COMMENT":
        return "commented on your post";
      case "MENTION":
        return notification.commentId ? "mentioned you in a comment" : "mentioned you in a post";
      default:
        return "interacted with you";
    }
  };

  // Format the relative time (e.g., "2h", "3d")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  return (
    <div 
      className="flex items-start p-4 gap-3 hover:bg-accent/10 transition-colors cursor-pointer"
      onClick={() => onClick(notification)}
    >
      {/* Left side: Avatar with click handler for profile */}
      <div className="flex-shrink-0" onClick={(e) => {
        e.stopPropagation();
        onProfileClick(notification.creator.username);
      }}>
        <Avatar className="h-12 w-12 border border-muted">
          <AvatarImage src={notification.creator.image ?? "/avatar.png"} />
        </Avatar>
      </div>
      
      {/* Middle: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span 
            className="font-medium cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick(notification.creator.username);
            }}
          >
            {notification.creator.name ?? notification.creator.username}
          </span>
          <span className="text-sm">{getActionText()}</span>
        </div>
        
        {/* Preview content if available */}
        {notification.post && notification.type !== "FOLLOW" && (
          <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
            {notification.post.content}
          </div>
        )}
        
        {/* Timestamp */}
        <div className="mt-1 text-xs text-muted-foreground">
          {formatRelativeTime(new Date(notification.createdAt))}
        </div>
      </div>
      
      {/* Right side: Icon or preview image */}
      <div className="flex-shrink-0 ml-2">
        {notification.type === "FOLLOW" ? (
          <Button 
            size="sm" 
            variant="secondary"
            className="h-8 text-xs rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick(notification.creator.username);
            }}
          >
            View
          </Button>
        ) : notification.post?.image ? (
          <div className="w-12 h-12 rounded overflow-hidden">
            <img 
              src={notification.post.image} 
              alt="Post preview" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          getNotificationIcon(notification.type)
        )}
      </div>
    </div>
  );
}

// Import BellIcon for empty state
import { BellIcon } from "lucide-react";

export default NotificationsPage;