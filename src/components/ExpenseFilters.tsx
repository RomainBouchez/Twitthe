"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Search, X } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

interface ExpenseFiltersProps {
  categories: Category[];
  currentFilters: {
    category?: string;
    startDate?: string;
    endDate?: string;
    query?: string;
  };
}

export default function ExpenseFilters({ categories, currentFilters }: ExpenseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize state with current filters from URL
  const [filters, setFilters] = useState({
    category: currentFilters.category || "",
    startDate: currentFilters.startDate || "",
    endDate: currentFilters.endDate || "",
    query: currentFilters.query || ""
  });

  // Update state when URL parameters change
  useEffect(() => {
    setFilters({
      category: currentFilters.category || "",
      startDate: currentFilters.startDate || "",
      endDate: currentFilters.endDate || "",
      query: currentFilters.query || ""
    });
  }, [currentFilters]);

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters by updating URL with query parameters
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (filters.category) params.set("category", filters.category);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.query) params.set("query", filters.query);
    
    // Reset to page 1 when filters change
    router.push(`${pathname}?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: "",
      startDate: "",
      endDate: "",
      query: ""
    });
    
    router.push(pathname);
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.category !== "" || 
    filters.startDate !== "" || 
    filters.endDate !== "" || 
    filters.query !== "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Start Date"
              className="pl-10"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>
          <div className="relative flex-1">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="End Date"
              className="pl-10"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
        </div>

        {/* Search Filter */}
        <div className="relative md:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-10"
            value={filters.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
          />
        </div>

        {/* Apply/Clear Buttons */}
        <div className="flex items-center gap-2 md:col-span-2 lg:col-span-1">
          <Button
            variant="default"
            className="flex-1"
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="gap-1"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}