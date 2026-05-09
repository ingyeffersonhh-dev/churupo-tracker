-- ============================================================
-- EJECUTAR ESTE SCRIPT EN: Supabase Dashboard → SQL Editor
-- Proyecto: zmeqyqxlzgjcjweuxixt
-- ============================================================

-- 1. Crear tabla telegram_users
CREATE TABLE IF NOT EXISTS public.telegram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON public.telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON public.telegram_users(user_id);

-- 3. Activar Row Level Security
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (el service_role las bypasa automáticamente)
CREATE POLICY IF NOT EXISTS "Users can view their own telegram link"
    ON public.telegram_users FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own telegram link"
    ON public.telegram_users FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own telegram link"
    ON public.telegram_users FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own telegram link"
    ON public.telegram_users FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_telegram_users_updated_at ON public.telegram_users;
CREATE TRIGGER update_telegram_users_updated_at
    BEFORE UPDATE ON public.telegram_users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Verificar que se creó bien
SELECT 'telegram_users table created successfully' AS status;
SELECT COUNT(*) as total_records FROM public.telegram_users;
