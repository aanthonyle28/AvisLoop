import { redirect } from "next/navigation";

// Redirect to the template's auth/sign-up page
export default function SignupPage() {
  redirect("/auth/sign-up");
}
