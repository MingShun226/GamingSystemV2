
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import GameProviders from '@/components/GameProviders';
import BettingTransaction from '@/components/BettingTransaction';
import MovieSection from '@/components/MovieSection';
import SponsorsSection from '@/components/SponsorsSection';
import Footer from '@/components/Footer';
import { SessionManager } from '@/utils/sessionManager';

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      const parsedUser = SessionManager.getCurrentUser();
      if (parsedUser) {
        
        // Prevent admin from accessing landing page
        if (parsedUser.role === 'admin') {
          console.log('Admin detected, redirecting to admin dashboard');
          navigate('/admin-dashboard', { replace: true });
          return;
        }
        
        setCurrentUser(parsedUser);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    };

    // Check user on mount
    checkUser();

    // Listen for storage changes (when user logs in from another tab)
    window.addEventListener('storage', checkUser);
    
    // Also check periodically for login state changes
    const interval = setInterval(checkUser, 1000);

    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handlePlayNow = () => {
    if (currentUser?.role === 'user') {
      navigate('/game');
    } else {
      navigate('/login');
    }
  };

  // Show loading state while checking user
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark max-w-full overflow-x-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={handleSidebarToggle}
      />
      
      <div 
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-12' : 'ml-56'
        } min-h-screen flex flex-col`}
      >
        <Header onSidebarToggle={handleSidebarToggle} />
        
        <div className="flex-1">
          <main className="animate-fade-in max-w-7xl mx-auto">
            <HeroSection onPlayNow={handlePlayNow} />
            <GameProviders />
            <BettingTransaction />
            <MovieSection />
            <SponsorsSection />
          </main>
          
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Index;
