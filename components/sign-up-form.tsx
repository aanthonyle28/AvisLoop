"use client";

import { useActionState, useState } from "react";
import { signUp, type AuthActionState } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthChecklist } from "@/components/ui/password-strength";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import Link from "next/link";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, pending] = useActionState<AuthActionState | null, FormData>(signUp, null);
  const [passwordValue, setPasswordValue] = useState('');

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">
          Start collecting reviews in minutes
        </p>
      </div>

      {/* Email/Password Form */}
      <form action={formAction} noValidate className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-fullName">Full Name (optional)</Label>
            <Input
              id="signup-fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
            />
            {state?.fieldErrors?.fullName && (
              <p className="text-sm text-error-text">{state.fieldErrors.fullName[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              placeholder="m@example.com"
              aria-label="Email address"
              required
              aria-invalid={!!state?.fieldErrors?.email}
              aria-describedby={state?.fieldErrors?.email ? "signup-email-error" : undefined}
            />
            {state?.fieldErrors?.email && (
              <p id="signup-email-error" role="alert" className="text-sm text-error-text">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <PasswordInput
              id="signup-password"
              name="password"
              required
              autoComplete="new-password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.password}
              aria-describedby={state?.fieldErrors?.password ? "signup-password-error" : undefined}
            />
            {state?.fieldErrors?.password && (
              <p id="signup-password-error" role="alert" className="text-sm text-error-text">{state.fieldErrors.password[0]}</p>
            )}
            <PasswordStrengthChecklist password={passwordValue} />
          </div>
          {state?.error && <p className="text-sm text-error-text">{state.error}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating an account..." : "Sign up"}
        </Button>
      </form>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <GoogleOAuthButton />

      {/* Account Toggle */}
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/login" className="underline underline-offset-4">
          Login
        </Link>
      </div>
    </div>
  );
}
