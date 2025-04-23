-- Actualización de tablas para autenticación y bitácora de eventos

-- Habilitar uuid-ossp si aún no está habilitado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de usuarios
CREATE TABLE IF NOT EXISTS public.ms_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir comentario a la tabla
COMMENT ON TABLE public.ms_users IS 'Usuarios del sistema de gestión de licencias';

-- Trigger para actualizar timestamp
CREATE OR REPLACE TRIGGER update_ms_users_timestamp
BEFORE UPDATE ON public.ms_users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 2. Tabla de bitácora (audit log)
CREATE TABLE IF NOT EXISTS public.ms_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.ms_users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
  resource_type TEXT NOT NULL, -- 'license', 'area', 'position', 'location', 'warehouse', 'user'
  resource_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir comentario a la tabla
COMMENT ON TABLE public.ms_audit_log IS 'Bitácora de eventos y cambios en el sistema';

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_ms_audit_log_user_id ON public.ms_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ms_audit_log_action ON public.ms_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_ms_audit_log_resource_type ON public.ms_audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_ms_audit_log_resource_id ON public.ms_audit_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_ms_audit_log_created_at ON public.ms_audit_log(created_at);

-- 3. Añadir usuario administrador predeterminado (password: admin123)
-- Nota: En producción, este password debe ser cambiado inmediatamente
INSERT INTO public.ms_users (email, full_name, password_hash, role)
VALUES ('admin@empresa.com', 'Administrador Sistema', '$2a$10$vKKOXV5f7q.5SgvPPp4SJO0eTHkOQGAz5T00tdmWaZyB4V9J4T5Y.', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 4. Configuración de políticas RLS para protección de datos
ALTER TABLE public.ms_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ms_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo administradores pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" 
ON public.ms_users FOR SELECT 
USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.ms_users
    WHERE id = auth.uid() AND role = 'admin'
));

-- Los usuarios solo pueden ver y editar su propio perfil
CREATE POLICY "Users can view own profile" 
ON public.ms_users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.ms_users FOR UPDATE 
USING (auth.uid() = id);

-- Solo administradores pueden crear/eliminar usuarios
CREATE POLICY "Admins can insert users" 
ON public.ms_users FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.ms_users
    WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can delete users" 
ON public.ms_users FOR DELETE 
USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.ms_users
    WHERE id = auth.uid() AND role = 'admin'
));

-- Policies para audit log
CREATE POLICY "Anyone authenticated can view audit log" 
ON public.ms_audit_log FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone authenticated can insert to audit log" 
ON public.ms_audit_log FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Habilitar realtime para las nuevas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.ms_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ms_audit_log;

-- Modificar la tabla de licencias para que tenga un campo de usuario
ALTER TABLE public.ms_licenses 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.ms_users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.ms_users(id);
