-- PULSE Database Schema

-- 1. Residents Table
CREATE TABLE residents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Added updated_at
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  birthdate DATE,
  age INTEGER, -- Can be derived but caching is useful for risk logic
  sex TEXT CHECK (sex IN ('Male', 'Female')),
  address TEXT NOT NULL,
  barangay_zone TEXT,
  
  -- Vulnerability Flags
  is_senior BOOLEAN DEFAULT FALSE,
  is_pwd BOOLEAN DEFAULT FALSE,
  is_pregnant BOOLEAN DEFAULT FALSE, -- Only for Female
  is_child BOOLEAN DEFAULT FALSE,
  
  -- Risk Status (Computed)
  risk_score INTEGER DEFAULT 0,
  risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High')) DEFAULT 'Low',
  last_visit DATE,
  follow_up_required BOOLEAN DEFAULT FALSE
);

-- 2. Resident Conditions (e.g., Hypertension, Diabetes)
CREATE TABLE resident_conditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  condition TEXT NOT NULL,
  diagnosed_date DATE
);

-- 3. Visits
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  visit_date DATE DEFAULT CURRENT_DATE,
  provider_name TEXT, -- BHW Name
  follow_up_required BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- 4. Visit Symptoms
CREATE TABLE visit_symptoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  symptom TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('Mild', 'Moderate', 'Severe'))
);

-- 5. Organization Settings (Singleton)
CREATE TABLE organization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barangay_name TEXT DEFAULT 'Brgy. Santa Rosa',
  municipality TEXT DEFAULT 'Santa Rosa City',
  health_station_id TEXT DEFAULT 'BHS-001',
  
  -- Risk Weights
  weight_age_over_60 INTEGER DEFAULT 30,
  weight_pregnancy INTEGER DEFAULT 30,
  weight_chronic_condition INTEGER DEFAULT 10,
  weight_missed_visit INTEGER DEFAULT 25,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Roles (RBAC)
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'bhw')) DEFAULT 'bhw',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_residents_name ON residents(last_name, first_name);
CREATE INDEX idx_residents_risk ON residents(risk_level);
CREATE INDEX idx_visits_resident ON visits(resident_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 0. Helper Function for Admin Check
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Residents (Readable by all auth, Writable by all auth for now - BHWs need to write)
-- In a stricter system, maybe only Admin/Head BHW can delete.
CREATE POLICY "Enable read access for authenticated users" ON residents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON residents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON residents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON residents FOR DELETE TO authenticated USING (true);

-- 2. Conditions
CREATE POLICY "Enable read access for authenticated users" ON resident_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON resident_conditions FOR ALL TO authenticated USING (true);

-- 3. Visits
CREATE POLICY "Enable read access for authenticated users" ON visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON visits FOR ALL TO authenticated USING (true);

-- 4. Visit Symptoms
CREATE POLICY "Enable read access for authenticated users" ON visit_symptoms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON visit_symptoms FOR ALL TO authenticated USING (true);

-- 5. Organization Settings (STRICT: Read by All, Write by Admin Only)
CREATE POLICY "Everyone can read settings" ON organization_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update settings" ON organization_settings
    FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can insert settings" ON organization_settings
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- 6. User Roles (STRICT: Read Own, Write by Admin Only)
CREATE POLICY "Users read own role" ON user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins read all roles" ON user_roles
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins manage roles" ON user_roles
    FOR ALL TO authenticated USING (public.is_admin());
