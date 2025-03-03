"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, Loader2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  _count: {
    followers: number;
  };
}

interface SearchBarProps {
  onClose?: () => void;
  className?: string;
  placeholder?: string;
}

export default function SearchBar({ onClose, className, placeholder = "Search..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300); // Debounce to avoid excessive API calls
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        console.log(`Fetching search results for query: "${debouncedQuery}"`);
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Search API error: ${response.status} - ${errorText}`);
          throw new Error(`Failed to fetch search results: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} search results`, data);
        setResults(data);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedQuery]);

  // Handle clicks outside the search component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (username: string) => {
    router.push(`/profile/${username}`);
    setQuery("");
    setResults([]);
    setIsFocused(false);
    if (onClose) onClose();
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          onFocus={() => setIsFocused(true)}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isFocused && query && (
        <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {isLoading ? "Searching..." : "No users found"}
            </div>
          ) : (
            <div className="py-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => handleNavigate(user.username)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || "/avatar.png"} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{user.username}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="line-clamp-1">{user.name}</span>
                        <span className="mx-1">•</span>
                        <span>{user._count.followers} followers</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}