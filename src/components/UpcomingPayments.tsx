"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { updateNextBillingDate } from "@/actions/membership.action";
import { useState } from "react";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Membership = {
  id: string;
  name: string;
  amount: { toNumber: () => number };
  billingCycle: string;
  nextBillingDate: Date;
  isActive: boolean;
  category: Category | null;
};

interface UpcomingPaymentsProps {
  payments: Membership[];
}

export default function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Handle marking a payment as paid
  const handleMarkAsPaid = async (id: string) => {
    try {
      setProcessingId(id);
      const result = await updateNextBillingDate(id);
      
      if (result.success) {
        toast.success("Payment marked as paid and next billing date updated");
        // Reload the page to refresh the data
        window.location.reload();
      } else {
        throw new Error(result.error || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update payment status");
    } finally {
      setProcessingId(null);
    }
  };

  // Format the next billing date
  const formatBillingDate = (date: Date) => {
    const today = new Date();
    const paymentDate = new Date(date);
    
    // Check if payment is due today
    if (
      paymentDate.getDate() === today.getDate() &&
      paymentDate.getMonth() === today.getMonth() &&
      paymentDate.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    }
    
    return format(paymentDate, "MMM d, yyyy");
  };

  // Sort payments by nearest date first
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime()
  );

  if (payments.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-2">No upcoming payments</p>
        <Link 
          href="/memberships" 
          className="text-sm text-primary hover:underline"
        >
          View all subscriptions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedPayments.map((payment) => (
        <div 
          key={payment.id}
          className="p-3 rounded-md border hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border" style={{ backgroundColor: payment.category?.color || "#A7C5EB" }}>
                <AvatarImage src={`/icons/${payment.category?.icon || 'more-horizontal'}.svg`} />
              </Avatar>
              <div>
                <Link 
                  href={`/memberships/${payment.id}`}
                  className="font-medium hover:underline"
                >
                  {payment.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  Due {formatBillingDate(payment.nextBillingDate)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-semibold">
                {formatCurrency(payment.amount.toNumber())}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                onClick={() => handleMarkAsPaid(payment.id)}
                disabled={!!processingId}
              >
                {processingId === payment.id ? (
                  "Processing..."
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Paid
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}