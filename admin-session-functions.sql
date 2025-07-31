-- Admin session management tables and functions

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (id)
);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);

-- Function to authenticate admin user
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
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Find admin user by username
  SELECT a.id, a.username, a.email, a.is_active, a.created_at, a.last_login, a.password_hash
  INTO admin_record
  FROM public.admin_users a
  WHERE a.username = username_input AND a.is_active = true;

  -- Check if admin exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid username or password';
  END IF;

  -- Verify password (assuming you're using crypt for password hashing)
  IF admin_record.password_hash != crypt(password_input, admin_record.password_hash) THEN
    RAISE EXCEPTION 'Invalid username or password';
  END IF;

  -- Update last login time
  UPDATE public.admin_users 
  SET last_login = NOW() 
  WHERE id = admin_record.id;

  -- Return admin data (excluding password_hash)
  RETURN QUERY
  SELECT 
    admin_record.id,
    admin_record.username,
    admin_record.email,
    admin_record.is_active,
    admin_record.created_at,
    NOW() as last_login;
END;
$$;

-- Function to create admin session
CREATE OR REPLACE FUNCTION public.create_admin_session(
  admin_id_input UUID
)
RETURNS TABLE(
  session_token VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_session_token VARCHAR(255);
  session_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate unique session token
  new_session_token := encode(gen_random_bytes(32), 'hex');
  session_expires_at := NOW() + INTERVAL '24 hours';

  -- Clean up expired sessions for this admin
  DELETE FROM public.admin_sessions 
  WHERE admin_id = admin_id_input AND expires_at < NOW();

  -- Insert new session
  INSERT INTO public.admin_sessions (admin_id, session_token, expires_at)
  VALUES (admin_id_input, new_session_token, session_expires_at);

  -- Return session data
  RETURN QUERY
  SELECT new_session_token, session_expires_at;
END;
$$;

-- Function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(
  session_token_input VARCHAR(255)
)
RETURNS TABLE(
  id UUID,
  username VARCHAR(255),
  email VARCHAR(255),
  is_active BOOLEAN,
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
  -- Find session
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
    -- Delete expired session
    DELETE FROM public.admin_sessions 
    WHERE session_token = session_token_input;
    RAISE EXCEPTION 'Session expired';
  END IF;

  -- Get admin data
  SELECT a.id, a.username, a.email, a.is_active
  INTO admin_record
  FROM public.admin_users a
  WHERE a.id = session_record.admin_id AND a.is_active = true;

  -- Check if admin is still active
  IF NOT FOUND THEN
    -- Delete session for inactive admin
    DELETE FROM public.admin_sessions 
    WHERE session_token = session_token_input;
    RAISE EXCEPTION 'Admin account is inactive';
  END IF;

  -- Update last activity
  UPDATE public.admin_sessions 
  SET last_activity = NOW() 
  WHERE session_token = session_token_input;

  -- Return admin and session data
  RETURN QUERY
  SELECT 
    admin_record.id,
    admin_record.username,
    admin_record.email,
    admin_record.is_active,
    session_record.expires_at,
    NOW() as last_activity;
END;
$$;

-- Function to update admin session activity
CREATE OR REPLACE FUNCTION public.update_admin_session_activity(
  session_token_input VARCHAR(255)
)
RETURNS TABLE(
  success BOOLEAN,
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last activity
  UPDATE public.admin_sessions 
  SET last_activity = NOW() 
  WHERE session_token = session_token_input AND expires_at > NOW();

  -- Check if update was successful
  IF FOUND THEN
    RETURN QUERY SELECT true as success, NOW() as last_activity;
  ELSE
    RETURN QUERY SELECT false as success, NULL::TIMESTAMP WITH TIME ZONE as last_activity;
  END IF;
END;
$$;

-- Function to logout admin (invalidate session)
CREATE OR REPLACE FUNCTION public.logout_admin(
  session_token_input VARCHAR(255)
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the session
  DELETE FROM public.admin_sessions 
  WHERE session_token = session_token_input;

  -- Check if session was found and deleted
  IF FOUND THEN
    RETURN QUERY SELECT true as success, 'Logged out successfully' as message;
  ELSE
    RETURN QUERY SELECT false as success, 'Session not found' as message;
  END IF;
END;
$$;

-- Function to get admin by session token
CREATE OR REPLACE FUNCTION public.get_admin_by_session(
  session_token_input VARCHAR(255)
)
RETURNS TABLE(
  id UUID,
  username VARCHAR(255),
  email VARCHAR(255),
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  session_expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  admin_record RECORD;
BEGIN
  -- Find session and admin in one query
  SELECT 
    s.admin_id, s.expires_at, s.last_activity,
    a.id, a.username, a.email, a.is_active, a.created_at, a.last_login
  INTO session_record
  FROM public.admin_sessions s
  JOIN public.admin_users a ON s.admin_id = a.id
  WHERE s.session_token = session_token_input AND s.expires_at > NOW() AND a.is_active = true;

  -- Check if session and admin exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;

  -- Update last activity
  UPDATE public.admin_sessions 
  SET last_activity = NOW() 
  WHERE session_token = session_token_input;

  -- Return admin data
  RETURN QUERY
  SELECT 
    session_record.id,
    session_record.username,
    session_record.email,
    session_record.is_active,
    session_record.created_at,
    session_record.last_login,
    session_record.expires_at;
END;
$$;

-- Function to clean up expired sessions (to be run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired sessions
  DELETE FROM public.admin_sessions 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Function to register new admin user
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
SECURITY DEFINER
AS $$
DECLARE
  new_admin_id UUID;
  password_hash_value VARCHAR(255);
BEGIN
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE username = username_input) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;

  -- Check if email already exists (if provided)
  IF email_input IS NOT NULL AND EXISTS (SELECT 1 FROM public.admin_users WHERE email = email_input) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;

  -- Generate password hash using crypt
  password_hash_value := crypt(password_input, gen_salt('bf'));

  -- Insert new admin user
  INSERT INTO public.admin_users (username, password_hash, email, is_active)
  VALUES (username_input, password_hash_value, email_input, true)
  RETURNING admin_users.id INTO new_admin_id;

  -- Return admin data (excluding password_hash)
  RETURN QUERY
  SELECT 
    a.id,
    a.username,
    a.email,
    a.is_active,
    a.created_at
  FROM public.admin_users a
  WHERE a.id = new_admin_id;
END;
$$;