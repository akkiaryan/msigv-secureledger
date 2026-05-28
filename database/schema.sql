-- MSIGV SecureLedger - PostgreSQL Schema Definition
-- Optimized for Neon.tech PostgreSQL

-- 1. ENUMS & CUSTOM TYPES
CREATE TYPE role_type AS ENUM ('admin', 'manager', 'staff', 'accountant', 'auditor');
CREATE TYPE load_pattern AS ENUM ('domestic_only', 'mixed_commercial', 'custom');
CREATE TYPE cylinder_category AS ENUM ('domestic_14_2', 'commercial_19');
CREATE TYPE payment_mode_type AS ENUM ('cash', 'upi', 'credit', 'bank_transfer');
CREATE TYPE connection_category AS ENUM ('single_bottle', 'double_bottle');
CREATE TYPE incident_type AS ENUM ('leakage', 'damage', 'valve_defect', 'weight_issue', 'seal_broken');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE audit_action AS ENUM ('insert', 'update_request', 'adjustment', 'daily_closing', 'security_alert');

-- 2. USERS (Authentication and Roles)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role role_type NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. EMPLOYEES (Staff Ledger & Accountability Mapping)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'loader', 'driver', 'delivery_man', 'supervisor'
    mobile VARCHAR(15) UNIQUE,
    daily_wage NUMERIC(10, 2) DEFAULT 0.00 CHECK (daily_wage >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    consumer_number VARCHAR(30) UNIQUE, -- Domestic Indane Consumer ID
    mobile VARCHAR(15),
    address TEXT,
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('domestic', 'commercial', 'institutional', 'industrial')),
    credit_allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. NEW CONNECTIONS LEDGER (SBC / DBC with dynamic pricing parts)
CREATE TABLE IF NOT EXISTS customer_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    connection_type connection_category NOT NULL,
    stove_included BOOLEAN DEFAULT FALSE,
    cylinder_security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    regulator_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    hose_pipe_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stove_charge NUMERIC(10, 2) DEFAULT 0.00, -- ₹1200 - ₹1500 if included
    installation_charge NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_pending NUMERIC(10, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    issued_cylinders_count INTEGER CHECK (issued_cylinders_count IN (1, 2)),
    staff_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    connection_date DATE NOT NULL,
    remarks TEXT
);

-- 6. LOADS (Incoming trucks from Indane Refinery)
CREATE TABLE IF NOT EXISTS loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_number VARCHAR(50) UNIQUE NOT NULL,
    arrival_date DATE NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    pattern load_pattern NOT NULL,
    total_cylinders INTEGER NOT NULL CHECK (total_cylinders > 0),
    unloading_payment NUMERIC(10, 2) DEFAULT 0.00 CHECK (unloading_payment >= 0), -- Paid to loading/unloading staff
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS load_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
    cylinder_type cylinder_category NOT NULL,
    filled_received INTEGER NOT NULL DEFAULT 0 CHECK (filled_received >= 0),
    empty_returned INTEGER NOT NULL DEFAULT 0 CHECK (empty_returned >= 0),
    damaged_detected INTEGER NOT NULL DEFAULT 0 CHECK (damaged_detected >= 0),
    leakage_detected INTEGER NOT NULL DEFAULT 0 CHECK (leakage_detected >= 0)
);

-- 7. INVENTORY CONTROL
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cylinder_type cylinder_category UNIQUE NOT NULL,
    filled_stock INTEGER NOT NULL DEFAULT 0 CHECK (filled_stock >= 0),
    empty_stock INTEGER NOT NULL DEFAULT 0 CHECK (empty_stock >= 0),
    damaged_stock INTEGER NOT NULL DEFAULT 0 CHECK (damaged_stock >= 0),
    leakage_stock INTEGER NOT NULL DEFAULT 0 CHECK (leakage_stock >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'LOAD_RECEIVED', 'DELIVERY', 'EMPTY_RETURN', 'DAMAGE_REPORT', 'CLOSING_ADJUSTMENT'
    reference_id UUID,
    cylinder_type cylinder_category NOT NULL,
    filled_change INTEGER NOT NULL DEFAULT 0,
    empty_change INTEGER NOT NULL DEFAULT 0,
    damaged_change INTEGER NOT NULL DEFAULT 0,
    leakage_change INTEGER NOT NULL DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. DELIVERIES (Daily Cylinder Dispatch)
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_date DATE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('paid', 'partial', 'pending_credit')),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    amount_received NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount_received >= 0),
    amount_pending NUMERIC(10, 2) GENERATED ALWAYS AS (total_amount - amount_received) STORED,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    cylinder_type cylinder_category NOT NULL,
    quantity_delivered INTEGER NOT NULL CHECK (quantity_delivered > 0),
    empty_returned INTEGER NOT NULL DEFAULT 0 CHECK (empty_returned >= 0),
    dac_code VARCHAR(10), -- Delivery Authentication Code
    dac_verified BOOLEAN DEFAULT FALSE,
    rate_per_cylinder NUMERIC(10, 2) NOT NULL CHECK (rate_per_cylinder >= 0),
    line_total NUMERIC(10, 2) GENERATED ALWAYS AS (quantity_delivered * rate_per_cylinder) STORED
);

