'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  signUpSchema,
  signInSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '@/lib/validations/auth'
import { headers } from 'next/headers'
import { checkAuthRateLimit } from '@/lib/rate-limit'

export type AuthActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
}

export async function signUp(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  // Rate limit by IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitResult = await checkAuthRateLimit(ip)
  if (!rateLimitResult.success) {
    return { error: 'Too many attempts. Please wait a moment and try again.' }
  }

  const supabase = await createClient()

  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { email, password, fullName } = parsed.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: {
        full_name: fullName || '',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/verify-email')
}

export async function signIn(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  // Rate limit by IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitResult = await checkAuthRateLimit(ip)
  if (!rateLimitResult.success) {
    return { error: 'Too many attempts. Please wait a moment and try again.' }
  }

  const supabase = await createClient()

  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  // Rate limit by IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitResult = await checkAuthRateLimit(ip)
  if (!rateLimitResult.success) {
    return { error: 'Too many attempts. Please wait a moment and try again.' }
  }

  const supabase = await createClient()

  const parsed = resetPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { email } = parsed.data

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient()

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { password } = parsed.data

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function deleteAccount(): Promise<AuthActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const admin = createServiceRoleClient()

  // Delete business (cascades to message_templates, customers, send_logs, subscriptions, scheduled_sends)
  const { error: deleteBusinessError } = await admin
    .from('businesses')
    .delete()
    .eq('user_id', user.id)

  if (deleteBusinessError) {
    return { error: 'Failed to delete account data. Please try again.' }
  }

  // Delete profile row if it exists
  await admin.from('profiles').delete().eq('id', user.id)

  // Delete the auth user via admin API
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteUserError) {
    return { error: 'Failed to delete account. Please try again.' }
  }

  // Sign out current session
  await supabase.auth.signOut()

  redirect('/')
}

export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error) {
    return { error: error.message }
  }
  if (data.url) {
    return { url: data.url }
  }
  return { error: 'Failed to get OAuth URL from provider' }
}
