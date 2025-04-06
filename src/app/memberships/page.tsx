// src/app/memberships/page.tsx
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { getMemberships, getMembershipStats } from "@/actions/membership.action";
import MembershipCard from "@/components/MembershipCard";
import Link from "next/link";

export default function MembershipsPage() {
  return (
    <Suspense fallback={<MembershipsLoading />}>
      <MembershipsContent />
    </Suspense>
  );
}

async function MembershipsContent() {
  const [memberships, stats] = await Promise.all([
    getMemberships(),
    getMembershipStats()
  ]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">
            {memberships.length > 0
              ? `${memberships.length} active ${memberships.length === 1 ? "subscription" : "subscriptions"}`
              : "Track your recurring payments"}
          </p>
        </div>
        <Link href="/memberships/new">
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Subscription
          </Button>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Monthly Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlyCost)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Yearly Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.yearlyCost)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Upcoming (7 days)</p>
                <p className="text-2xl font-bold">{stats.upcomingPayments.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {memberships.length > 0 ? (
        <div className="space-y-4">
          {stats?.upcomingPayments.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mt-6">Upcoming Payments</h2>
              <div className="space-y-4">
                {stats.upcomingPayments.map((membership) => (
                  <MembershipCard
                    key={membership.id}
                    membership={membership}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            </>
          )}

          <h2 className="text-xl font-semibold mt-6">All Subscriptions</h2>
          <div className="space-y-4">
            {memberships.map((membership) => (
              <MembershipCard
                key={membership.id}
                membership={membership}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No subscriptions found</p>
            <Link href="/memberships/new">
              <Button>Add Your First Subscription</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MembershipsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-10 w-40 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-60 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="text-center">
                <div className="h-4 w-24 bg-muted rounded animate-pulse mx-auto mb-2"></div>
                <div className="h-7 w-28 bg-muted rounded animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Memberships */}
      <div className="space-y-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg overflow-hidden shadow-sm">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-5 w-32 bg-muted rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-20 bg-muted rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="h-3 w-full bg-muted rounded animate-pulse mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}