add_user_points function:
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

authenticate_admin function:

  DECLARE
    admin_record RECORD;
  BEGIN
    -- Find admin user by username with proper alias
    SELECT au.id, au.username, au.email, au.is_active, au.created_at, au.last_login, au.password_hash
    INTO admin_record
    FROM public.admin_users au
    WHERE au.username = username_input AND au.is_active = true;

    -- Check if admin exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid username or password';
    END IF;

    -- Verify password
    IF admin_record.password_hash != crypt(password_input, admin_record.password_hash) THEN
      RAISE EXCEPTION 'Invalid username or password';
    END IF;

    -- Update last login time
    UPDATE public.admin_users
    SET last_login = NOW()
    WHERE id = admin_record.id;

    -- Return admin data with explicit aliases
    RETURN QUERY
    SELECT
      admin_record.id AS admin_id,
      admin_record.username AS admin_username,
      admin_record.email AS admin_email,
      admin_record.is_active AS admin_is_active,
      admin_record.created_at AS admin_created_at,
      NOW() AS admin_last_login;
  END;

authenticate_user function:

BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.is_active, u.login_count
    FROM wager_wave_users u
    WHERE u.username = username_input 
    AND u.password_hash = crypt(password_input, u.password_hash)
    AND u.is_active = true;
    
    -- Update login count and last login if user found
    IF FOUND THEN
        UPDATE wager_wave_users 
        SET login_count = wager_wave_users.login_count + 1,
            last_login = NOW()
        WHERE wager_wave_users.username = username_input;
    END IF;
END;

authenticate_user_wager_wave function:

DECLARE
    user_record RECORD;
BEGIN
    -- Get user record
    SELECT u.id, u.username, u.phone, u.password_hash, u.is_active, u.login_count, u.created_at, u.last_login
    INTO user_record
    FROM wager_wave_users u
    WHERE u.username = username_input;
    
    -- Check if user exists and password is correct
    IF user_record.id IS NOT NULL AND user_record.password_hash = crypt(password_input, user_record.password_hash) THEN
        -- Update login count and last login time
        UPDATE wager_wave_users 
        SET login_count = login_count + 1,
            last_login = NOW(),
            updated_at = NOW()
        WHERE wager_wave_users.id = user_record.id;
        
        -- Return user data
        RETURN QUERY
        SELECT 
            user_record.id,
            user_record.username,
            user_record.phone,
            user_record.is_active,
            user_record.login_count + 1, -- Return updated count
            user_record.created_at,
            NOW() as last_login;
    END IF;
    
    -- Return empty if authentication failed
    RETURN;
END;

authenticate_wager_user function:

  DECLARE
      user_record RECORD;
  BEGIN
      -- Find user by username
      SELECT * INTO user_record
      FROM wager_wave_users
      WHERE username = username_input AND is_active = true;

      -- Check if user exists
      IF NOT FOUND THEN
          RAISE EXCEPTION 'Invalid username or password';
      END IF;

      -- Verify password
      IF user_record.password_hash != crypt(password_input, user_record.password_hash) THEN
          RAISE EXCEPTION 'Invalid username or password';
      END IF;

      -- Update login count and last login
      UPDATE wager_wave_users
      SET
          login_count = login_count + 1,
          last_login = NOW()
      WHERE id = user_record.id;

      -- Return user data
      RETURN QUERY
      SELECT
          user_record.id,
          user_record.username,
          user_record.phone,
          user_record.login_count + 1,
          user_record.is_active,
          user_record.created_at,
          NOW() as last_login,
          COALESCE(user_record.points, 0) as points,
          COALESCE(user_record.is_vip, false) as is_vip,
          COALESCE(user_record.rank, 'Bronze') as rank,
          user_record.referred_by,
          COALESCE(user_record.status, 'active') as status,
          'user' as role,
          user_record.referral_code;
  END;

award_free_credits:

DECLARE
    target_user_id UUID;
    target_username TEXT;
    old_points INTEGER;
    new_points INTEGER;
