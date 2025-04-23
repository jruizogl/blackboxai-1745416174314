-- Crear tabla para licencias de Microsoft (ejecución directa en Supabase)

-- Habilitar uuid-ossp para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tablas de catálogos
CREATE TABLE IF NOT EXISTS public.ms_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ms_areas' AND column_name='description') THEN
        ALTER TABLE public.ms_areas ADD COLUMN description TEXT;
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.ms_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ms_locations' AND column_name='description') THEN
        ALTER TABLE public.ms_locations ADD COLUMN description TEXT;
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.ms_warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location_id UUID REFERENCES public.ms_locations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ms_warehouses' AND column_name='description') THEN
        ALTER TABLE public.ms_warehouses ADD COLUMN description TEXT;
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.ms_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ms_positions' AND column_name='description') THEN
        ALTER TABLE public.ms_positions ADD COLUMN description TEXT;
    END IF;
END$$;

-- Crear la tabla de licencias con campos extendidos
CREATE TABLE IF NOT EXISTS public.ms_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_type TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  email TEXT,
  position_id UUID REFERENCES public.ms_positions(id),
  area_id UUID REFERENCES public.ms_areas(id),
  location_id UUID REFERENCES public.ms_locations(id),
  warehouse_id UUID REFERENCES public.ms_warehouses(id),
  account TEXT,
  assignee TEXT,
  renewal_date DATE,
  monthly_cost NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'Pendiente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ms_licenses' AND column_name='created_by') THEN
        ALTER TABLE public.ms_licenses ADD COLUMN created_by UUID REFERENCES public.ms_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ms_licenses' AND column_name='updated_by') THEN
        ALTER TABLE public.ms_licenses ADD COLUMN updated_by UUID REFERENCES public.ms_users(id);
    END IF;
END$$;

