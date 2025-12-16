-- PULSE Security Update Script
-- Run this to update your EXISTING database with the new strict security policies.
-- This will NOT delete your data. It only updates the security rules.

-- 1. Helper Function for Admin Check
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Organization Settings Policies
-- Drop old permissive policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON organization_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON organization_settings;
DROP POLICY IF EXISTS "Everyone can read settings" ON organization_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON organization_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON organization_settings;

-- Create new strict policies
CREATE POLICY "Everyone can read settings" ON organization_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update settings" ON organization_settings
    FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert settings" ON organization_settings
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- 3. User Roles Policies
-- Drop old permissive policies
DROP POLICY IF EXISTS "Enable read access for users to their own role" ON user_roles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Users read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;

-- Create new strict policies
CREATE POLICY "Users read own role" ON user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins read all roles" ON user_roles
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins manage roles" ON user_roles
    FOR ALL TO authenticated USING (public.is_admin());

-- 4. Update Tables Updated_At Trigger (Optional improvement)
-- Ensures updated_at columns (if any) are managed, but mainly just enforcing RLS here.

-- 5. Force RLS Enablement (just in case)
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
