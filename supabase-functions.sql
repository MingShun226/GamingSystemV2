-- Supabase Database Functions for Referral System
-- Run these in your Supabase SQL Editor

-- 1. Function to add points to a user
CREATE OR REPLACE FUNCTION add_user_points(user_id_input UUID, points_to_add INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update user points
    UPDATE wager_wave_users 
    SET points = points + points_to_add
    WHERE id = user_id_input;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    RETURN json_build_object('success', true, 'points_added', points_to_add);
END;
$$;

-- 2. Function to upsert referral record (create or update)
CREATE OR REPLACE FUNCTION upsert_referral_record(
    referrer_id_input UUID,
    referred_user_id_input UUID,
    referred_username_input TEXT,
    commission_amount_input INTEGER,
    topup_amount_input INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_record_id UUID;
BEGIN
    -- Check if referral record already exists
    SELECT id INTO existing_record_id
    FROM referral_records
    WHERE referrer_id = referrer_id_input 
      AND referred_user_id = referred_user_id_input;
    
    IF existing_record_id IS NOT NULL THEN
        -- Update existing record
        UPDATE referral_records
        SET 
            total_commission_earned = total_commission_earned + commission_amount_input,
            last_topup_amount = COALESCE(topup_amount_input, last_topup_amount),
            last_topup_date = CASE 
                WHEN topup_amount_input IS NOT NULL THEN NOW()
                ELSE last_topup_date
            END
        WHERE id = existing_record_id;
    ELSE
        -- Create new record
        INSERT INTO referral_records (
            referrer_id,
            referred_user_id,
            referred_username,
            registration_date,
            total_commission_earned,
            last_topup_amount,
            last_topup_date
        ) VALUES (
            referrer_id_input,
            referred_user_id_input,
            referred_username_input,
            NOW(),
            commission_amount_input,
            topup_amount_input,
            CASE WHEN topup_amount_input IS NOT NULL THEN NOW() ELSE NULL END
        );
    END IF;
    
    RETURN json_build_object('success', true, 'commission_added', commission_amount_input);
END;
$$;

-- 3. Function to update referral record with top-up commission
CREATE OR REPLACE FUNCTION update_referral_topup_commission(
    referrer_id_input UUID,
    referred_user_id_input UUID,
    commission_amount_input INTEGER,
    topup_amount_input INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update existing referral record with top-up commission
    UPDATE referral_records
    SET 
        total_commission_earned = total_commission_earned + commission_amount_input,
        last_topup_amount = topup_amount_input,
        last_topup_date = NOW()
    WHERE referrer_id = referrer_id_input 
      AND referred_user_id = referred_user_id_input;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Referral record not found');
    END IF;
    
    RETURN json_build_object('success', true, 'commission_added', commission_amount_input);
END;
$$;

-- 4. Enhanced register_wager_user function with referral handling
CREATE OR REPLACE FUNCTION register_wager_user(
    username_input TEXT,
    password_input TEXT,
    phone_input TEXT DEFAULT NULL,
    referral_code_input TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    username TEXT,
    phone TEXT,
    referral_code TEXT,
    points INTEGER,
    is_active BOOLEAN,
    login_count INTEGER,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    user_referral_code TEXT;
    referrer_user_id UUID;
    referrer_username TEXT;
BEGIN
    -- Check if username already exists
    IF EXISTS (SELECT 1 FROM wager_wave_users WHERE username = username_input) THEN
        RAISE EXCEPTION 'Username already exists';
    END IF;
    
    -- Hash the password
    INSERT INTO wager_wave_users (
        username, 
        password_hash, 
        phone, 
        is_active, 
        login_count,
        points
    )
    VALUES (
        username_input,
        crypt(password_input, gen_salt('bf', 6)),
        phone_input,
        true,
        0,
        0
    )
    RETURNING wager_wave_users.id INTO new_user_id;
    
    -- Generate referral code
    user_referral_code := 'REF' || UPPER(username_input) || RIGHT(REPLACE(new_user_id::text, '-', ''), 4);
    
    -- Update user with referral code
    UPDATE wager_wave_users 
    SET referral_code = user_referral_code
    WHERE wager_wave_users.id = new_user_id;
    
    -- Handle referral code if provided
    IF referral_code_input IS NOT NULL AND referral_code_input != '' THEN
        -- Find the referrer
        SELECT wager_wave_users.id, wager_wave_users.username INTO referrer_user_id, referrer_username
        FROM wager_wave_users 
        WHERE wager_wave_users.referral_code = referral_code_input;
        
        IF referrer_user_id IS NOT NULL THEN
            -- Update new user with referrer info
            UPDATE wager_wave_users
            SET referred_by = referrer_user_id
            WHERE wager_wave_users.id = new_user_id;
            
            -- Award +50 points to referrer
            UPDATE wager_wave_users 
            SET points = points + 50
            WHERE wager_wave_users.id = referrer_user_id;
            
            -- Create referral record
            INSERT INTO referral_records (
                referrer_id,
                referred_user_id,
                referred_username,
                registration_date,
                total_commission_earned
            ) VALUES (
                referrer_user_id,
                new_user_id,
                username_input,
                NOW(),
                50
            );
        END IF;
    END IF;
    
    -- Return the new user data
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.phone,
        u.referral_code,
        u.points,
        u.is_active,
        u.login_count,
        u.created_at
    FROM wager_wave_users u
    WHERE u.id = new_user_id;
END;
$$;

-- 5. Function to process top-up with referral commission
CREATE OR REPLACE FUNCTION process_topup(
    user_id_input UUID,
    amount_input INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    referrer_user_id UUID;
    commission_amount INTEGER;
    username TEXT;
BEGIN
    -- Get user info
    SELECT wager_wave_users.username, wager_wave_users.referred_by 
    INTO username, referrer_user_id
    FROM wager_wave_users 
    WHERE id = user_id_input;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Add points to user
    UPDATE wager_wave_users 
    SET points = points + amount_input
    WHERE id = user_id_input;
    
    -- Create top-up record
    INSERT INTO topup_records (user_id, amount, created_at)
    VALUES (user_id_input, amount_input, NOW());
    
    -- Process referral commission if user was referred
    IF referrer_user_id IS NOT NULL THEN
        commission_amount := FLOOR(amount_input * 0.1); -- 10% commission
        
        -- Add commission to referrer
        UPDATE wager_wave_users 
        SET points = points + commission_amount
        WHERE id = referrer_user_id;
        
        -- Update referral record with top-up commission
        UPDATE referral_records
        SET 
            total_commission_earned = total_commission_earned + commission_amount,
            last_topup_amount = amount_input,
            last_topup_date = NOW()
        WHERE referrer_id = referrer_user_id 
          AND referred_user_id = user_id_input;
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'amount_added', amount_input,
        'commission_paid', COALESCE(commission_amount, 0),
        'referrer_rewarded', referrer_user_id IS NOT NULL
    );
END;
$$;