// Session Management Utility
// Handles user login, logout, and session persistence

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
}

const CURRENT_USER_KEY = 'currentUser';
const WAGER_WAVE_USER_KEY = 'wagerWaveUser';

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
  
  // Logout current user (clear all session data)
  static logout(): void {
    try {
      const userData = localStorage.getItem(CURRENT_USER_KEY);
      let username = 'Unknown User';
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          username = user?.username || 'Unknown User';
        } catch (e) {
          // Ignore parsing errors during logout
        }
      }
      
      // Clear all user-related localStorage keys
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(WAGER_WAVE_USER_KEY);
      
      console.log('User logged out:', username);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear localStorage even if there's an error
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(WAGER_WAVE_USER_KEY);
    }
  }
  
  // Get current logged-in user
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
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      // Clear corrupted session data
      this.logout();
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