BEGIN
    -- Get user details
    SELECT u.id, u.username, COALESCE(u.points, 0)
    INTO target_user_id, target_username, old_points
    FROM wager_wave_users u
    WHERE u.phone = phone_input
    AND u.is_active = true;
    
    IF target_user_id IS NULL THEN
        RETURN QUERY SELECT 
            FALSE,
            NULL::INTEGER,
            'User not found'::TEXT,
            NULL::TEXT;
        RETURN;
    END IF;
    
    -- Check if already redeemed
    IF EXISTS(SELECT 1 FROM free_credits_redemptions WHERE phone = phone_input) THEN
        RETURN QUERY SELECT 
            FALSE,
            old_points,
            'Free credits already claimed for this phone number'::TEXT,
            target_username;
        RETURN;
    END IF;
    
    -- Award points
    new_points := old_points + credits_amount;
    
    UPDATE wager_wave_users 
    SET points = new_points,
        last_activity = NOW(),
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Record redemption
    INSERT INTO free_credits_redemptions (
        phone, 
        user_id, 
        credits_awarded, 
        redemption_type
    ) VALUES (
        phone_input,
        target_user_id,
        credits_amount,
        'welcome_bonus'
    );
    
    RETURN QUERY SELECT 
        TRUE,
        new_points,
        format('Successfully awarded %s credits! New balance: %s points', credits_amount, new_points),
        target_username;
        
EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT 
            FALSE,
            old_points,
            'Free credits already claimed for this phone number'::TEXT,
            target_username;
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            FALSE,
            old_points,
            format('Error awarding credits: %s', SQLERRM),
            target_username;
END;

check_free_credits_eligibility function:

DECLARE
    found_user_id UUID;
    found_username TEXT;
    found_points INTEGER;
    redemption_exists BOOLEAN;
BEGIN
    -- Check if user exists with this phone
    SELECT u.id, u.username, COALESCE(u.points, 0)
    INTO found_user_id, found_username, found_points
    FROM wager_wave_users u
    WHERE u.phone = phone_input
    AND u.is_active = true
    LIMIT 1;
    
    -- Check if phone already redeemed free credits
    SELECT EXISTS(
        SELECT 1 FROM free_credits_redemptions 
        WHERE phone = phone_input
    ) INTO redemption_exists;
    
    IF found_user_id IS NOT NULL THEN
        -- User exists
        IF redemption_exists THEN
            -- Already redeemed
            RETURN QUERY SELECT 
                TRUE,
                found_user_id,
                found_username,
                found_points,
                TRUE,
                'This phone number has already claimed free credits'::TEXT;
        ELSE
            -- Eligible for free credits
            RETURN QUERY SELECT 
                TRUE,
                found_user_id,
                found_username,
                found_points,
                FALSE,
                'Eligible for free credits'::TEXT;
        END IF;
    ELSE
        -- User doesn't exist
        IF redemption_exists THEN
            -- Phone redeemed but no user (edge case)
            RETURN QUERY SELECT 
                FALSE,
                NULL::UUID,
                NULL::TEXT,
                NULL::INTEGER,
                TRUE,
                'This phone number has already claimed free credits'::TEXT;
        ELSE
            -- New phone, no user
            RETURN QUERY SELECT 
                FALSE,
                NULL::UUID,
                NULL::TEXT,
                NULL::INTEGER,
                FALSE,
                'Please register first to claim free credits'::TEXT;
        END IF;
    END IF;
END;

check_username_exists function:

BEGIN
    RETURN EXISTS (
        SELECT 1 FROM wager_wave_users 
        WHERE username = username_to_check
    );
END;

create_admin_session function:

  DECLARE
    new_session_token VARCHAR(255);
    session_expires_at TIMESTAMP WITH TIME ZONE;
  BEGIN
    -- Generate unique session token
    new_session_token := encode(gen_random_bytes(32), 'hex');
    session_expires_at := NOW() + INTERVAL '24 hours';

    -- Clean up expired sessions for this admin with proper alias
    DELETE FROM public.admin_sessions
    WHERE admin_id = admin_id_input AND admin_sessions.expires_at < NOW();

    -- Insert new session
    INSERT INTO public.admin_sessions (admin_id, session_token, expires_at)
    VALUES (admin_id_input, new_session_token, session_expires_at);

    -- Return session data with explicit aliases
    RETURN QUERY
    SELECT
      new_session_token AS session_token,
      session_expires_at AS expires_at;
  END;

debug_referral_info function:

DECLARE
    user_info RECORD;
    referrer_info RECORD;
    referral_records_count INTEGER;
    total_commission INTEGER;
