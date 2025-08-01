import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface WagerWaveUser {
  id: string
  username: string
  phone: string
  login_count: number
  is_active: boolean
  created_at: string
  last_login?: string
  points: number
  is_vip: boolean
  rank: string
  referred_by?: string
  status: string
  role: string
  referral_code: string
}

export interface ReferralRecord {
  id: string
  referrer_id: string
  referred_user_id: string
  referred_username: string
  registration_date: string
  total_commission_earned: number
  last_topup_amount?: number
  last_topup_date?: string
}

export interface TopUpRecord {
  id: string
  user_id: string
  username: string
  amount: number
  referrer_id?: string
  commission_paid: number
  created_at: string
}

export interface GameTransaction {
  id: string
  user_id: string
  game_type: string
  bet_amount: number
  result_amount: number
  game_result: string
  game_data?: any
  created_at: string
}

export interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  holder_name: string
  bank_limit?: number
  is_active: boolean
  created_at: string
}

// Authentication function that calls Supabase RPC function
export const authenticateUser = async (username: string, password: string) => {
  try {
    const { data, error } = await supabase.rpc('authenticate_wager_user', {
      username_input: username.trim(),
      password_input: password
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    return {
      data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Authentication failed' }
    };
  }
};

// Enhanced registration function with referral support
export const registerUser = async (username: string, password: string, phone?: string, referralCode?: string) => {
  try {
    // First, convert referral code to referrer ID if provided
    let referredById = null;
    if (referralCode?.trim()) {
      const { data: referrerData } = await supabase
        .from('wager_wave_users')
        .select('id')
        .eq('referral_code', referralCode.trim())
        .single();
      
      if (referrerData) {
        referredById = referrerData.id;
      }
    }

    const { data, error } = await supabase.rpc('register_wager_user', {
      username_input: username.trim(),
      password_input: password,
      phone_input: phone?.trim() || null,
      referred_by_id: referredById
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    // PostgreSQL returns array, get first element and transform to expected format
    const userData = Array.isArray(data) ? data[0] : data;
    const transformedData = userData ? [{
      id: userData.id,
      username: userData.username,
      phone: userData.phone,
      referral_code: userData.referral_code,
      points: userData.points,
      is_active: userData.is_active,
      login_count: userData.login_count,
      created_at: userData.created_at
    }] : data;

    return {
      data: transformedData,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Registration failed' }
    };
  }
};

// Top-up function with referral commission processing
export const processTopUp = async (userId: string, amount: number) => {
  try {
    const { data, error } = await supabase.rpc('process_topup_fixed', {
      user_id_input: userId,
      amount_input: amount
    });

    if (error) {
      console.error('Top-up error:', error);
      return {
        success: false,
        error: { message: error.message }
      };
    }

    console.log('Top-up result:', data);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Top-up exception:', error);
    return {
      success: false,
      error: { message: 'Top-up processing failed' }
    };
  }
};

// Get user data by ID to refresh points and other info
export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wager_wave_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get user error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Get user exception:', error);
    return { data: null, error: { message: 'Failed to get user data' } };
  }
};

// Debug function to check referral info
export const debugReferralInfo = async (username: string) => {
  try {
    const { data, error } = await supabase.rpc('debug_referral_info', {
      username_input: username
    });

    if (error) {
      console.error('Debug error:', error);
      return { data: null, error };
    }

    console.log('Debug referral info:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Debug exception:', error);
    return { data: null, error: { message: 'Debug failed' } };
  }
};

// Game transaction function
export const processGameTransaction = async (
  userId: string,
  gameType: string,
  betAmount: number,
  resultAmount: number,
  gameResult: string,
  gameData?: any
) => {
  try {
    const { data, error } = await supabase.rpc('process_game_transaction', {
      user_id_input: userId,
      game_type_input: gameType,
      bet_amount_input: betAmount,
      result_amount_input: resultAmount,
      game_result_input: gameResult,
      game_data_input: gameData || null
    });

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: { message: 'Game transaction failed' }
    };
  }
};

// Get user's referral records
export const getUserReferralRecords = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('referral_records')
      .select('*')
      .eq('referrer_id', userId)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Get user's top-up records
export const getUserTopUpRecords = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('topup_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Process referral registration bonus (+50 points)
export const processReferralRegistrationBonus = async (referrerUserId: string, newUserId: string, newUsername: string) => {
  try {
    // Award +50 points to referrer
    const { error: pointsError } = await supabase.rpc('add_user_points', {
      user_id_input: referrerUserId,
      points_to_add: 50
    });

    if (pointsError) {
      console.error('Error adding referral registration bonus:', pointsError);
      return { success: false, error: pointsError.message };
    }

    // Create/update referral record with registration bonus
    const { error: recordError } = await supabase.rpc('upsert_referral_record', {
      referrer_id_input: referrerUserId,
      referred_user_id_input: newUserId,
      referred_username_input: newUsername,
      commission_amount_input: 50,
      topup_amount_input: null
    });

    if (recordError) {
      console.error('Error creating referral record:', recordError);
      return { success: false, error: recordError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error processing referral registration bonus:', error);
    return { success: false, error: error.message };
  }
};

// Process referral top-up commission (10% of top-up amount)
export const processReferralTopUpCommission = async (userId: string, topUpAmount: number) => {
  try {
    // Check if user was referred by someone
    const { data: userData, error: userError } = await supabase
      .from('wager_wave_users')
      .select('referred_by')
      .eq('id', userId)
      .single();

    if (userError || !userData || !userData.referred_by) {
      console.log('User was not referred or error fetching user data');
      return { success: true, message: 'No referrer found' };
    }

    const commission = Math.floor(topUpAmount * 0.1); // 10% commission

    // Award commission points to referrer
    const { error: pointsError } = await supabase.rpc('add_user_points', {
      user_id_input: userData.referred_by,
      points_to_add: commission
    });

    if (pointsError) {
      console.error('Error adding top-up commission:', pointsError);
      return { success: false, error: pointsError.message };
    }

    // Update referral record with top-up commission
    const { error: recordError } = await supabase.rpc('update_referral_topup_commission', {
      referrer_id_input: userData.referred_by,
      referred_user_id_input: userId,
      commission_amount_input: commission,
      topup_amount_input: topUpAmount
    });

    if (recordError) {
      console.error('Error updating referral record:', recordError);
      return { success: false, error: recordError.message };
    }

    return { success: true, commission };
  } catch (error: any) {
    console.error('Error processing referral top-up commission:', error);
    return { success: false, error: error.message };
  }
};

// Get all users (admin function)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('wager_wave_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Update user points (admin function)
export const updateUserPoints = async (userId: string, points: number) => {
  try {
    const { data, error } = await supabase
      .from('wager_wave_users')
      .update({ points })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Update user VIP status (admin function)
export const updateUserVipStatus = async (userId: string, isVip: boolean, rank?: string) => {
  try {
    const updateData: any = { is_vip: isVip };
    if (rank) updateData.rank = rank;

    const { data, error } = await supabase
      .from('wager_wave_users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Update user status (admin function)
export const updateUserStatus = async (userId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('wager_wave_users')
      .update({ status })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Get bank accounts (admin function)
export const getBankAccounts = async () => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Add bank account (admin function)
export const addBankAccount = async (bankData: Omit<BankAccount, 'id' | 'created_at' | 'is_active'>) => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([{ ...bankData, is_active: true }])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Update bank account (admin function)
export const updateBankAccount = async (id: string, bankData: Partial<BankAccount>) => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update(bankData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Delete bank account (admin function)
export const deleteBankAccount = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
};

// Generate referral code (utility function)
export const generateReferralCode = (userId: string, username: string): string => {
  const userIdSuffix = userId.slice(-4);
  return `REF${username.toUpperCase()}${userIdSuffix}`;
};

// Generate referral link (utility function)
export const generateReferralLink = (referralCode: string): string => {
  return `${window.location.origin}/register?ref=${referralCode}`;
};

// Admin authentication interface
export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

// Admin session interface
export interface AdminSession {
  id: string;
  admin_id: string;
  session_token: string;
  expires_at: string;
  last_activity: string;
  created_at: string;
}

// Admin authentication function
export const authenticateAdmin = async (username: string, password: string) => {
  try {
    const { data, error } = await supabase.rpc('authenticate_admin', {
      username_input: username.trim(),
      password_input: password
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    // PostgreSQL functions return arrays, so get the first element
    const adminData = Array.isArray(data) ? data[0] : data;
    
    // Transform the returned data to match expected format
    const transformedData = adminData ? {
      id: adminData.id,
      username: adminData.username,
      email: adminData.email,
      is_active: adminData.is_active,
      created_at: adminData.created_at,
      last_login: adminData.last_login
    } : null;

    return {
      data: transformedData,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Admin authentication failed' }
    };
  }
};

// Create admin session
export const createAdminSession = async (adminId: string) => {
  try {
    const { data, error } = await supabase.rpc('create_admin_session', {
      admin_id_input: adminId
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    // PostgreSQL functions return arrays, so get the first element
    const sessionData = Array.isArray(data) ? data[0] : data;

    return {
      data: sessionData,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Failed to create admin session' }
    };
  }
};

// Validate admin session
export const validateAdminSession = async (sessionToken: string) => {
  try {
    const { data, error } = await supabase.rpc('validate_admin_session', {
      session_token_input: sessionToken
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    // Transform the returned data to match expected format
    const transformedData = data ? {
      id: data.admin_id,
      username: data.admin_username,
      email: data.admin_email,
      is_active: data.admin_is_active,
      session_expires_at: data.session_expires_at,
      last_activity: data.last_activity
    } : null;

    return {
      data: transformedData,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Session validation failed' }
    };
  }
};

// Update admin session activity
export const updateAdminSessionActivity = async (sessionToken: string) => {
  try {
    const { data, error } = await supabase.rpc('update_admin_session_activity', {
      session_token_input: sessionToken
    });

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: { message: 'Failed to update session activity' }
    };
  }
};

// Logout admin (invalidate session)
export const logoutAdmin = async (sessionToken: string) => {
  try {
    const { data, error } = await supabase.rpc('logout_admin', {
      session_token_input: sessionToken
    });

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: { message: 'Logout failed' }
    };
  }
};

// Get admin by session token
export const getAdminBySession = async (sessionToken: string) => {
  try {
    const { data, error } = await supabase.rpc('get_admin_by_session', {
      session_token_input: sessionToken
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    // Transform the returned data to match expected format
    const transformedData = data ? {
      id: data.admin_id,
      username: data.admin_username,
      email: data.admin_email,
      is_active: data.admin_is_active,
      created_at: data.admin_created_at,
      last_login: data.admin_last_login,
      session_expires_at: data.session_expires_at
    } : null;

    return {
      data: transformedData,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Failed to get admin data' }
    };
  }
};

// Register admin function
export const registerAdmin = async (username: string, password: string, email?: string) => {
  try {
    const { data, error } = await supabase.rpc('register_admin', {
      username_input: username.trim(),
      password_input: password,
      email_input: email?.trim() || null
    });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    // PostgreSQL functions return arrays, so get the first element
    const adminData = Array.isArray(data) ? data[0] : data;

    // Transform the returned data to match expected format
    const transformedData = adminData ? {
      id: adminData.id,
      username: adminData.username,
      email: adminData.email,
      is_active: adminData.is_active,
      created_at: adminData.created_at,
      last_login: adminData.last_login
    } : null;

    return {
      data: transformedData,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Admin registration failed' }
    };
  }
};