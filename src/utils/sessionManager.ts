// Session Management Utility
// Handles user login, logout, and session persistence

import { 
  authenticateAdmin, 
  createAdminSession, 
  validateAdminSession, 
  updateAdminSessionActivity, 
  logoutAdmin, 
  getAdminBySession,
  AdminUser 
} from '../lib/supabase';

export interface UserSession {
  id: string;
  username: string;
  phone?: string;
  points: number;
  is_active: boolean;
  is_vip: boolean;
  rank?: string;
  referral_code?: string;
  role: 'user' | 'admin';
  loginTime: string;
  lastActivity: string;
  sessionToken?: string; // For admin sessions stored in database
}

const CURRENT_USER_KEY = 'currentUser';
const WAGER_WAVE_USER_KEY = 'wagerWaveUser';
const ADMIN_SESSION_TOKEN_KEY = 'adminSessionToken';

export class SessionManager {
  // Login a user (replaces any existing session)
  static login(userData: any, role: 'user' | 'admin' = 'user'): void {
    // Clear any existing session first
    this.logout();
    
    const userSession: UserSession = {
      ...userData,
      role,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    // Store session data
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
    if (role === 'user') {
      localStorage.setItem(WAGER_WAVE_USER_KEY, JSON.stringify(userData));
    }
    
    console.log('User logged in:', userSession.username);
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('userLoggedIn', { 
      detail: userSession 
    }));
  }

  // Admin login with database session
  static async loginAdmin(username: string, password: string): Promise<{ success: boolean; error?: string; data?: UserSession }> {
    try {
      // Clear any existing session first
      await this.logoutAdmin();
      
      // Authenticate admin
      const authResult = await authenticateAdmin(username, password);
      if (authResult.error || !authResult.data) {
        return { success: false, error: authResult.error?.message || 'Authentication failed' };
      }

      // authResult.data is already transformed in the supabase function
      const adminData = authResult.data;
      
      // Create session in database
      const sessionResult = await createAdminSession(adminData.id);
      if (sessionResult.error || !sessionResult.data) {
        return { success: false, error: sessionResult.error?.message || 'Failed to create session' };
      }

      // sessionResult.data is already transformed in the supabase function
      const sessionData = sessionResult.data;
      
      // Create user session object
      const userSession: UserSession = {
        id: adminData.id,
        username: adminData.username,
        points: 0, // Admins don't have points
        is_active: adminData.is_active,
        is_vip: false, // Admins are not VIP
        role: 'admin',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        sessionToken: sessionData.session_token
      };
      
      // Store session token in localStorage for quick access
      localStorage.setItem(ADMIN_SESSION_TOKEN_KEY, sessionData.session_token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
      
      console.log('Admin logged in:', userSession.username);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('userLoggedIn', { 
        detail: userSession 
      }));

      return { success: true, data: userSession };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }
  
  // Logout current user (clear all session data)
  static logout(): void {
    try {
      const userData = localStorage.getItem(CURRENT_USER_KEY);
      let username = 'Unknown User';
      let isAdmin = false;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          username = user?.username || 'Unknown User';
          isAdmin = user?.role === 'admin';
        } catch (e) {
          // Ignore parsing errors during logout
        }
      }
      
      // If admin, handle database session logout
      if (isAdmin) {
        this.logoutAdmin().catch(console.error);
      } else {
        // Clear all user-related localStorage keys
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(WAGER_WAVE_USER_KEY);
        
        console.log('User logged out:', username);
        
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear localStorage even if there's an error
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(WAGER_WAVE_USER_KEY);
      localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    }
  }

  // Admin logout with database session cleanup
  static async logoutAdmin(): Promise<void> {
    try {
      const sessionToken = localStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
      const userData = localStorage.getItem(CURRENT_USER_KEY);
      let username = 'Unknown Admin';
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          username = user?.username || 'Unknown Admin';
        } catch (e) {
          // Ignore parsing errors during logout
        }
      }
      
      // Invalidate session in database if token exists
      if (sessionToken) {
        await logoutAdmin(sessionToken);
      }
      
      // Clear all localStorage keys
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(WAGER_WAVE_USER_KEY);
      localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
      
