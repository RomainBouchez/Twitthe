// src/components/Sidebar.tsx
import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { getUserByClerkId } from "@/actions/user.action";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import SidebarNav from "./SidebarNav";
import { DollarSign } from "lucide-react";
import { getMembershipStats } from "@/actions/membership.action";

async function Sidebar() {
  // Get the current authenticated user
  const authUser = await currentUser();
  if (!authUser) return <UnAuthenticatedSidebar />;

  // Get the user from the database
  const [user, membershipStats] = await Promise.all([
    getUserByClerkId(authUser.id),
    getMembershipStats()
  ]);
  
  if (!user) return null;

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 0 // No decimal places for monthly costs
    }).format(amount);
  };

  return (
    <div className="sticky top-20 space-y-6">
      {/* User Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Link
              href="/settings/profile"
              className="flex flex-col items-center justify-center"
            >
              <Avatar className="w-20 h-20 border-2">
                <AvatarImage src={user.image || "/avatar.png"} />
              </Avatar>

              <div className="mt-4 space-y-1">
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="py-4">
          <SidebarNav />
        </CardContent>
      </Card>

      {/* Subscription Summary (if available) */}
      {membershipStats && membershipStats.totalCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Subscriptions</CardTitle>
              <Link href="/memberships" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Monthly</div>
                <div className="font-medium">{formatCurrency(membershipStats.monthlyCost)}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Yearly</div>
                <div className="font-medium">{formatCurrency(membershipStats.yearlyCost)}</div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Total Subscriptions</div>
                <div className="font-medium">{membershipStats.totalCount}</div>
              </div>
              
              {membershipStats.upcomingPayments.length > 0 && (
                <div className="mt-3 text-xs text-orange-500 flex items-center justify-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {membershipStats.upcomingPayments.length} payment{membershipStats.upcomingPayments.length > 1 ? 's' : ''} due soon
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Sidebar;

// Component for unauthenticated users
const UnAuthenticatedSidebar = () => (
  <div className="sticky top-20">
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold">Welcome!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground mb-4">
          Sign in to track and manage your expenses.
        </p>
        <SignInButton mode="modal">
          <Button className="w-full" variant="outline">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button className="w-full mt-2" variant="default">
            Create Account
          </Button>
        </SignUpButton>
      </CardContent>
    </Card>
  </div>
);