-- Añadir comentarios a las tablas
COMMENT ON TABLE public.ms_licenses IS 'Tabla para almacenar información de licencias de Microsoft';
COMMENT ON TABLE public.ms_areas IS 'Catálogo de áreas de la empresa';
COMMENT ON TABLE public.ms_locations IS 'Catálogo de ubicaciones';
COMMENT ON TABLE public.ms_warehouses IS 'Catálogo de bodegas';
COMMENT ON TABLE public.ms_positions IS 'Catálogo de puestos de trabajo';

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ms_licenses_license_type ON public.ms_licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_status ON public.ms_licenses(status);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_username ON public.ms_licenses(username);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_assignee ON public.ms_licenses(assignee);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_full_name ON public.ms_licenses(full_name);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_email ON public.ms_licenses(email);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_position_id ON public.ms_licenses(position_id);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_area_id ON public.ms_licenses(area_id);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_location_id ON public.ms_licenses(location_id);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_warehouse_id ON public.ms_licenses(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_ms_licenses_account ON public.ms_licenses(account);

-- Crear trigger para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ms_licenses_timestamp
BEFORE UPDATE ON public.ms_licenses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Habilitar Row Level Security
ALTER TABLE public.ms_licenses ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso
CREATE POLICY "Permitir acceso a todos los usuarios"
ON public.ms_licenses
FOR ALL
USING (true);

-- Habilitar realtime para esta tabla
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ms_licenses;

-- Insertar datos de ejemplo en los catálogos
-- Áreas
INSERT INTO public.ms_areas (name) VALUES 
  ('Ventas'),
  ('Operaciones'),
  ('TI'),
  ('Marketing'),
  ('Recursos Humanos'),
  ('Finanzas'),
  ('Logística'),
  ('Dirección');

-- Ubicaciones
INSERT INTO public.ms_locations (name) VALUES 
  ('Ciudad de México'),
  ('Monterrey'),
  ('Guadalajara'),
  ('Querétaro'),
  ('Cancún');

-- Puestos
INSERT INTO public.ms_positions (name) VALUES 
  ('Gerente'),
  ('Supervisor'),
  ('Analista'),
  ('Desarrollador'),
  ('Asistente'),
  ('Director'),
  ('Coordinador'),
  ('Especialista');

-- Bodegas (relacionadas con ubicaciones)
INSERT INTO public.ms_warehouses (name, location_id) VALUES 
  ('Bodega Principal CDMX', (SELECT id FROM public.ms_locations WHERE name = 'Ciudad de México')),
  ('Bodega Norte MTY', (SELECT id FROM public.ms_locations WHERE name = 'Monterrey')),
  ('Bodega Central GDL', (SELECT id FROM public.ms_locations WHERE name = 'Guadalajara')),
  ('Almacén QRO', (SELECT id FROM public.ms_locations WHERE name = 'Querétaro')),
  ('Almacén Turístico', (SELECT id FROM public.ms_locations WHERE name = 'Cancún'));

-- Insertar datos de ejemplo en licencias con catálogos
INSERT INTO public.ms_licenses (
  license_type, 
  username, 
  full_name, 
  email, 
  position_id, 
  area_id, 
  location_id, 
  warehouse_id, 
  account, 
  assignee, 
  renewal_date, 
  monthly_cost, 
  status, 
  notes
)
VALUES 
  (
    'Office 365 Business Standard', 
    'jperez', 
    'Juan Pérez', 
    'jperez@empresa.com', 
    (SELECT id FROM public.ms_positions WHERE name = 'Gerente'), 
    (SELECT id FROM public.ms_areas WHERE name = 'Ventas'), 
    (SELECT id FROM public.ms_locations WHERE name = 'Ciudad de México'), 
    (SELECT id FROM public.ms_warehouses WHERE name = 'Bodega Principal CDMX'), 
    'Corporativa', 
    'Departamento de Ventas', 
    CURRENT_DATE + INTERVAL '8 months', 
    12.50, 
    'Activa', 
    'Licencia para departamento de ventas'
  ),
  (
    'Microsoft 365 E3', 
    'agomez', 
    'Ana Gómez', 
    'agomez@empresa.com', 
    (SELECT id FROM public.ms_positions WHERE name = 'Director'), 
    (SELECT id FROM public.ms_areas WHERE name = 'Operaciones'), 
    (SELECT id FROM public.ms_locations WHERE name = 'Monterrey'), 
    (SELECT id FROM public.ms_warehouses WHERE name = 'Bodega Norte MTY'), 
    'Ejecutiva', 
    'Dirección General', 
    CURRENT_DATE + INTERVAL '5 months', 
    32.00, 
    'Activa', 
    'Gerencia de operaciones'
  ),
  (
    'Office 365 Business Basic', 
    'crodriguez', 
    'Carlos Rodríguez', 
    'crodriguez@empresa.com', 
    (SELECT id FROM public.ms_positions WHERE name = 'Analista'), 
    (SELECT id FROM public.ms_areas WHERE name = 'TI'), 
    (SELECT id FROM public.ms_locations WHERE name = 'Guadalajara'), 
    (SELECT id FROM public.ms_warehouses WHERE name = 'Bodega Central GDL'), 
    'Soporte', 
    'Departamento de TI', 
    CURRENT_DATE + INTERVAL '10 months', 
    6.00, 
    'Activa', 
    'Departamento de soporte'
  ),
  (
    'Office 365 Business Premium', 
    'mgarcia', 
    'María García', 
    'mgarcia@empresa.com', 
    (SELECT id FROM public.ms_positions WHERE name = 'Coordinador'), 
    (SELECT id FROM public.ms_areas WHERE name = 'Marketing'), 
    (SELECT id FROM public.ms_locations WHERE name = 'Querétaro'), 
    (SELECT id FROM public.ms_warehouses WHERE name = 'Almacén QRO'), 
    'Marketing', 
    'Equipo Creativo', 
    CURRENT_DATE + INTERVAL '7 months', 
    22.00, 
    'Inactiva', 
    'Departamento de marketing'
  ),
  (
    'Microsoft 365 E5', 
    NULL, 
    NULL, 
    NULL, 
    NULL, 
    NULL, 
    NULL, 
    NULL, 
    'Reserva', 
    NULL, 
    CURRENT_DATE + INTERVAL '3 months', 
    57.00, 
    'Pendiente', 
    'Licencia disponible para asignación'
  );
