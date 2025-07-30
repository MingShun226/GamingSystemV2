
import React, { useState, useEffect } from 'react';
import { Menu, Trophy, User, CreditCard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import QuestDialog from './QuestDialog';
import GamesDialog from './GamesDialog';
import EventsDialog from './EventsDialog';
import SpecialDialog from './SpecialDialog';
import TopUpModal from './TopUpModal';
import VipBadge from './VipBadge';
import { useToast } from '@/hooks/use-toast';
import { SessionManager } from '@/utils/sessionManager';

interface HeaderProps {
  onSidebarToggle: () => void;
}

const Header = ({ onSidebarToggle }: HeaderProps) => {
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false);
  const [isGamesDialogOpen, setIsGamesDialogOpen] = useState(false);
  const [isEventsDialogOpen, setIsEventsDialogOpen] = useState(false);
  const [isSpecialDialogOpen, setIsSpecialDialogOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = () => {
      const user = SessionManager.getCurrentUser();
      setCurrentUser(user);
    };

    // Check user on mount
    checkUser();

    // Listen for storage changes and check periodically
    window.addEventListener('storage', checkUser);
    const interval = setInterval(checkUser, 1000);

    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    SessionManager.logout();
    setCurrentUser(null);
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const handleAvatarClick = () => {
    if (currentUser?.role === 'user') {
      navigate('/user-dashboard');
    }
  };

  const handleTopUpSuccess = (newPoints: number) => {
    // Update currentUser state
    const updatedUser = { ...currentUser, points: newPoints };
    
    // Check VIP status
    if (newPoints >= 1000 && !currentUser.isVip) {
      updatedUser.isVip = true;
      updatedUser.rank = 'VIP';
      
      toast({
        title: "Congratulations! 🎉",
        description: "You are now a VIP customer!",
      });
    }
    
    // Use SessionManager to update user data
    SessionManager.updateCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  const handleGameRedirect = () => {
    if (currentUser?.role === 'user') {
      navigate('/game');
    } else {
      navigate('/login');
    }
  };

  const navItems = [
    { label: 'Games', active: false, onClick: () => setIsGamesDialogOpen(true) },
    { label: 'Events', active: false, onClick: () => setIsEventsDialogOpen(true) },
    { label: 'Special', active: false, onClick: () => setIsSpecialDialogOpen(true) },
  ];

  return (
    <>
      <header className="bg-gaming-darker border-b border-gray-700/50 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-2 max-w-full">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="text-gray-300 hover:text-white p-2"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/603076d3-9354-4a55-89b3-ce3f167abbfe.png" 
                alt="ECLBET"
                className="h-8 w-auto"
              />
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 ml-8">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>{item.label}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuestDialogOpen(true)}
              className="bg-gradient-to-r from-gaming-teal to-gaming-teal/80 hover:from-gaming-teal/80 hover:to-gaming-teal/60 text-white border-gaming-teal text-xs px-3 py-1 h-8 relative"
            >
              <Trophy className="h-3 w-3 mr-1" />
              Quest
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                Live
              </span>
            </Button>

            {/* User Section or Login/Register */}
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* Points Display */}
                <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gaming-teal font-semibold text-sm">
                      {currentUser.points} pts
                    </span>
                    {currentUser.isVip && <VipBadge size="sm" />}
                  </div>
                  <Button
                    onClick={() => setIsTopUpModalOpen(true)}
                    size="sm"
                    className="bg-gaming-teal hover:bg-gaming-teal/80 text-white text-xs px-2 py-1 h-6"
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Top Up
                  </Button>
                </div>

                {/* User Avatar */}
                <button
                  onClick={handleAvatarClick}
                  className="flex items-center space-x-2 hover:bg-gray-800/50 rounded-lg px-2 py-1 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gaming-teal text-white text-sm">
                      {currentUser.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm font-medium hidden md:block">
                    {currentUser.username}
                  </span>
                </button>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white text-sm px-3 py-1 h-8"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-gray-300 hover:text-white text-sm px-3 py-1 h-8"
                >
                  Login
                </Button>

                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="gaming-button text-sm px-4 py-1 h-8"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Dialog Components */}
      <QuestDialog 
        isOpen={isQuestDialogOpen} 
        onClose={() => setIsQuestDialogOpen(false)} 
      />
      <GamesDialog 
        isOpen={isGamesDialogOpen} 
        onClose={() => setIsGamesDialogOpen(false)}
        onStartPlay={handleGameRedirect}
      />
      <EventsDialog 
        isOpen={isEventsDialogOpen} 
        onClose={() => setIsEventsDialogOpen(false)}
        onStartPlay={handleGameRedirect}
      />
      <SpecialDialog 
        isOpen={isSpecialDialogOpen} 
        onClose={() => setIsSpecialDialogOpen(false)}
        onStartPlay={handleGameRedirect}
      />
      
      {/* Top Up Modal */}
      {currentUser && (
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          currentPoints={currentUser.points || 0}
          onTopUpSuccess={handleTopUpSuccess}
        />
      )}
    </>
  );
};

export default Header;
