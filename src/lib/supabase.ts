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
    const { data, error } = await supabase.rpc('register_wager_user', {
      username_input: username.trim(),
      password_input: password,
      phone_input: phone?.trim() || null,
      referral_code_input: referralCode?.trim() || null
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
      error: { message: 'Registration failed' }
    };
  }
};

// Top-up function with referral commission processing
export const processTopUp = async (userId: string, amount: number) => {
  try {
    const { data, error } = await supabase.rpc('process_topup', {
      user_id_input: userId,
      amount_input: amount
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
      error: { message: 'Top-up processing failed' }
    };
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