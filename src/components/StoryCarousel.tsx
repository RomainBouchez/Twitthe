"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarImage } from "./ui/avatar";
import { PlusIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// In a real app, we would fetch this from an API
const dummyStories = [
  {
    id: "1",
    username: "jane_smith",
    name: "Jane Smith",
    image: "https://i.pravatar.cc/150?img=1",
    avatar: "https://i.pravatar.cc/150?img=1",
    viewed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    username: "john_doe",
    name: "John Doe",
    image: "https://i.pravatar.cc/150?img=2",
    avatar: "https://i.pravatar.cc/150?img=2",
    viewed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    username: "alex_jones",
    name: "Alex Jones",
    image: "https://i.pravatar.cc/150?img=3",
    avatar: "https://i.pravatar.cc/150?img=3",
    viewed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    username: "sarah_connor",
    name: "Sarah Connor",
    image: "https://i.pravatar.cc/150?img=4",
    avatar: "https://i.pravatar.cc/150?img=4",
    viewed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    username: "mike_ross",
    name: "Mike Ross",
    image: "https://i.pravatar.cc/150?img=5",
    avatar: "https://i.pravatar.cc/150?img=5",
    viewed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    username: "rachel_green",
    name: "Rachel Green",
    image: "https://i.pravatar.cc/150?img=6",
    avatar: "https://i.pravatar.cc/150?img=6",
    viewed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    username: "ross_geller",
    name: "Ross Geller",
    image: "https://i.pravatar.cc/150?img=7",
    avatar: "https://i.pravatar.cc/150?img=7",
    viewed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    username: "chandler_bing",
    name: "Chandler Bing",
    image: "https://i.pravatar.cc/150?img=8",
    avatar: "https://i.pravatar.cc/150?img=8",
    viewed: false,
    createdAt: new Date().toISOString(),
  },
];

export default function StoryCarousel() {
  const { user, isSignedIn } = useUser();
  const [openStory, setOpenStory] = useState<string | null>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(
    new Set(dummyStories.filter(story => story.viewed).map(story => story.id))
  );

  const handleStoryClick = (storyId: string) => {
    setOpenStory(storyId);
    
    // Mark as viewed
    setViewedStories(prev => {
      const newSet = new Set(prev);
      newSet.add(storyId);
      return newSet;
    });
  };

  const currentStoryIndex = openStory 
    ? dummyStories.findIndex(story => story.id === openStory)
    : -1;

  const goToNextStory = () => {
    if (currentStoryIndex < dummyStories.length - 1) {
      const nextStory = dummyStories[currentStoryIndex + 1];
      setOpenStory(nextStory.id);
      setViewedStories(prev => {
        const newSet = new Set(prev);
        newSet.add(nextStory.id);
        return newSet;
      });
    } else {
      setOpenStory(null); // Close if we're at the last story
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setOpenStory(dummyStories[currentStoryIndex - 1].id);
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl p-4 mb-6 border shadow-sm">
        <h2 className="font-semibold text-sm mb-4">Stories</h2>
        <div className="flex overflow-x-auto gap-4 pb-2 -mx-1 px-1 snap-x">
          {/* Add Story Button (only for signed-in users) */}
          {isSignedIn ? (
            <div className="flex-shrink-0 snap-start">
              <div className="flex flex-col items-center w-[72px]">
                <div className="relative mb-1">
                  <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/50">
                    <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                  </Avatar>
                  <div className="absolute bottom-0 right-0 bg-primary rounded-full w-6 h-6 flex items-center justify-center border-2 border-background">
                    <PlusIcon className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <span className="text-xs text-center line-clamp-1 w-full">Add Story</span>
              </div>
            </div>
          ) : (
            <SignInButton mode="modal">
              <div className="flex-shrink-0 snap-start cursor-pointer">
                <div className="flex flex-col items-center w-[72px]">
                  <div className="relative mb-1">
                    <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/50">
                      <AvatarImage src="/avatar.png" />
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full w-6 h-6 flex items-center justify-center border-2 border-background">
                      <PlusIcon className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="text-xs text-center line-clamp-1 w-full">Sign In</span>
                </div>
              </div>
            </SignInButton>
          )}

          {/* Story Avatars */}
          {dummyStories.map((story) => {
            const isViewed = viewedStories.has(story.id);
            return (
              <div 
                key={story.id} 
                className="flex-shrink-0 snap-start cursor-pointer"
                onClick={() => handleStoryClick(story.id)}
              >
                <div className="flex flex-col items-center w-[72px]">
                  <div 
                    className={cn(
                      "p-[3px] rounded-full mb-1",
                      isViewed 
                        ? "bg-muted" 
                        : "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500"
                    )}
                  >
                    <Avatar className="h-16 w-16 border-2 border-background">
                      <AvatarImage src={story.avatar} />
                    </Avatar>
                  </div>
                  <span className="text-xs text-center line-clamp-1 w-full">
                    {story.name.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story Viewer Dialog */}
      {openStory && (
        <Dialog open={!!openStory} onOpenChange={(open) => !open && setOpenStory(null)}>
          <DialogContent className="sm:max-w-2xl p-0 max-h-[90vh] overflow-hidden bg-black text-white">
            <DialogClose className="absolute right-4 top-4 z-10">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/20 text-white">
                <XIcon className="h-4 w-4" />
              </Button>
            </DialogClose>

            <div className="relative h-[80vh]">
              {/* Story Navigation */}
              <div className="absolute inset-0 flex">
                <div 
                  className="w-1/3 cursor-pointer z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevStory();
                  }}
                ></div>
                <div 
                  className="w-2/3 cursor-pointer z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextStory();
                  }}
                ></div>
              </div>
              
              {/* Story Content */}
              {currentStoryIndex >= 0 && (
                <>
                  {/* Progress Bars */}
                  <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
                    {dummyStories.map((story, index) => (
                      <div 
                        key={story.id}
                        className={cn(
                          "h-1 bg-white/30 rounded-full flex-1 overflow-hidden",
                          index < currentStoryIndex ? "bg-white" : "",
                          index === currentStoryIndex ? "bg-white/30" : ""
                        )}
                      >
                        {index === currentStoryIndex && (
                          <div 
                            className="h-full bg-white animate-[progress_5s_linear]"
                            onAnimationEnd={goToNextStory}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Story Header */}
                  <div className="absolute top-10 left-0 right-0 flex items-center p-4 z-10">
                    <Avatar className="h-10 w-10 mr-3 border border-white">
                      <AvatarImage src={dummyStories[currentStoryIndex].avatar} />
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">
                        {dummyStories[currentStoryIndex].name}
                      </div>
                      <div className="text-xs text-white/70">
                        {new Date(dummyStories[currentStoryIndex].createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Story Image */}
                  <div className="absolute inset-0">
                    <img
                      src={dummyStories[currentStoryIndex].image}
                      alt={`Story by ${dummyStories[currentStoryIndex].name}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}