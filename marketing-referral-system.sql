-- MARKETING REFERRAL TRACKING SYSTEM
-- Tracks promotional codes and marketing sources without affecting existing user referrals

-- 1. Create promotional_codes table to store marketing referral codes
CREATE TABLE IF NOT EXISTS public.promotional_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    marketing_source VARCHAR(100) NOT NULL, -- e.g., 'IG Advertisement', 'Facebook Ad', 'Google Ads'
    campaign_name VARCHAR(100), -- e.g., 'Summer Promo 2024', 'New Year Campaign'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    max_usage INTEGER, -- NULL = unlimited usage
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = never expires
    bonus_credits INTEGER DEFAULT 0, -- Optional bonus credits for using this promo code
    created_by UUID, -- Admin who created this code
    CONSTRAINT promotional_codes_pkey PRIMARY KEY (id)
);

-- 2. Create marketing_registrations table to track user registrations from promotional codes
CREATE TABLE IF NOT EXISTS public.marketing_registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    promotional_code_id UUID NOT NULL,
    promo_code VARCHAR(50) NOT NULL,
    marketing_source VARCHAR(100) NOT NULL,
    campaign_name VARCHAR(100),
    bonus_credits_awarded INTEGER DEFAULT 0,
    registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET, -- Optional: track IP for analytics
    user_agent TEXT, -- Optional: track browser/device
    CONSTRAINT marketing_registrations_pkey PRIMARY KEY (id),
    CONSTRAINT marketing_registrations_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES wager_wave_users(id) ON DELETE CASCADE,
    CONSTRAINT marketing_registrations_promotional_code_id_fkey FOREIGN KEY (promotional_code_id) 
        REFERENCES promotional_codes(id) ON DELETE CASCADE
);

-- 3. Add marketing_source column to wager_wave_users table (optional, for quick reference)
ALTER TABLE public.wager_wave_users 
ADD COLUMN IF NOT EXISTS marketing_source VARCHAR(100);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotional_codes_code ON public.promotional_codes(code);
CREATE INDEX IF NOT EXISTS idx_promotional_codes_active ON public.promotional_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promotional_codes_source ON public.promotional_codes(marketing_source);
CREATE INDEX IF NOT EXISTS idx_marketing_registrations_user_id ON public.marketing_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_registrations_promo_code ON public.marketing_registrations(promo_code);
CREATE INDEX IF NOT EXISTS idx_marketing_registrations_source ON public.marketing_registrations(marketing_source);
CREATE INDEX IF NOT EXISTS idx_marketing_registrations_date ON public.marketing_registrations(registration_date);
CREATE INDEX IF NOT EXISTS idx_wager_wave_users_marketing_source ON public.wager_wave_users(marketing_source);

-- 5. Insert some default promotional codes
INSERT INTO public.promotional_codes (code, marketing_source, campaign_name, description, bonus_credits, is_active)
VALUES 
    ('PROMOTION123', 'IG Advertisement', 'Instagram Campaign 2024', 'Instagram promotion code for new users', 100, true),
    ('FBADS2024', 'Facebook Ad', 'Facebook Campaign 2024', 'Facebook advertisement promotion', 150, true),
    ('GOOGLE50', 'Google Ads', 'Google Search Campaign', 'Google Ads promotion code', 75, true),
    ('TIKTOK100', 'TikTok Ad', 'TikTok Campaign 2024', 'TikTok advertisement promotion', 200, true),
    ('YOUTUBE25', 'YouTube Ad', 'YouTube Campaign', 'YouTube advertisement promotion', 50, true),
    ('TWITTER2024', 'Twitter Ad', 'Twitter Promotion', 'Twitter advertisement campaign', 125, true),
    ('INFLUENCER', 'Influencer Marketing', 'Influencer Collaboration', 'Code shared by influencers', 300, true),
    ('WELCOME2024', 'Direct Marketing', 'Welcome Campaign', 'General welcome promotion', 100, true)
ON CONFLICT (code) DO NOTHING;

