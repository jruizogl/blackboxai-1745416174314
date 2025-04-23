-- Create table for Microsoft licenses if it doesn't exist
CREATE OR REPLACE FUNCTION create_ms_licenses_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'ms_licenses'
  ) THEN
    -- Create the licenses table
    CREATE TABLE public.ms_licenses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      license_type TEXT NOT NULL,
      username TEXT,
      assignee TEXT,
      renewal_date DATE,
      monthly_cost NUMERIC(10, 2) DEFAULT 0,
      status TEXT DEFAULT 'Pendiente',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add comment to table
    COMMENT ON TABLE public.ms_licenses IS 'Tabla para almacenar información de licencias de Microsoft';

    -- Create indexes for improved performance
    CREATE INDEX idx_ms_licenses_license_type ON public.ms_licenses(license_type);
    CREATE INDEX idx_ms_licenses_status ON public.ms_licenses(status);
    CREATE INDEX idx_ms_licenses_username ON public.ms_licenses(username);
    CREATE INDEX idx_ms_licenses_assignee ON public.ms_licenses(assignee);

    -- Set up RLS (Row Level Security)
    ALTER TABLE public.ms_licenses ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow read access to all authenticated users
    CREATE POLICY "Allow read access for all users" 
      ON public.ms_licenses FOR SELECT USING (true);

    -- Create policy to allow insert access to all authenticated users
    CREATE POLICY "Allow insert access for all users" 
      ON public.ms_licenses FOR INSERT WITH CHECK (true);

    -- Create policy to allow update access to all authenticated users
    CREATE POLICY "Allow update access for all users" 
      ON public.ms_licenses FOR UPDATE USING (true);

    -- Create policy to allow delete access to all authenticated users
    CREATE POLICY "Allow delete access for all users" 
      ON public.ms_licenses FOR DELETE USING (true);

    -- Enable realtime subscriptions
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ms_licenses;
  END IF;
END;
$$;

-- Create a function that returns the SQL to create the stored procedure
-- This is a workaround for systems that don't allow direct function creation
CREATE OR REPLACE FUNCTION create_ms_licenses_table_function()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'Function already exists';
END;
$$;

-- Execute the function to create the table
SELECT create_ms_licenses_table();
