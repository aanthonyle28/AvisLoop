-- Migration: 00001_create_profiles
-- Purpose: User profile storage with RLS for multi-tenant isolation

-- Create profiles table
-- Links to auth.users via user_id, stores additional user metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- CRITICAL: Enable Row Level Security immediately
-- Without this, all users can see all profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Performance: Index on user_id for RLS policy efficiency
-- Wrap auth.uid() in SELECT to cache result per statement
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles USING btree (user_id);

-- Policy: Users can view only their own profile
CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can insert only their own profile
CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update only their own profile
CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete only their own profile
CREATE POLICY "Users delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Trigger: Auto-create profile on user signup
-- This ensures every auth.users entry has a corresponding profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at timestamp on profile changes
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
