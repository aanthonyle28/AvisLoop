"use client";

import { useActionState, useState } from "react";
import { updatePassword, type AuthActionState } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthChecklist } from "@/components/ui/password-strength";
import { Label } from "@/components/ui/label";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, pending] = useActionState<AuthActionState | null, FormData>(updatePassword, null);
  const [passwordValue, setPasswordValue] = useState('');

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="New password"
                  required
                  autoComplete="new-password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  aria-invalid={!!state?.fieldErrors?.password}
                  aria-describedby={state?.fieldErrors?.password ? "password-error" : undefined}
                />
                {state?.fieldErrors?.password && (
                  <p id="password-error" role="alert" className="text-sm text-error-text">{state.fieldErrors.password[0]}</p>
                )}
                <PasswordStrengthChecklist password={passwordValue} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  required
                  autoComplete="off"
                  aria-invalid={!!state?.fieldErrors?.confirmPassword}
                  aria-describedby={state?.fieldErrors?.confirmPassword ? "confirmPassword-error" : undefined}
                />
                {state?.fieldErrors?.confirmPassword && (
                  <p id="confirmPassword-error" role="alert" className="text-sm text-error-text">{state.fieldErrors.confirmPassword[0]}</p>
                )}
              </div>
              {state?.error && <p className="text-sm text-error-text">{state.error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Saving..." : "Save new password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
