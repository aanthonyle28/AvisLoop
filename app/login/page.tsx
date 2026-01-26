import { redirect } from "next/navigation";

// Redirect to the template's auth/login page
export default function LoginPage() {
  redirect("/auth/login");
}
