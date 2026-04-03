"use client";

import { useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const showError = error && !dismissed;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setDismissed(false);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email) {
      setFieldErrors({ email: ["Email is required"] });
      setPending(false);
      return;
    }
    if (!password) {
      setFieldErrors({ password: ["Password is required"] });
      setPending(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Login failed");
        return;
      }

      // Full page navigation so browser sends the freshly set cookies
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      window.location.href = isLocalhost
        ? "/dashboard"
        : "https://app.avisloop.com/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

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
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              aria-invalid={!!fieldErrors.email}
              aria-describedby={
                fieldErrors.email ? "login-email-error" : undefined
              }
            />
            {fieldErrors.email && (
              <p
                id="login-email-error"
                role="alert"
                className="text-sm text-error-text"
              >
                {fieldErrors.email[0]}
              </p>
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
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? "login-password-error" : undefined
              }
            />
            {fieldErrors.password && (
              <p
                id="login-password-error"
                role="alert"
                className="text-sm text-error-text"
              >
                {fieldErrors.password[0]}
              </p>
            )}
          </div>
          {showError && (
            <button
              type="button"
              className="text-sm text-error-text hover:text-destructive text-left"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss error"
            >
              {error}
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
    </div>
  );
}
