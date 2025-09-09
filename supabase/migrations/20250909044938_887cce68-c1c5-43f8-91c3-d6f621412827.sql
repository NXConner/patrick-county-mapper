-- Create workspaces table that's referenced throughout the codebase
CREATE TABLE public.workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(name, created_by)
);

-- Create workspace_versions table for version history
CREATE TABLE public.workspace_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_name TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  description TEXT
);

-- Create employees table for employee tracking
CREATE TABLE public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  position TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspaces
CREATE POLICY "Users can manage their own workspaces" 
ON public.workspaces 
FOR ALL 
USING (auth.uid() = created_by);

-- Enable RLS on workspace_versions  
ALTER TABLE public.workspace_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspace_versions
CREATE POLICY "Users can manage their own workspace versions" 
ON public.workspace_versions 
FOR ALL 
USING (auth.uid() = created_by);

-- Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees
CREATE POLICY "Users can view all employees" 
ON public.employees 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own employee record" 
ON public.employees 
FOR ALL 
USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample employee data for demo
INSERT INTO public.employees (first_name, last_name, email, position, status) VALUES
('John', 'Smith', 'john.smith@example.com', 'Field Supervisor', 'active'),
('Sarah', 'Johnson', 'sarah.johnson@example.com', 'Surveyor', 'active'),
('Mike', 'Davis', 'mike.davis@example.com', 'Equipment Operator', 'inactive'),
('Lisa', 'Wilson', 'lisa.wilson@example.com', 'Project Manager', 'active');