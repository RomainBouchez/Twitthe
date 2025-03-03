// src/components/SearchPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, Loader2Icon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import { useUser } from "@clerk/nextjs";
import { useDebounce } from "@/hooks/useDebounce";

interface User {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  _count: {
    followers: number;
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { user } = useUser();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        console.log(`SearchPage: Fetching results for query: "${debouncedQuery}"`);
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Search API error: ${response.status} - ${errorText}`);
          throw new Error(`Failed to fetch search results: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`SearchPage: Received ${data.length} results`, data);
        setResults(data);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedQuery]);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username or name..."
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {debouncedQuery ? "No users found" : "Enter a search query to find users"}
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.image || "/avatar.png"} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{user.name || user.username}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>@{user.username}</span>
                        <span className="mx-1">•</span>
                        <span>{user._count.followers} followers</span>
                      </div>
                    </div>
                  </Link>
                  
                  {user && <FollowButton userId={user.id} />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}