-- 9. COMMERCIAL ROLLOVER LEDGER (19 kg Cylinders & outstanding balances)
CREATE TABLE IF NOT EXISTS commercial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
    cylinder_type cylinder_category NOT NULL,
    quantity_delivered INTEGER NOT NULL,
    empty_returned INTEGER NOT NULL DEFAULT 0,
    empty_pending INTEGER GENERATED ALWAYS AS (quantity_delivered - empty_returned) STORED,
    amount_billed NUMERIC(10, 2) NOT NULL,
    amount_received NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_pending NUMERIC(10, 2) GENERATED ALWAYS AS (amount_billed - amount_received) STORED,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('clear', 'partially_clear', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. DAILY CLOSING RECONCILIATION COUNTS (Anti-Theft core)
CREATE TABLE IF NOT EXISTS daily_closing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_date DATE UNIQUE NOT NULL,
    supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Physical counts of 14.2 kg cylinders
    physical_14_filled INTEGER NOT NULL CHECK (physical_14_filled >= 0),
    physical_14_empty INTEGER NOT NULL CHECK (physical_14_empty >= 0),
    
    -- Physical counts of 19 kg cylinders
    physical_19_filled INTEGER NOT NULL CHECK (physical_19_filled >= 0),
    physical_19_empty INTEGER NOT NULL CHECK (physical_19_empty >= 0),
    
    physical_damaged INTEGER NOT NULL DEFAULT 0 CHECK (physical_damaged >= 0),
    physical_leakage INTEGER NOT NULL DEFAULT 0 CHECK (physical_leakage >= 0),
    
    -- Calculated Expected counts (filled + empty) from system state
    expected_14_filled INTEGER NOT NULL,
    expected_14_empty INTEGER NOT NULL,
    expected_19_filled INTEGER NOT NULL,
    expected_19_empty INTEGER NOT NULL,
    
    -- Calculated Mismatches (Physical - Expected)
    mismatch_14_filled INTEGER GENERATED ALWAYS AS (physical_14_filled - expected_14_filled) STORED,
    mismatch_14_empty INTEGER GENERATED ALWAYS AS (physical_14_empty - expected_14_empty) STORED,
    mismatch_19_filled INTEGER GENERATED ALWAYS AS (physical_19_filled - expected_19_filled) STORED,
    mismatch_19_empty INTEGER GENERATED ALWAYS AS (physical_19_empty - expected_19_empty) STORED,
    
    cash_in_hand NUMERIC(10, 2) NOT NULL CHECK (cash_in_hand >= 0),
    is_locked BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. CYLINDER INCIDENTS (Leakage/Damage tracking & reporting)
CREATE TABLE IF NOT EXISTS cylinder_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_date DATE NOT NULL,
    cylinder_type cylinder_category NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    incident_type incident_type NOT NULL,
    severity severity_level NOT NULL,
    location VARCHAR(100) NOT NULL, -- e.g., 'godown', 'vehicle_BR01A1234', 'customer_100234'
    detected_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'reported_to_iocl')),
    action_taken TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. FINANCIAL LEDGER (Expenses & Payouts)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'labor_wage', 'diesel', 'godown_maintenance', 'office_supplies'
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    paid_to VARCHAR(100) NOT NULL,
    payment_mode payment_mode_type NOT NULL,
    reference_id UUID, -- e.g., loads.id or cylinder_incidents.id if applicable
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. AUDIT LOGS (Immutable Activity Log)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    old_state JSONB,
    new_state JSONB,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. DEFAULT SEED DATA
-- Seed opening stock for cylinders (550 empties, godown capacity 6000 kg)
INSERT INTO inventory (cylinder_type, filled_stock, empty_stock, damaged_stock, leakage_stock)
VALUES 
('domestic_14_2', 0, 550, 0, 0),
('commercial_19', 0, 0, 0, 0)
ON CONFLICT (cylinder_type) DO NOTHING;
