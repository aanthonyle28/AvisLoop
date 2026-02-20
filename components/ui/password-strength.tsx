'use client';

import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type Requirement = { label: string; met: boolean };

export function getRequirements(password: string): Requirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function PasswordStrengthChecklist({ password }: { password: string }) {
  if (!password) return null;

  const requirements = getRequirements(password);

  return (
    <ul
      className="mt-2 space-y-1"
      aria-live="polite"
      aria-label="Password requirements"
    >
      {requirements.map((req) => (
        <li key={req.label} className={cn('flex items-center gap-2 text-xs')}>
          {req.met ? (
            <CheckCircle
              size={14}
              weight="fill"
              className="shrink-0 text-success"
              aria-hidden
            />
          ) : (
            <XCircle
              size={14}
              weight="regular"
              className="shrink-0 text-muted-foreground"
              aria-hidden
            />
          )}
          <span className={req.met ? 'text-success-foreground' : 'text-muted-foreground'}>
            {req.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