-- 6. Function to validate promotional code
CREATE OR REPLACE FUNCTION public.validate_promotional_code(promo_code_input VARCHAR(50))
RETURNS TABLE(
    is_valid BOOLEAN,
    promotional_code_id UUID,
    marketing_source VARCHAR(100),
    campaign_name VARCHAR(100),
    bonus_credits INTEGER,
    error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    promo_record RECORD;
BEGIN
    -- Check if promotional code is provided
    IF promo_code_input IS NULL OR promo_code_input = '' THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(100), NULL::VARCHAR(100), 0, 'No promotional code provided'::TEXT;
        RETURN;
    END IF;
    
    -- Find promotional code
    SELECT 
        promo.id, 
        promo.marketing_source, 
        promo.campaign_name, 
        promo.bonus_credits,
        promo.is_active,
        promo.expires_at,
        promo.max_usage,
        promo.usage_count
    INTO promo_record
    FROM public.promotional_codes promo
    WHERE promo.code = UPPER(TRIM(promo_code_input));
    
    -- Check if promotional code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(100), NULL::VARCHAR(100), 0, 'Invalid promotional code'::TEXT;
        RETURN;
    END IF;
    
    -- Check if code is active
    IF NOT promo_record.is_active THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(100), NULL::VARCHAR(100), 0, 'Promotional code is no longer active'::TEXT;
        RETURN;
    END IF;
    
    -- Check if code has expired
    IF promo_record.expires_at IS NOT NULL AND promo_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(100), NULL::VARCHAR(100), 0, 'Promotional code has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF promo_record.max_usage IS NOT NULL AND promo_record.usage_count >= promo_record.max_usage THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR(100), NULL::VARCHAR(100), 0, 'Promotional code usage limit reached'::TEXT;
        RETURN;
    END IF;
    
    -- Code is valid
    RETURN QUERY SELECT 
        TRUE, 
        promo_record.id, 
        promo_record.marketing_source, 
        promo_record.campaign_name, 
        COALESCE(promo_record.bonus_credits, 0),
        'Valid promotional code'::TEXT;
END;
$$;

-- 7. Function to record marketing registration
CREATE OR REPLACE FUNCTION public.record_marketing_registration(
    user_id_input UUID,
    promo_code_input VARCHAR(50),
    ip_address_input INET DEFAULT NULL,
    user_agent_input TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    bonus_credits INTEGER,
    marketing_source VARCHAR(100),
    message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    promo_validation RECORD;
    bonus_awarded INTEGER := 0;
BEGIN
    -- Validate promotional code first
    SELECT * INTO promo_validation
    FROM public.validate_promotional_code(promo_code_input);
    
    -- Check if validation failed
    IF NOT promo_validation.is_valid THEN
        RETURN QUERY SELECT FALSE, 0, NULL::VARCHAR(100), promo_validation.error_message;
        RETURN;
    END IF;
    
    -- Check if user already used a promotional code (prevent duplicate marketing registrations)
    IF EXISTS (
        SELECT 1 FROM public.marketing_registrations existing_reg
        WHERE existing_reg.user_id = user_id_input
    ) THEN
        RETURN QUERY SELECT FALSE, 0, NULL::VARCHAR(100), 'User has already used a promotional code'::TEXT;
        RETURN;
    END IF;
    
    -- Record marketing registration
    INSERT INTO public.marketing_registrations (
        user_id,
        promotional_code_id,
        promo_code,
        marketing_source,
        campaign_name,
        bonus_credits_awarded,
        ip_address,
        user_agent
    ) VALUES (
        user_id_input,
        promo_validation.promotional_code_id,
        UPPER(TRIM(promo_code_input)),
        promo_validation.marketing_source,
        promo_validation.campaign_name,
        promo_validation.bonus_credits,
        ip_address_input,
        user_agent_input
    );
    
    -- Update promotional code usage count
    UPDATE public.promotional_codes
    SET usage_count = usage_count + 1
    WHERE id = promo_validation.promotional_code_id;
    
    -- Update user's marketing source
    UPDATE public.wager_wave_users
    SET marketing_source = promo_validation.marketing_source
    WHERE id = user_id_input;
    
    -- Award bonus credits if any
    IF promo_validation.bonus_credits > 0 THEN
        UPDATE public.wager_wave_users
        SET points = COALESCE(points, 0) + promo_validation.bonus_credits
        WHERE id = user_id_input;
        
        bonus_awarded := promo_validation.bonus_credits;
    END IF;
    
    RETURN QUERY SELECT 
        TRUE, 
        bonus_awarded, 
        promo_validation.marketing_source,
        format('Successfully registered with %s promotional code. Bonus: %s credits', 
               promo_validation.marketing_source, bonus_awarded);
END;
$$;

-- 8. Enhanced register_wager_user function that handles promotional codes
CREATE OR REPLACE FUNCTION public.register_wager_user_with_promo(
    username_input TEXT, 
    password_input TEXT, 
    phone_input TEXT, 
    referred_by_id UUID DEFAULT NULL,
    promotional_code_input VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    username TEXT,
    phone TEXT,
    password_hash TEXT,
    is_active BOOLEAN,
    login_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    points INTEGER,
    is_vip BOOLEAN,
    rank VARCHAR(50),
    referred_by UUID,
    status VARCHAR(20),
    referral_code VARCHAR(20),
    last_activity TIMESTAMP WITH TIME ZONE,
    marketing_source VARCHAR(100),
    promo_bonus_credits INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id UUID;
    user_referral_code TEXT;
    referrer_username TEXT;
    registration_bonus INTEGER := 50;
    promo_bonus INTEGER := 0;
    marketing_src VARCHAR(100) := NULL;
    marketing_result RECORD;
BEGIN
    -- Check if username already exists
    IF EXISTS (
        SELECT 1 FROM wager_wave_users existing_user
        WHERE existing_user.username = username_input
    ) THEN
        RAISE EXCEPTION 'Username already exists';
    END IF;

    -- Check if phone already exists
    IF phone_input IS NOT NULL AND EXISTS (
        SELECT 1 FROM wager_wave_users existing_phone
        WHERE existing_phone.phone = phone_input
    ) THEN
        RAISE EXCEPTION 'Phone number already registered';
    END IF;

    -- Hash the password and create user
    INSERT INTO wager_wave_users (
        username,
        password_hash,
        phone,
        is_active,
        login_count,
        points,
        is_vip,
        rank,
        status,
        referred_by
    )
    VALUES (
        username_input,
        crypt(password_input, gen_salt('bf', 6)),
        phone_input,
        true,
        0,
        0,
        false,
        'Bronze',
        'active',
        referred_by_id
    )
    RETURNING wager_wave_users.id INTO new_user_id;

    -- Generate referral code
    user_referral_code := 'REF' || UPPER(LEFT(username_input, 6)) || RIGHT(REPLACE(new_user_id::text, '-', ''), 4);

    -- Update user with referral code
    UPDATE wager_wave_users 
    SET referral_code = user_referral_code,
        updated_at = NOW()
    WHERE id = new_user_id;

    -- Handle regular user referral bonus (existing functionality)
    IF referred_by_id IS NOT NULL THEN
        SELECT referrer.username INTO referrer_username
        FROM wager_wave_users referrer
        WHERE referrer.id = referred_by_id AND referrer.is_active = true;

        IF referrer_username IS NOT NULL THEN
            UPDATE wager_wave_users 
            SET points = COALESCE(points, 0) + registration_bonus,
                last_activity = NOW(),
                updated_at = NOW()
            WHERE id = referred_by_id;

            INSERT INTO referral_records (
                referrer_id,
                referred_user_id,
                referred_username,
                registration_date,
                total_commission_earned
            ) VALUES (
                referred_by_id,
                new_user_id,
                username_input,
                NOW(),
                registration_bonus
            );
        END IF;
    END IF;

    -- Handle promotional code (NEW FUNCTIONALITY)
    IF promotional_code_input IS NOT NULL AND promotional_code_input != '' THEN
        SELECT * INTO marketing_result
        FROM public.record_marketing_registration(new_user_id, promotional_code_input);
        
        IF marketing_result.success THEN
            promo_bonus := marketing_result.bonus_credits;
            marketing_src := marketing_result.marketing_source;
        END IF;
    END IF;

    -- Return the complete new user data
    RETURN QUERY
    SELECT
        result_user.id,
        result_user.username,
        result_user.phone,
        result_user.password_hash,
        result_user.is_active,
        result_user.login_count,
        result_user.created_at,
        result_user.updated_at,
        result_user.last_login,
        result_user.points,
        result_user.is_vip,
        result_user.rank,
        result_user.referred_by,
        result_user.status,
        result_user.referral_code,
        result_user.last_activity,
        result_user.marketing_source,
        promo_bonus
    FROM wager_wave_users result_user
    WHERE result_user.id = new_user_id;

EXCEPTION
    WHEN unique_violation THEN
        IF SQLERRM LIKE '%username%' THEN
            RAISE EXCEPTION 'Username already exists';
        ELSIF SQLERRM LIKE '%phone%' THEN
            RAISE EXCEPTION 'Phone number already registered';
        ELSE
            RAISE EXCEPTION 'Registration failed: duplicate data';
        END IF;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Registration failed: %', SQLERRM;
END;
$$;

-- 9. Admin function to get marketing analytics
CREATE OR REPLACE FUNCTION public.get_marketing_analytics()
RETURNS TABLE(
    marketing_source VARCHAR(100),
    campaign_name VARCHAR(100),
    total_registrations BIGINT,
    total_bonus_awarded BIGINT,
    avg_bonus_per_user NUMERIC,
    registration_trend_7days BIGINT,
    most_recent_registration TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.marketing_source,
        mr.campaign_name,
        COUNT(*) as total_registrations,
        SUM(mr.bonus_credits_awarded) as total_bonus_awarded,
        ROUND(AVG(mr.bonus_credits_awarded), 2) as avg_bonus_per_user,
        COUNT(CASE WHEN mr.registration_date >= NOW() - INTERVAL '7 days' THEN 1 END) as registration_trend_7days,
        MAX(mr.registration_date) as most_recent_registration
    FROM public.marketing_registrations mr
    GROUP BY mr.marketing_source, mr.campaign_name
    ORDER BY total_registrations DESC;
END;
$$;

-- 10. Admin function to get users by marketing source
CREATE OR REPLACE FUNCTION public.get_users_by_marketing_source(source_filter VARCHAR(100) DEFAULT NULL)
RETURNS TABLE(
    user_id UUID,
    username TEXT,
    phone TEXT,
    marketing_source VARCHAR(100),
    promo_code VARCHAR(50),
    campaign_name VARCHAR(100),
    bonus_credits_awarded INTEGER,
    current_points INTEGER,
    registration_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.username,
        u.phone,
        mr.marketing_source,
        mr.promo_code,
        mr.campaign_name,
        mr.bonus_credits_awarded,
        u.points as current_points,
        mr.registration_date,
        u.is_active
    FROM public.wager_wave_users u
    JOIN public.marketing_registrations mr ON u.id = mr.user_id
    WHERE (source_filter IS NULL OR mr.marketing_source = source_filter)
    ORDER BY mr.registration_date DESC;
END;
$$;