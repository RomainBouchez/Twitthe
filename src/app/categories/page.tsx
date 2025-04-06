// src/app/categories/page.tsx
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, EditIcon, Trash2Icon } from "lucide-react";
import { getCategories, deleteCategory } from "@/actions/category.action";
import Link from "next/link";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesLoading />}>
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  const categories = await getCategories();
  
  // Separate default and user-created categories
  const defaultCategories = categories.filter(category => category.isDefault);
  const userCategories = categories.filter(category => !category.isDefault);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your expenses with custom categories
          </p>
        </div>
        <Link href="/categories/new">
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            New Category
          </Button>
        </Link>
      </div>

      {userCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userCategories.map((category) => (
                <div 
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar style={{ backgroundColor: category.color || "#A7C5EB" }}>
                      <AvatarImage src={`/icons/${category.icon || 'more-horizontal'}.svg`} />
                    </Avatar>
                    <div className="font-medium">{category.name}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/categories/edit/${category.id}`}>
                        <EditIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-700"
                      onClick={async () => {
                        const result = await deleteCategory(category.id);
                        if (!result.success) {
                          alert(result.error);
                        }
                      }}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Default Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultCategories.map((category) => (
              <div 
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar style={{ backgroundColor: category.color || "#A7C5EB" }}>
                    <AvatarImage src={`/icons/${category.icon || 'more-horizontal'}.svg`} />
                  </Avatar>
                  <div className="font-medium">{category.name}</div>
                </div>
                <div className="text-xs text-muted-foreground">Default</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {userCategories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No custom categories yet</p>
            <Link href="/categories/new">
              <Button>Create Your First Category</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-10 w-40 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-60 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-6 border-b">
          <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                  <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="flex gap-1">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}