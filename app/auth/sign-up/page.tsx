import Link from "next/link";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Simple header with logo */}
      <header className="p-4">
        <Link href="/" className="text-xl font-bold">
          AvisLoop
        </Link>
      </header>

      {/* Sign up form content */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