BEGIN
    -- Get user info
    SELECT id, username, referral_code, referred_by, points
    INTO user_info
    FROM wager_wave_users 
    WHERE username = username_input;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'User not found');
    END IF;
    
    -- Get referrer info if exists
    IF user_info.referred_by IS NOT NULL THEN
        SELECT username, referral_code, points
        INTO referrer_info
        FROM wager_wave_users 
        WHERE id = user_info.referred_by;
    END IF;
    
    -- Get referral records count and total commission for this user as referrer
    SELECT COUNT(*), COALESCE(SUM(total_commission_earned), 0)
    INTO referral_records_count, total_commission
    FROM referral_records 
    WHERE referrer_id = user_info.id;
    
    RETURN json_build_object(
        'user_id', user_info.id,
        'username', user_info.username,
        'referral_code', user_info.referral_code,
        'points', user_info.points,
        'was_referred_by', CASE 
            WHEN user_info.referred_by IS NOT NULL THEN referrer_info.username 
            ELSE 'No referrer' 
        END,
        'referrer_referral_code', COALESCE(referrer_info.referral_code, 'N/A'),
        'total_people_referred', referral_records_count,
        'total_commission_earned', total_commission
    );
END;

get_admin_by_session function:

  DECLARE
    session_record RECORD;
  BEGIN
    -- Find session and admin in one query with proper aliases
    SELECT
      s.admin_id, s.expires_at, s.last_activity,
      au.id, au.username, au.email, au.is_active, au.created_at, au.last_login
    INTO session_record
    FROM public.admin_sessions s
    JOIN public.admin_users au ON s.admin_id = au.id
    WHERE s.session_token = session_token_input AND s.expires_at > NOW() AND au.is_active = true;

    -- Check if session and admin exist
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or expired session';
    END IF;

    -- Update last activity
    UPDATE public.admin_sessions
    SET last_activity = NOW()
    WHERE session_token = session_token_input;

    -- Return admin data with explicit aliases
    RETURN QUERY
    SELECT
      session_record.id AS admin_id,
      session_record.username AS admin_username,
      session_record.email AS admin_email,
      session_record.is_active AS admin_is_active,
      session_record.created_at AS admin_created_at,
      session_record.last_login AS admin_last_login,
      session_record.expires_at AS session_expires_at;
  END;

get_referral_code function:

DECLARE
    stored_referral_code TEXT;
    referrer_user_id UUID;
BEGIN
    -- Get the most recent unused referral code for this phone
    SELECT rs.referral_code 
    INTO stored_referral_code
    FROM referral_sessions rs
    WHERE rs.phone = phone_input 
    AND rs.used = false 
    AND rs.expires_at > NOW()
    ORDER BY rs.created_at DESC
    LIMIT 1;
    
    IF stored_referral_code IS NOT NULL THEN
        -- Get referrer user ID
        SELECT u.id 
        INTO referrer_user_id
        FROM wager_wave_users u
        WHERE u.referral_code = stored_referral_code
        AND u.is_active = true;
        
        IF referrer_user_id IS NOT NULL THEN
            RETURN QUERY SELECT 
                TRUE, 
                stored_referral_code, 
                referrer_user_id,
                'Referral code found'::TEXT;
        ELSE
            RETURN QUERY SELECT 
                FALSE, 
                NULL::TEXT, 
                NULL::UUID,
                'Referral code expired or invalid'::TEXT;
        END IF;
    ELSE
        RETURN QUERY SELECT 
            FALSE, 
            NULL::TEXT, 
            NULL::UUID,
            'No referral code found'::TEXT;
    END IF;
END;

logout_admin function:

  BEGIN
    DELETE FROM public.admin_sessions
    WHERE session_token = session_token_input;

    IF FOUND THEN
      RETURN QUERY SELECT true as success, 'Logged out successfully' as message;
    ELSE
      RETURN QUERY SELECT false as success, 'Session not found' as message;
    END IF;
  END;

mark_referral_used function:

DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE referral_sessions 
    SET used = true, updated_at = NOW()
    WHERE phone = phone_input AND used = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RETURN QUERY SELECT TRUE, 'Referral code marked as used'::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, 'No active referral code found'::TEXT;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, ('Error marking referral as used: ' || SQLERRM)::TEXT;
END;

