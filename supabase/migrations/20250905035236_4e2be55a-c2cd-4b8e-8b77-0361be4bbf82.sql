-- Create missing tables for export logs, workspace members, and property data

-- Export logs table
CREATE TABLE IF NOT EXISTS public.export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  options JSONB DEFAULT '{}',
  error TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for export_logs
CREATE POLICY "Users can view own export logs" ON public.export_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own export logs" ON public.export_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Workspace members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_name, user_id)
);

-- Enable RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_members
CREATE POLICY "Users can view workspace memberships" ON public.workspace_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own workspace memberships" ON public.workspace_members
  FOR ALL USING (user_id = auth.uid());

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id TEXT,
  address TEXT,
  owner_name TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  assessed_value DECIMAL,
  property_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for properties
CREATE POLICY "Public read access to properties" ON public.properties
  FOR SELECT USING (true);

-- Property sales table
CREATE TABLE IF NOT EXISTS public.property_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id),
  sale_price DECIMAL,
  sale_date DATE,
  buyer_name TEXT,
  seller_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_sales ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_sales
CREATE POLICY "Public read access to property sales" ON public.property_sales
  FOR SELECT USING (true);

-- Property assessments table
CREATE TABLE IF NOT EXISTS public.property_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id),
  assessment_year INTEGER,
  land_value DECIMAL,
  building_value DECIMAL,
  total_value DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_assessments
CREATE POLICY "Public read access to property assessments" ON public.property_assessments
  FOR SELECT USING (true);