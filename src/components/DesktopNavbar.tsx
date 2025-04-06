"use client";

import { BellIcon, HomeIcon, PlusIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import ModeToggle from "./ModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DesktopNavbarProps {
  upcomingPaymentsCount?: number;
}

function DesktopNavbar({ upcomingPaymentsCount = 0 }: DesktopNavbarProps) {
  const { user } = useUser();

  return (
    <div className="hidden md:flex items-center space-x-4">
      <ModeToggle />

      {user ? (
        <>
          {/* Quick Add Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative rounded-full">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/expenses/new">
                  Add Expense
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/budgets/new">
                  Create Budget
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/memberships/new">
                  Add Subscription
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/categories/new">
                  New Category
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notification Button (for upcoming payments) */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative rounded-full"
            asChild
          >
            <Link href="/memberships">
              <BellIcon className="h-4 w-4" />
              {upcomingPaymentsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {upcomingPaymentsCount}
                </span>
              )}
            </Link>
          </Button>

          {/* User Menu */}
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </>
      ) : (
        <SignInButton mode="modal">
          <Button variant="default">Sign In</Button>
        </SignInButton>
      )}
    </div>
  );
}

export default DesktopNavbar;