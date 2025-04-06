// src/components/SidebarNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, 
  CreditCard, 
  DollarSign, 
  Home, 
  PieChart, 
  Settings,
  Wallet,
  Calendar
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function SidebarNav() {
  const pathname = usePathname();
  
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Expenses",
      href: "/expenses",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Budgets",
      href: "/budgets",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      title: "Subscriptions",
      href: "/memberships",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Categories",
      href: "/categories",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  return (
    <div className="w-full">
      <div className="space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname.startsWith(item.href) ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              pathname.startsWith(item.href) ? "bg-primary" : ""
            )}
            asChild
          >
            <Link href={item.href}>
              {item.icon}
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}