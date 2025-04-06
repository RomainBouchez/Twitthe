// src/components/Navbar.tsx
import Link from "next/link";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";
import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user.action";
import { getUpcomingPayments } from "@/actions/membership.action";

async function Navbar() {
  // Get the current authenticated user
  const user = await currentUser();
  
  // If user is authenticated, sync them with the database
  if (user) {
    await syncUser();
  }
  
  // Get upcoming payments for notification badge
  const upcomingPayments = user ? await getUpcomingPayments(2) : [];
  
  return (
    <nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary font-mono tracking-wider">
              <span className="text-2xl">💰</span> ExpenseTracker
            </Link>
          </div>

          <DesktopNavbar upcomingPaymentsCount={upcomingPayments.length} />
          <MobileNavbar upcomingPaymentsCount={upcomingPayments.length} />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;