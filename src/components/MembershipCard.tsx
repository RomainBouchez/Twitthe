// src/components/MembershipCard.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  EditIcon, 
  MoreHorizontalIcon, 
  Trash2Icon, 
  AlertCircleIcon,
  CheckCircleIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { format, isFuture, isPast, isToday, addDays } from "date-fns";
import { deleteMembership } from "@/actions/membership.action";
import Link from "next/link";
import toast from "react-hot-toast";

// Define types based on your Prisma schema
type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Membership = {
  id: string;
  name: string;
  amount: number;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: Date;
  nextBillingDate: Date;
  description: string | null;
  isActive: boolean;
  category: Category | null;
};

interface MembershipCardProps {
  membership: Membership;
  onDelete?: () => void;
}

export default function MembershipCard({ membership, onDelete }: MembershipCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteMembership(membership.id);
      
      if (result.success) {
        toast.success("Membership deleted successfully");
        if (onDelete) onDelete();
      } else {
        throw new Error(result.error || "Failed to delete membership");
      }
    } catch (error) {
      console.error("Error deleting membership:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete membership");
    } finally {
      setIsDeleting(false);
    }
  };

  // Formatting dates for display
  const formattedNextBillingDate = format(new Date(membership.nextBillingDate), "MMM d, yyyy");
  
  // Determine if next payment is soon (within 3 days)
  const isPaymentSoon = isFuture(new Date(membership.nextBillingDate)) && 
                       !isFuture(addDays(new Date(), 3)) &&
                       isPast(addDays(new Date(membership.nextBillingDate), -3));
  
  // Determine if payment is due today
  const isPaymentToday = isToday(new Date(membership.nextBillingDate));
  
  // Determine if payment is overdue
  const isPaymentOverdue = isPast(new Date(membership.nextBillingDate)) && !isToday(new Date(membership.nextBillingDate));
  
  // Get status text and style
  const getStatusInfo = () => {
    if (!membership.isActive) {
      return {
        icon: <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />,
        text: "Inactive",
        color: "text-muted-foreground"
      };
    }
    
    if (isPaymentOverdue) {
      return {
        icon: <AlertCircleIcon className="h-4 w-4 text-red-500" />,
        text: "Payment Overdue",
        color: "text-red-500"
      };
    }
    
    if (isPaymentToday) {
      return {
        icon: <AlertCircleIcon className="h-4 w-4 text-orange-500" />,
        text: "Due Today",
        color: "text-orange-500"
      };
    }
    
    if (isPaymentSoon) {
      return {
        icon: <AlertCircleIcon className="h-4 w-4 text-yellow-500" />,
        text: "Due Soon",
        color: "text-yellow-500"
      };
    }
    
    return {
      icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
      text: "Active",
      color: "text-green-500"
    };
  };
  
  const statusInfo = getStatusInfo();
  
  // Format billing cycle for display
  const formatBillingCycle = (cycle: string) => {
    return cycle.charAt(0).toUpperCase() + cycle.slice(1);
  };
  
  // Get category color or default
  const categoryColor = membership.category?.color || "#A7C5EB";

  return (
    <Card className="overflow-hidden border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10" style={{ backgroundColor: categoryColor }}>
              <AvatarImage src={`/icons/${membership.category?.icon || 'more-horizontal'}.svg`} />
            </Avatar>
            <div>
              <h3 className="font-semibold">{membership.name}</h3>
              <div className="flex items-center gap-1 text-xs">
                {statusInfo.icon}
                <span className={statusInfo.color}>{statusInfo.text}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-bold">{formatCurrency(membership.amount)}</div>
              <div className="text-xs text-muted-foreground">
                {formatBillingCycle(membership.billingCycle)}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/memberships/edit/${membership.id}`}>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500"
                  onClick={handleDelete}
                >
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  Delete subscription
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {membership.description && (
          <p className="mt-2 text-sm">{membership.description}</p>
        )}
        
        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="mr-1 h-4 w-4" />
          <span className={isPaymentToday || isPaymentOverdue ? "text-red-500" : ""}>
            Next payment: {formattedNextBillingDate}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}