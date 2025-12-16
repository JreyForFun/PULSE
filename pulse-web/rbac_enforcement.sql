-- PULSE RBAC Enforcement Script
-- Run this in your Supabase SQL Editor to STRICTLY enforce Admin privileges.

-- 1. Helper Function to check if current user is admin
-- This avoids repeating the subquery in every policy
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. SECURE ORGANIZATION SETTINGS
-- Drop the loose 'allow all' policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON organization_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON organization_settings;

-- New Policies:
-- Everyone (Authenticated) can READ settings (for Barangay Name etc.)
CREATE POLICY "Everyone can read settings" ON organization_settings
    FOR SELECT TO authenticated USING (true);

-- Only ADMINS can UPDATE settings
CREATE POLICY "Admins can update settings" ON organization_settings
    FOR UPDATE TO authenticated USING (public.is_admin());

-- Only ADMINS can INSERT settings (usually done once, but good to strictify)
CREATE POLICY "Admins can insert settings" ON organization_settings
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());


-- 3. SECURE USER ROLES
-- Drop loose policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for users to their own role" ON user_roles;

-- New Policies:
-- Users can read their OWN role (needed for AuthContext)
CREATE POLICY "Users read own role" ON user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can read ALL roles (for future User Management UI)
CREATE POLICY "Admins read all roles" ON user_roles
    FOR SELECT TO authenticated USING (public.is_admin());

-- Only ADMINS can assign roles (Insert/Update/Delete)
CREATE POLICY "Admins manage roles" ON user_roles
    FOR ALL TO authenticated USING (public.is_admin());

-- Exception: Allow initial Admin creation manually via SQL (which bypasses RLS if run by superuser)
-- but if you built a signup flow, you'd need a trigger or a specialized function.
-- For this MVP, we rely on manual SQL insert for the first admin, which works fine.
