import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsSkeleton() {
  // Create skeleton items for different sections
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-card border-none rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-40" />
        </div>

        {/* "Today" group */}
        <div>
          <div className="p-4">
            <Skeleton className="h-5 w-16" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <NotificationItemSkeleton key={`today-${i}`} />
          ))}
        </div>

        {/* "Yesterday" group */}
        <div>
          <div className="p-4">
            <Skeleton className="h-5 w-20" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <NotificationItemSkeleton key={`yesterday-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationItemSkeleton() {
  return (
    <div className="flex items-start p-4 gap-3">
      {/* Avatar */}
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex gap-2 items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-full max-w-[180px]" />
        <Skeleton className="h-3 w-12" />
      </div>
      
      {/* Right side */}
      <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
    </div>
  );
}