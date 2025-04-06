"use client";

import {
  BellIcon,
  CalendarIcon,
  DollarSignIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  PieChartIcon,
  PlusIcon,
  SettingsIcon,
  SunIcon,
  WalletIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

interface MobileNavbarProps {
  upcomingPaymentsCount?: number;
}

function MobileNavbar({ upcomingPaymentsCount = 0 }: MobileNavbarProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex md:hidden items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="mr-2"
      >
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {isSignedIn && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full mr-2"
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
      )}

      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px]">
          <SheetHeader className="mb-4">
            <SheetTitle>ExpenseTracker</SheetTitle>
          </SheetHeader>

          {isSignedIn && user ? (
            <>
              {/* User Profile */}
              <div className="flex items-center space-x-3 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                </Avatar>
                <div>
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    @{user.username || user.primaryEmailAddress?.emailAddress.split('@')[0]}
                  </div>
                </div>
              </div>

              {/* Quick Add Section */}
              <div className="mb-6">
                <h3 className="font-medium text-sm mb-2">Quick Add</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild className="h-10 justify-start" onClick={() => setShowMobileMenu(false)}>
                    <Link href="/expenses/new">
                      <DollarSignIcon className="h-4 w-4 mr-2" />
                      Expense
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-10 justify-start" onClick={() => setShowMobileMenu(false)}>
                    <Link href="/budgets/new">
                      <WalletIcon className="h-4 w-4 mr-2" />
                      Budget
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-10 justify-start" onClick={() => setShowMobileMenu(false)}>
                    <Link href="/memberships/new">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Subscription
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-10 justify-start" onClick={() => setShowMobileMenu(false)}>
                    <Link href="/categories/new">
                      <PieChartIcon className="h-4 w-4 mr-2" />
                      Category
                    </Link>
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />
            </>
          ) : null}

          <nav className="flex flex-col space-y-4 mt-4">
            <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild onClick={() => setShowMobileMenu(false)}>
              <Link href="/dashboard">
                <HomeIcon className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild onClick={() => setShowMobileMenu(false)}>
              <Link href="/expenses">
                <DollarSignIcon className="w-4 h-4" />
                Expenses
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild onClick={() => setShowMobileMenu(false)}>
              <Link href="/budgets">
                <WalletIcon className="w-4 h-4" />
                Budgets
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild onClick={() => setShowMobileMenu(false)}>
              <Link href="/memberships">
                <CalendarIcon className="w-4 h-4" />
                Subscriptions
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild onClick={() => setShowMobileMenu(false)}>
              <Link href="/categories">
                <PieChartIcon className="w-4 h-4" />
                Categories
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild onClick={() => setShowMobileMenu(false)}>
              <Link href="/settings">
                <SettingsIcon className="w-4 h-4" />
                Settings
              </Link>
            </Button>

            {isSignedIn ? (
              <SignOutButton>
                <Button variant="ghost" className="flex items-center gap-3 justify-start w-full">
                  <LogOutIcon className="w-4 h-4" />
                  Sign Out
                </Button>
              </SignOutButton>
            ) : (
              <SignInButton mode="modal">
                <Button variant="default" className="w-full" onClick={() => setShowMobileMenu(false)}>
                  Sign In
                </Button>
              </SignInButton>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavbar;