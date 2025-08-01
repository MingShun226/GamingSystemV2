-- Complete Admin System Setup
-- Run this ONLY if admin tables/functions are missing

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);

-- 2. Create admin_sessions table
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT admin_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE CASCADE
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);

-- 4. Register admin function
CREATE OR REPLACE FUNCTION public.register_admin(
    username_input VARCHAR(255), 
    password_input VARCHAR(255), 
    email_input VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    username VARCHAR(255),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_admin_id UUID;
    password_hash_value VARCHAR(255);
BEGIN
    -- Check if username already exists
    IF EXISTS (
        SELECT 1 FROM public.admin_users existing_admin 
        WHERE existing_admin.username = username_input
    ) THEN
        RAISE EXCEPTION 'Username already exists';
    END IF;

    -- Check if email already exists
    IF email_input IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.admin_users existing_email 
        WHERE existing_email.email = email_input
    ) THEN
        RAISE EXCEPTION 'Email already exists';
    END IF;

    -- Generate password hash
    password_hash_value := crypt(password_input, gen_salt('bf'));

    -- Insert new admin user
    INSERT INTO public.admin_users (username, password_hash, email, is_active)
    VALUES (username_input, password_hash_value, email_input, true)
    RETURNING public.admin_users.id INTO new_admin_id;

    -- Return complete admin data matching table structure exactly
    RETURN QUERY
    SELECT
        result_admin.id,
        result_admin.username,
        result_admin.email,
        result_admin.password_hash,
        result_admin.is_active,
        result_admin.created_at,
        result_admin.last_login
    FROM public.admin_users result_admin
    WHERE result_admin.id = new_admin_id;

EXCEPTION
    WHEN unique_violation THEN
        IF SQLERRM LIKE '%username%' THEN
            RAISE EXCEPTION 'Username already exists';
        ELSIF SQLERRM LIKE '%email%' THEN
            RAISE EXCEPTION 'Email already exists';
        ELSE
            RAISE EXCEPTION 'Registration failed: duplicate data';
        END IF;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Registration failed: %', SQLERRM;
END;
$$;

