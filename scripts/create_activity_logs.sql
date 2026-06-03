-- SQL migration to create the customer_activity_logs table for visitor tracking.
-- Copy and run this in your Supabase Dashboard SQL Editor:

CREATE TABLE IF NOT EXISTS customer_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'page_view', 'login', 'add_to_cart', 'search', 'checkout_start', 'purchase'
    page_url TEXT NOT NULL,
    page_title TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexing for lightning fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_device ON customer_activity_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON customer_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON customer_activity_logs(created_at DESC);