      console.log('Admin logged out:', username);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
    } catch (error) {
      console.error('Error during admin logout:', error);
      // Force clear localStorage even if there's an error
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(WAGER_WAVE_USER_KEY);
      localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    }
  }
  
  // Get current logged-in user (synchronous for UI compatibility)
  static getCurrentUser(): UserSession | null {
    try {
      const userData = localStorage.getItem(CURRENT_USER_KEY);
      if (!userData) return null;
      
      const user: UserSession = JSON.parse(userData);
      
      // Validate user object has required properties
      if (!user || !user.id || !user.username) {
        console.warn('Invalid user session detected, clearing...');
        this.logout();
        return null;
      }
      
      // For admin users, we should validate session in background
      if (user.role === 'admin') {
        this.validateCurrentAdminSession().catch(console.error);
      }
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      // Clear corrupted session data
      this.logout();
      return null;
    }
  }

  // Validate current admin session (async)
  static async validateCurrentAdminSession(): Promise<boolean> {
    try {
      const sessionToken = localStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
      if (!sessionToken) {
        console.warn('Admin session token not found, logging out...');
        await this.logoutAdmin();
        return false;
      }

      const validationResult = await validateAdminSession(sessionToken);
      if (validationResult.error || !validationResult.data) {
        console.warn('Admin session validation failed, logging out...');
        await this.logoutAdmin();
        return false;
      }

      // Update localStorage with fresh admin data
      const adminData = validationResult.data;
      const userSession: UserSession = {
        id: adminData.id,
        username: adminData.username,
        points: 0,
        is_active: adminData.is_active,
        is_vip: false,
        role: 'admin',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        sessionToken: sessionToken
      };
      
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
      return true;
    } catch (error) {
      console.error('Error validating admin session:', error);
      await this.logoutAdmin();
      return false;
    }
  }

  // Get current admin user with fresh data from database
  static async getCurrentAdminUser(): Promise<UserSession | null> {
    try {
      const sessionToken = localStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
      if (!sessionToken) return null;

      const result = await getAdminBySession(sessionToken);
      if (result.error || !result.data) {
        await this.logoutAdmin();
        return null;
      }

      const adminData = result.data;
      const userSession: UserSession = {
        id: adminData.id,
        username: adminData.username,
        points: 0,
        is_active: adminData.is_active,
        is_vip: false,
        role: 'admin',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        sessionToken: sessionToken
      };
      
      // Update localStorage with fresh data
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
      
      return userSession;
    } catch (error) {
      console.error('Error getting current admin user:', error);
      await this.logoutAdmin();
      return null;
    }
  }
  
  // Check if user is logged in
  static isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
  
  // Check if user is admin
  static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }
  
  // Update current user data (for points, VIP status, etc.)
  static updateCurrentUser(updates: Partial<UserSession>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.error('No user logged in to update');
      return;
    }
    
    const updatedUser = {
      ...currentUser,
      ...updates,
      lastActivity: new Date().toISOString()
    };
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    
    // Also update wagerWaveUser if it's a regular user
    if (updatedUser.role === 'user') {
      localStorage.setItem(WAGER_WAVE_USER_KEY, JSON.stringify(updatedUser));
    }
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('userUpdated', { 
      detail: updatedUser 
    }));
  }
  
  // Update last activity timestamp
  static updateLastActivity(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.lastActivity = new Date().toISOString();
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      
      // For admin users, also update database session activity
      if (currentUser.role === 'admin' && currentUser.sessionToken) {
        updateAdminSessionActivity(currentUser.sessionToken).catch(console.error);
      }
    }
  }
  
  // Get session info for debugging
  static getSessionInfo(): {
    isLoggedIn: boolean;
    user: UserSession | null;
    loginDuration: string | null;
  } {
    const user = this.getCurrentUser();
    let loginDuration = null;
    
    if (user && user.loginTime) {
      const loginTime = new Date(user.loginTime);
      const now = new Date();
      const duration = Math.floor((now.getTime() - loginTime.getTime()) / 1000 / 60); // minutes
      loginDuration = `${duration} minutes`;
    }
    
    return {
      isLoggedIn: this.isLoggedIn(),
      user,
      loginDuration
    };
  }
  
  // Force logout if session is invalid or corrupted
  static validateSession(): boolean {
    try {
      const user = this.getCurrentUser();
      if (!user || !user.id || !user.username) {
        console.warn('Invalid session detected, logging out');
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      this.logout();
      return false;
    }
  }
}