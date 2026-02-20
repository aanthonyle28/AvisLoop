"use client";

import { useActionState, useState, useEffect } from "react";
import { signIn, type AuthActionState } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, pending] = useActionState<AuthActionState | null, FormData>(signIn, null);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when a new error arrives
  useEffect(() => {
    setDismissed(false);
  }, [state]);

  const showError = state?.error && !dismissed;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      {/* Email/Password Form */}
      <form action={formAction} noValidate className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="m@example.com"
              aria-label="Email address"
              required
              aria-invalid={!!state?.fieldErrors?.email}
              aria-describedby={state?.fieldErrors?.email ? "login-email-error" : undefined}
            />
            {state?.fieldErrors?.email && (
              <p id="login-email-error" role="alert" className="text-sm text-error-text">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="login-password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              name="password"
              required
              autoComplete="current-password"
              aria-invalid={!!state?.fieldErrors?.password}
              aria-describedby={state?.fieldErrors?.password ? "login-password-error" : undefined}
            />
            {state?.fieldErrors?.password && (
              <p id="login-password-error" role="alert" className="text-sm text-error-text">{state.fieldErrors.password[0]}</p>
            )}
          </div>
          {showError && (
            <button
              type="button"
              className="text-sm text-error-text hover:text-destructive text-left"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss error"
            >
              {state.error}
            </button>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Logging in..." : "Login"}
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
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="underline underline-offset-4"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
