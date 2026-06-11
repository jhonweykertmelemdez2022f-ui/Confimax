-- Migration: Create suppliers, supplier_products and purchases tables
-- Run this against the Confimax PostgreSQL database used by services

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY,
  company_name TEXT NOT NULL,
  description TEXT,
  sells TEXT,
  contact_name TEXT,
  contact_id TEXT,
  phone TEXT,
  rif TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_products (
  id uuid PRIMARY KEY,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  total NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  due_date DATE,
  paid BOOLEAN DEFAULT false,
  created_by uuid,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers (company_name);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_due_date ON purchases (due_date);
