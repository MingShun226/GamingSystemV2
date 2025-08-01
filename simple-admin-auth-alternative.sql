-- ALTERNATIVE: Simple admin auth without sessions (like regular users)
-- Use this if you want to skip the complex session system temporarily

-- 1. Create simple admin_users table (if it doesn't exist)
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

-- 2. Simple register admin (no sessions)
CREATE OR REPLACE FUNCTION public.register_admin(
    username_input VARCHAR(255), 
    password_input VARCHAR(255), 
    email_input VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    username VARCHAR(255),
    email VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_admin_id UUID;
    password_hash_value VARCHAR(255);
BEGIN
    -- Check if username already exists
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE username = username_input) THEN
        RAISE EXCEPTION 'Username already exists';
    END IF;

    -- Generate password hash
    password_hash_value := crypt(password_input, gen_salt('bf'));

    -- Insert new admin user
    INSERT INTO public.admin_users (username, password_hash, email, is_active)
    VALUES (username_input, password_hash_value, email_input, true)
    RETURNING id INTO new_admin_id;

    -- Return admin data
    RETURN QUERY
    SELECT
        au.id,
        au.username,
        au.email,
        au.is_active,
        au.created_at
    FROM public.admin_users au
    WHERE au.id = new_admin_id;
END;
$$;

-- 3. Simple authenticate admin (no sessions)
CREATE OR REPLACE FUNCTION public.authenticate_admin(
    username_input VARCHAR(255), 
    password_input VARCHAR(255)
)
RETURNS TABLE(
    id UUID,
    username VARCHAR(255),
    email VARCHAR(255),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Find and authenticate admin
    SELECT au.id, au.username, au.email, au.password_hash, au.is_active, au.created_at, au.last_login
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

    -- Update last login
    UPDATE public.admin_users
    SET last_login = NOW()
    WHERE id = admin_record.id;

    -- Return admin data (no session needed)
    RETURN QUERY
    SELECT
        admin_record.id,
        admin_record.username,
        admin_record.email,
        admin_record.is_active,
        admin_record.created_at,
        NOW() AS last_login;
END;
$$;