// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Simply redirect to the dashboard page
  redirect("/dashboard");
}