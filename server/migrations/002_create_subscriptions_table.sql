-- Migration 002: Create subscriptions table and update users table
-- Purpose: Manage user subscriptions with different plan durations

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('1_month', '6_months', '1_year')),
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- Add subscription-related columns to users table if they don't exist
DO $$ 
BEGIN 
    -- Add subscription_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_id'
    ) THEN 
        ALTER TABLE users ADD COLUMN subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL;
    END IF;

    -- Add subscription_expires_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_expires_at'
    ) THEN 
        ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP;
    END IF;

    -- Add premium_balance column (credits for AI usage in USD)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'premium_balance'
    ) THEN 
        ALTER TABLE users ADD COLUMN premium_balance DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- Create trigger for updating subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing Premium users to have initial balance
UPDATE users 
SET premium_balance = 4.00 
WHERE account_type = 'Premium' AND premium_balance = 0.00;

-- Create a subscription for the admin user (1 year)
DO $$
DECLARE
    admin_user_id INTEGER;
    admin_sub_id INTEGER;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@d4builds.com' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Check if admin already has an active subscription
        IF NOT EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE user_id = admin_user_id AND is_active = true
        ) THEN
            -- Create subscription for admin (1 year from now)
            INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, is_active)
            VALUES (
                admin_user_id,
                '1_year',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP + INTERVAL '1 year',
                true
            )
            RETURNING id INTO admin_sub_id;
            
            -- Update admin user with subscription info
            UPDATE users 
            SET 
                subscription_id = admin_sub_id,
                subscription_expires_at = CURRENT_TIMESTAMP + INTERVAL '1 year',
                premium_balance = 100.00  -- Admin gets $100 credit
            WHERE id = admin_user_id;
        END IF;
    END IF;
END $$;