process_game_transaction function:

  DECLARE
      current_points INTEGER;
      new_points INTEGER;
      net_change INTEGER;
      username TEXT;
      transaction_id UUID;
  BEGIN
      -- Get current user points and username
      SELECT points, username INTO current_points, username
      FROM wager_wave_users
      WHERE id = user_id_input;

      -- Check if user exists
      IF NOT FOUND THEN
          RETURN json_build_object(
              'success', false,
              'error', 'User not found'
          );
      END IF;

      -- Check if user has enough points for bet
      IF bet_amount_input > current_points THEN
          RETURN json_build_object(
              'success', false,
              'error', 'Insufficient points for bet',
              'current_points', current_points,
              'required_points', bet_amount_input
          );
      END IF;

      -- Calculate net change and new points total
      net_change := result_amount_input - bet_amount_input;
      new_points := current_points + net_change;

      -- Ensure points don't go negative (safety check)
      IF new_points < 0 THEN
          new_points := 0;
      END IF;

      -- Update user points (deduct bet, add winnings)
      UPDATE wager_wave_users
      SET points = new_points,
          last_activity = NOW()
      WHERE id = user_id_input;

      -- Record transaction and get the transaction ID
      INSERT INTO game_transactions (
          user_id,
          game_type,
          bet_amount,
          result_amount,
          game_result,
          game_data,
          net_change,
          points_before,
          points_after,
          created_at
      ) VALUES (
          user_id_input,
          game_type_input,
          bet_amount_input,
          result_amount_input,
          game_result_input,
          game_data_input,
          net_change,
          current_points,
          new_points,
          NOW()
      ) RETURNING id INTO transaction_id;

      -- Return detailed success response
      RETURN json_build_object(
          'success', true,
          'transaction_id', transaction_id,
          'user', username,
          'game_type', game_type_input,
          'bet_amount', bet_amount_input,
          'result_amount', result_amount_input,
          'net_change', net_change,
          'points_before', current_points,
          'points_after', new_points,
          'game_result', game_result_input
      );

  EXCEPTION
      WHEN OTHERS THEN
          RETURN json_build_object(
              'success', false,
              'error', SQLERRM,
              'error_code', SQLSTATE
          );
  END;

process_topup function:

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
        
        -- Create top-up record with commission info
        INSERT INTO topup_records (user_id, amount, commission_paid, referrer_id, created_at)
        VALUES (user_id_input, amount_input, commission_amount, referrer_user_id, NOW());
    ELSE
        -- Create top-up record without commission
        INSERT INTO topup_records (user_id, amount, created_at)
        VALUES (user_id_input, amount_input, NOW());
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'amount_added', amount_input,
        'commission_paid', COALESCE(commission_amount, 0),
        'referrer_rewarded', referrer_user_id IS NOT NULL
    );
END;

process_topup_fixed function:

DECLARE
    referrer_user_id UUID;
    commission_amount INTEGER;
    username TEXT;
    referrer_username TEXT;
    rows_updated INTEGER := 0;
BEGIN
    -- Get user info
    SELECT u.username, u.referred_by 
    INTO username, referrer_user_id
    FROM wager_wave_users u
    WHERE u.id = user_id_input;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Add points to user
    UPDATE wager_wave_users 
    SET points = points + amount_input
    WHERE id = user_id_input;
    
    -- Process referral commission if user was referred
    IF referrer_user_id IS NOT NULL THEN
        commission_amount := FLOOR(amount_input * 0.1); -- 10% commission
        
        -- Get referrer username for logging
        SELECT u.username INTO referrer_username 
        FROM wager_wave_users u
        WHERE u.id = referrer_user_id;
        
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
          
        -- Check if update was successful
        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        
        -- Create top-up record with referral info
        INSERT INTO topup_records (user_id, username, amount, commission_paid, referrer_id)
        VALUES (user_id_input, username, amount_input, commission_amount, referrer_user_id);
    ELSE
        -- Create top-up record without referral info
        INSERT INTO topup_records (user_id, username, amount)
        VALUES (user_id_input, username, amount_input);
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'user', username,
        'amount_added', amount_input,
        'had_referrer', referrer_user_id IS NOT NULL,
        'referrer', COALESCE(referrer_username, 'None'),
        'commission_paid', COALESCE(commission_amount, 0),
        'referral_record_updated', rows_updated > 0
    );
END;

register_admin function:

  DECLARE
    new_admin_id UUID;
    password_hash_value VARCHAR(255);
  BEGIN
    -- Check if username already exists with proper alias
    IF EXISTS (SELECT 1 FROM public.admin_users au WHERE au.username = username_input) THEN
      RAISE EXCEPTION 'Username already exists';
    END IF;

    -- Check if email already exists with proper alias
    IF email_input IS NOT NULL AND EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = email_input) THEN
      RAISE EXCEPTION 'Email already exists';
    END IF;

    -- Generate password hash
    password_hash_value := crypt(password_input, gen_salt('bf'));

    -- Insert new admin user
    INSERT INTO public.admin_users (username, password_hash, email, is_active)
    VALUES (username_input, password_hash_value, email_input, true)
    RETURNING id INTO new_admin_id;

    -- Return admin data with explicit aliases
    RETURN QUERY
    SELECT
      au.id AS admin_id,
      au.username AS admin_username,
      au.email AS admin_email,
      au.is_active AS admin_is_active,
      au.created_at AS admin_created_at
    FROM public.admin_users au
    WHERE au.id = new_admin_id;
  END;