-- 5. Authenticate admin function
CREATE OR REPLACE FUNCTION public.authenticate_admin(
    username_input VARCHAR(255), 
    password_input VARCHAR(255)
)
RETURNS TABLE(
    id UUID,
    username VARCHAR(255),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Find admin user by username with explicit table alias
    SELECT 
        auth_admin.id, 
        auth_admin.username, 
        auth_admin.email, 
        auth_admin.password_hash, 
        auth_admin.is_active, 
        auth_admin.created_at, 
        auth_admin.last_login
    INTO admin_record
    FROM public.admin_users auth_admin
    WHERE auth_admin.username = username_input AND auth_admin.is_active = true;

    -- Check if admin exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid username or password';
    END IF;

    -- Verify password
    IF admin_record.password_hash != crypt(password_input, admin_record.password_hash) THEN
        RAISE EXCEPTION 'Invalid username or password';
    END IF;

    -- Update last login time with explicit table reference
    UPDATE public.admin_users
    SET last_login = NOW()
    WHERE public.admin_users.id = admin_record.id;

    -- Return complete admin data with updated last_login
    RETURN QUERY
    SELECT
        admin_record.id,
        admin_record.username,
        admin_record.email,
        admin_record.password_hash,
        admin_record.is_active,
        admin_record.created_at,
        NOW() AS last_login;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Authentication failed: %', SQLERRM;
END;
$$;

-- 6. Create admin session function
CREATE OR REPLACE FUNCTION public.create_admin_session(admin_id_input UUID)
RETURNS TABLE(session_token VARCHAR(255), expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_session_token VARCHAR(255);
    session_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Validate input parameter
    IF admin_id_input IS NULL THEN
        RAISE EXCEPTION 'Admin ID cannot be null';
    END IF;

    -- Check if admin exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_users existing_admin 
        WHERE existing_admin.id = admin_id_input 
        AND existing_admin.is_active = true
    ) THEN
        RAISE EXCEPTION 'Admin not found or inactive';
    END IF;

    -- Generate unique session token
    new_session_token := encode(gen_random_bytes(32), 'hex');
    session_expires_at := NOW() + INTERVAL '24 hours';

    -- Clean up expired sessions for this admin
    DELETE FROM public.admin_sessions
    WHERE public.admin_sessions.admin_id = admin_id_input 
    AND public.admin_sessions.expires_at < NOW();

    -- Insert new session
    INSERT INTO public.admin_sessions (admin_id, session_token, expires_at, last_activity, created_at)
    VALUES (admin_id_input, new_session_token, session_expires_at, NOW(), NOW());

    -- Return session data
    RETURN QUERY
    SELECT
        new_session_token AS session_token,
        session_expires_at AS expires_at;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Session creation failed: %', SQLERRM;
END;
$$;

-- 7. Validate admin session function
CREATE OR REPLACE FUNCTION public.validate_admin_session(session_token_input VARCHAR(255))
RETURNS TABLE(
    admin_id UUID,
    admin_username VARCHAR(255),
    admin_email VARCHAR(255),
    admin_is_active BOOLEAN,
    session_expires_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record RECORD;
    admin_record RECORD;
BEGIN
    -- Find session with explicit table alias
    SELECT 
        session_data.admin_id, 
        session_data.expires_at, 
        session_data.last_activity
    INTO session_record
    FROM public.admin_sessions session_data
    WHERE session_data.session_token = session_token_input;

    -- Check if session exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid session token';
    END IF;

    -- Check if session is expired
    IF session_record.expires_at < NOW() THEN
        DELETE FROM public.admin_sessions
        WHERE public.admin_sessions.session_token = session_token_input;
        RAISE EXCEPTION 'Session expired';
    END IF;

    -- Get admin data with explicit table alias
    SELECT 
        admin_data.id, 
        admin_data.username, 
        admin_data.email, 
        admin_data.is_active
    INTO admin_record
    FROM public.admin_users admin_data
    WHERE admin_data.id = session_record.admin_id AND admin_data.is_active = true;

    -- Check if admin is still active
    IF NOT FOUND THEN
        DELETE FROM public.admin_sessions
        WHERE public.admin_sessions.session_token = session_token_input;
        RAISE EXCEPTION 'Admin account is inactive';
    END IF;

    -- Update last activity with explicit table reference
    UPDATE public.admin_sessions
    SET last_activity = NOW()
    WHERE public.admin_sessions.session_token = session_token_input;

    -- Return admin and session data
    RETURN QUERY
    SELECT
        admin_record.id AS admin_id,
        admin_record.username AS admin_username,
        admin_record.email AS admin_email,
        admin_record.is_active AS admin_is_active,
        session_record.expires_at AS session_expires_at,
        NOW() AS last_activity;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Session validation failed: %', SQLERRM;
END;
$$;

-- 8. Update admin session activity function
CREATE OR REPLACE FUNCTION public.update_admin_session_activity(session_token_input VARCHAR(255))
RETURNS TABLE(success BOOLEAN, last_activity TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update with proper alias
    UPDATE public.admin_sessions
    SET last_activity = NOW()
    WHERE public.admin_sessions.session_token = session_token_input 
    AND public.admin_sessions.expires_at > NOW();

    IF FOUND THEN
        RETURN QUERY SELECT true as success, NOW() as last_activity;
    ELSE
        RETURN QUERY SELECT false as success, NULL::TIMESTAMP WITH TIME ZONE as last_activity;
    END IF;
END;
$$;

-- 9. Logout admin function
CREATE OR REPLACE FUNCTION public.logout_admin(session_token_input VARCHAR(255))
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.admin_sessions
    WHERE public.admin_sessions.session_token = session_token_input;

    IF FOUND THEN
        RETURN QUERY SELECT true as success, 'Logged out successfully' as message;
    ELSE
        RETURN QUERY SELECT false as success, 'Session not found' as message;
    END IF;
END;
$$;

-- 10. Get admin by session function
CREATE OR REPLACE FUNCTION public.get_admin_by_session(session_token_input VARCHAR(255))
RETURNS TABLE(
    admin_id UUID,
    admin_username VARCHAR(255),
    admin_email VARCHAR(255),
    admin_is_active BOOLEAN,
    admin_created_at TIMESTAMP WITH TIME ZONE,
    admin_last_login TIMESTAMP WITH TIME ZONE,
    session_expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    WHERE public.admin_sessions.session_token = session_token_input;

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

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to get admin data: %', SQLERRM;
END;
$$;