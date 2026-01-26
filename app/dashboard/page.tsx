import { redirect } from "next/navigation";

// Redirect to the template's protected page until dashboard is built
export default function DashboardPage() {
  redirect("/protected");
}