register_wager_user_with_promo function:
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
END;$$;

store_referral_code function:

BEGIN
    -- Validate inputs
    IF phone_input IS NULL OR phone_input = '' THEN
        RETURN QUERY SELECT FALSE, 'Phone number is required'::TEXT;
        RETURN;
    END IF;
    
    IF referral_code_input IS NULL OR referral_code_input = '' THEN
        RETURN QUERY SELECT FALSE, 'Referral code is required'::TEXT;
        RETURN;
    END IF;
    
    -- Check if referral code exists and is valid
    IF NOT EXISTS (
        SELECT 1 FROM wager_wave_users 
        WHERE referral_code = referral_code_input 
        AND is_active = true
    ) THEN
        RETURN QUERY SELECT FALSE, 'Invalid referral code'::TEXT;
        RETURN;
    END IF;
    
    -- Mark any existing unused referral sessions as used (to avoid unique constraint violation)
    UPDATE referral_sessions 
    SET used = true, updated_at = NOW()
    WHERE phone = phone_input AND used = false;
    
    -- Insert new referral session
    INSERT INTO referral_sessions (phone, referral_code, created_at, updated_at)
    VALUES (phone_input, referral_code_input, NOW(), NOW());
    
    RETURN QUERY SELECT TRUE, 'Referral code stored successfully'::TEXT;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT FALSE, 'A referral code is already pending for this phone number'::TEXT;
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, ('Error storing referral code: ' || SQLERRM)::TEXT;
END;

update_admin_session_activity function:

  BEGIN
    -- Update with proper alias
    UPDATE public.admin_sessions
    SET last_activity = NOW()
    WHERE session_token = session_token_input AND admin_sessions.expires_at > NOW();

    IF FOUND THEN
      RETURN QUERY SELECT true as success, NOW() as last_activity;
    ELSE
      RETURN QUERY SELECT false as success, NULL::TIMESTAMP WITH TIME ZONE as last_activity;
    END IF;
  END;

update_referral_topup_commission function:

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

upsert_referral_record function:

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

validate_admin_session function:

  DECLARE
    session_record RECORD;
    admin_record RECORD;
  BEGIN
    -- Find session with proper alias
    SELECT s.admin_id, s.expires_at, s.last_activity
    INTO session_record
    FROM public.admin_sessions s
    WHERE s.session_token = session_token_input;

    -- Check if session exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid session token';
    END IF;

    -- Check if session is expired
    IF session_record.expires_at < NOW() THEN
      DELETE FROM public.admin_sessions
      WHERE session_token = session_token_input;
      RAISE EXCEPTION 'Session expired';
    END IF;

    -- Get admin data with proper alias
    SELECT au.id, au.username, au.email, au.is_active
    INTO admin_record
    FROM public.admin_users au
    WHERE au.id = session_record.admin_id AND au.is_active = true;

    -- Check if admin is still active
    IF NOT FOUND THEN
      DELETE FROM public.admin_sessions
      WHERE session_token = session_token_input;
      RAISE EXCEPTION 'Admin account is inactive';
    END IF;

    -- Update last activity
    UPDATE public.admin_sessions
    SET last_activity = NOW()
    WHERE session_token = session_token_input;

    -- Return admin and session data with explicit aliases
    RETURN QUERY
    SELECT
      admin_record.id AS admin_id,
      admin_record.username AS admin_username,
      admin_record.email AS admin_email,
      admin_record.is_active AS admin_is_active,
      session_record.expires_at AS session_expires_at,
      NOW() AS last_activity;
  END;

validate_referral_code function:

BEGIN
    -- Check if referral code is provided
    IF referral_code_input IS NULL OR referral_code_input = '' THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'No referral code provided'::TEXT;
        RETURN;
    END IF;
    
    -- Check if referral code exists and get referrer info
    RETURN QUERY
    SELECT 
        TRUE as is_valid,
        u.id as referrer_id,
        'Valid referral code'::TEXT as error_message
    FROM wager_wave_users u
    WHERE u.referral_code = referral_code_input
    AND u.is_active = true
    LIMIT 1;
    
    -- If no rows returned, referral code is invalid
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid referral code'::TEXT;
    END IF;
END;

-- MARKETING FUNCTIONS

-- Function to validate promotional code
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

-- Function to record marketing registration
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
