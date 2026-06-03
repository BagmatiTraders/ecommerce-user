-- SQL migration to add marketing attribution & click tracking columns to the ecommerce_orders table.
-- Run this in your Supabase Dashboard SQL Editor:

ALTER TABLE ecommerce_orders 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS fbclid TEXT,
ADD COLUMN IF NOT EXISTS fbp_cookie TEXT,
ADD COLUMN IF NOT EXISTS fbc_cookie TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;
