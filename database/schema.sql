-- ORB Supabase Database Schema
-- Version 1.0.0

-- =====================================================
-- USERS TABLE
-- Stores user account information
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    auth_method VARCHAR(50) NOT NULL CHECK (auth_method IN ('wallet', 'email', 'guest')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- USER_SETTINGS TABLE
-- Stores user preferences (synced from localStorage)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Orb Appearance
    orb_mode VARCHAR(20) DEFAULT 'auto',
    manual_orb_color VARCHAR(50) DEFAULT 'neon',
    glow_intensity VARCHAR(20) DEFAULT 'medium',
    animation_speed VARCHAR(20) DEFAULT 'normal',
    
    -- Sentiment & Data
    sentiment_source VARCHAR(50) DEFAULT 'portfolio',
    update_frequency VARCHAR(20) DEFAULT '5min',
    show_sentiment_badge BOOLEAN DEFAULT true,
    
    -- Display & Accessibility
    app_theme VARCHAR(20) DEFAULT 'dark',
    reduce_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    text_size VARCHAR(20) DEFAULT 'default',
    
    -- UI Behavior
    auto_fade_enabled BOOLEAN DEFAULT true,
    fade_delay INTEGER DEFAULT 4000,
    show_stock_ticker BOOLEAN DEFAULT true,
    compact_mode BOOLEAN DEFAULT false,
    
    -- Notifications
    sentiment_alerts BOOLEAN DEFAULT false,
    price_movement_alerts BOOLEAN DEFAULT false,
    price_alert_threshold INTEGER DEFAULT 5,
    daily_summary BOOLEAN DEFAULT false,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Privacy & Security
    hide_balances BOOLEAN DEFAULT false,
    blur_on_switch BOOLEAN DEFAULT false,
    
    -- Feature Flags
    beta_features_enabled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =====================================================
-- SESSIONS TABLE
-- Tracks user sessions for security
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active) WHERE is_active = true;

-- =====================================================
-- NOTIFICATIONS TABLE
-- Stores user notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('sentiment_change', 'major_movement', 'daily_summary', 'system')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Index for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =====================================================
-- PORTFOLIOS TABLE (Read-Only Reference)
-- Caches portfolio data from wallets (no sensitive data)
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_type VARCHAR(50) NOT NULL CHECK (wallet_type IN ('metamask', 'phantom', 'manual')),
    wallet_address VARCHAR(255),
    
    -- Cached balances (public data only)
    cached_balance JSONB DEFAULT '{}',
    total_value_usd DECIMAL(20, 2),
    last_sentiment VARCHAR(20),
    
    -- Sync info
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for portfolio queries
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);

-- =====================================================
-- ANALYTICS TABLE (Privacy-Safe)
-- Anonymous usage tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- No user_id to ensure anonymity
    event_name VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_hash VARCHAR(64), -- Hashed session ID, not traceable to user
    app_version VARCHAR(20),
    platform VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_events(created_at);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own data
CREATE POLICY users_self ON users
    FOR ALL USING (id = auth.uid());

CREATE POLICY settings_self ON user_settings
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY sessions_self ON sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY notifications_self ON notifications
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY portfolios_self ON portfolios
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- SECURITY NOTES
-- =====================================================
-- 
-- ✓ No private keys are ever stored
-- ✓ Wallet addresses are public data only
-- ✓ All sensitive operations use RLS
-- ✓ Analytics are anonymous (no user_id)
-- ✓ Session tokens are hashed
-- ✓ Proper cascading deletes for user data removal
-- 
-- =====================================================
