--- supabase/migrations/001_initial_schema.sql ---

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL CHECK (char_length(description) <= 1000),
  image_path TEXT NOT NULL,
  location TEXT,
  anonymous_display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  solved BOOLEAN NOT NULL DEFAULT FALSE,
  solved_at TIMESTAMPTZ,
  solved_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_reports_solved ON public.reports(solved);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Allow public read access to all reports
CREATE POLICY "Public can view all reports"
  ON public.reports
  FOR SELECT
  USING (true);

-- Policy 2: Only service_role can insert reports (via API)
-- Note: We don't create an INSERT policy for anon users since we handle
-- inserts through the API with service_role key

-- Policy 3: Only authenticated users can update solved status
-- This policy allows authenticated admins to update via direct Supabase client
-- However, we recommend using the API endpoint which uses service_role
CREATE POLICY "Authenticated users can update solved status"
  ON public.reports
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create storage bucket for report images (run this via Supabase Dashboard or CLI)
-- This is a comment/note - actual bucket creation is done through Supabase Dashboard or API

-- Storage policies (to be created in Supabase Dashboard under Storage > reports-images):
-- 1. Allow public read access:
--    Policy name: "Public read access"
--    Allowed operation: SELECT
--    Policy definition: (bucket_id = 'reports-images')
--
-- 2. Allow service_role to upload (handled automatically by service_role key)

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.reports TO anon, authenticated;
GRANT UPDATE ON public.reports TO authenticated;

-- Note: The service_role key bypasses RLS and has full access
