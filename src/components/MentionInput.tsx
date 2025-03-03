// src/components/MentionInput.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarImage } from "./ui/avatar";
import { getUserFollowing } from "@/actions/user.action"; // Adjust to your user action path

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MentionInput({ 
  value, 
  onChange, 
  placeholder = "What's happening?", // Changed to match Twitter's language
  className
}: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [followedUsers, setFollowedUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Fetch users the current user follows
  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setIsLoading(true);
        const users = await getUserFollowing();
        if (users && Array.isArray(users)) {
          setFollowedUsers(users);
        }
      } catch (error) {
        console.error("Error fetching followed users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFollowing();
  }, []);
  
  // Handle input changes and detect @ symbols
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    
    // Check if user is typing a mention
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const mentionText = mentionMatch[1];
      setMentionSearch(mentionText);
      setMentionPosition(cursorPosition);
      setShowMentions(true);
      
      // Filter users based on search term
      const filtered = followedUsers.filter(user => 
        user.username.toLowerCase().includes(mentionText.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(mentionText.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setShowMentions(false);
    }
  };
  
  // Insert the selected username into the text
  const selectUser = (username: string) => {
    if (!textareaRef.current) return;
    
    const textBeforeMention = value.substring(0, mentionPosition - mentionSearch.length - 1);
    const textAfterMention = value.substring(mentionPosition);
    
    const newText = `${textBeforeMention}@${username} ${textAfterMention}`;
    onChange(newText);
    
    // Close dropdown and reset
    setShowMentions(false);
    setMentionSearch("");
    
    // Set focus back to textarea
    textareaRef.current.focus();
  };
  
  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
      />
      
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute z-10 mt-1 w-64 max-h-60 overflow-y-auto bg-card border rounded-md shadow-lg">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
              onClick={() => selectUser(user.username)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.image || "/avatar.png"} />
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.username}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showMentions && isLoading && (
        <div className="absolute z-10 mt-1 w-64 p-4 bg-card border rounded-md shadow-lg text-center">
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      )}
      
      {showMentions && !isLoading && filteredUsers.length === 0 && (
        <div className="absolute z-10 mt-1 w-64 p-4 bg-card border rounded-md shadow-lg text-center">
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  );
}