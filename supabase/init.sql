-- ==========================================
-- FASE 1: Scripts SQL para Supabase (PostgreSQL)
-- Tablas y políticas de Row Level Security (RLS)
-- ==========================================

-- 1. Tabla de tasas de cambio
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    bcv_rate DECIMAL(10, 4) NOT NULL,
    parallel_rate DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de reglas de comercios
CREATE TABLE IF NOT EXISTS merchant_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de presupuestos
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    limit_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'VES')),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id, month, year)
);

-- 5. Tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'VES')),
    usd_equivalent DECIMAL(12, 2),
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    source VARCHAR(10) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_user_id ON merchant_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_keyword ON merchant_rules(keyword);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id_period ON budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date);

-- ==========================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- exchange_rates: Solo lectura pública (todos pueden ver, nadie puede modificar desde cliente)
CREATE POLICY "exchange_rates_public_read" ON exchange_rates
    FOR SELECT USING (true);

-- categories: Cada usuario solo ve y gestiona sus propias categorías
CREATE POLICY "categories_user_select" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_user_insert" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_user_update" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "categories_user_delete" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- merchant_rules: Cada usuario solo ve y gestiona sus propias reglas
CREATE POLICY "merchant_rules_user_select" ON merchant_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "merchant_rules_user_insert" ON merchant_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "merchant_rules_user_update" ON merchant_rules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "merchant_rules_user_delete" ON merchant_rules
    FOR DELETE USING (auth.uid() = user_id);

-- budgets: Cada usuario solo ve y gestiona sus propios presupuestos
CREATE POLICY "budgets_user_select" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_user_insert" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_user_update" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "budgets_user_delete" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- transactions: Cada usuario solo ve y gestiona sus propias transacciones
CREATE POLICY "transactions_user_select" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_user_insert" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_user_update" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "transactions_user_delete" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_rates_updated_at
    BEFORE UPDATE ON exchange_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
