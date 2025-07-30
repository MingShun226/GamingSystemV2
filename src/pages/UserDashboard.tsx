
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Gamepad2, User, CreditCard, ArrowLeft } from 'lucide-react';
import TopUpModal from '@/components/TopUpModal';
import ReferralCodeWidget from '@/components/ReferralCodeWidget';
import ReferralRecordsTable from '@/components/ReferralRecordsTable';
import VipBadge from '@/components/VipBadge';
import { SessionManager } from '@/utils/sessionManager';

const UserDashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('account');
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if current user is a regular user
    const user = SessionManager.getCurrentUser();
    if (!user?.id || user.role !== 'user') {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  const handleLogout = () => {
    SessionManager.logout();
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleTopUpSuccess = (newPoints: number) => {
    // Update user points and VIP status (VIP promotion is handled by Supabase)
    const updatedUser = { 
      ...currentUser, 
      points: newPoints,
      is_vip: newPoints >= 1000 ? true : currentUser.is_vip,
      rank: newPoints >= 1000 ? 'VIP' : currentUser.rank
    };
    
    // VIP promotion notification (VIP status is handled by Supabase)
    if (newPoints >= 1000 && !currentUser.is_vip) {
      toast({
        title: "Congratulations! 🎉",
        description: "You are now a VIP customer!",
      });
    }
    
    SessionManager.updateCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gaming-dark">
      {/* Header */}
      <header className="bg-gaming-darker border-b border-gray-700/50 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBackToHome}
              variant="ghost"
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <img 
              src="/lovable-uploads/603076d3-9354-4a55-89b3-ce3f167abbfe.png" 
              alt="ECLBET"
              className="h-8 w-auto"
            />
            <h1 className="text-white text-xl font-bold">Account Overview</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-gaming-teal font-semibold">
                Points: {currentUser.points}
              </div>
              {currentUser.is_vip && <VipBadge />}
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('account')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'account'
                  ? 'border-gaming-teal text-gaming-teal'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Account Overview
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'games'
                  ? 'border-gaming-teal text-gaming-teal'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
              }`}
            >
              <Gamepad2 className="h-4 w-4 inline mr-2" />
              Games
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'account' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Account Details */}
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-white text-lg font-semibold mb-4">Account Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Username</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white">{currentUser.username}</p>
                      {currentUser.is_vip && <VipBadge />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
                    <p className="text-white">{currentUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Rank</label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        currentUser.is_vip 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {currentUser.is_vip ? 'VIP Customer' : 'Normal Customer'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentUser.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {currentUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Points & Top Up */}
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-white text-lg font-semibold mb-4">Points & Top Up</h3>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gaming-teal mb-2">
                    {currentUser.points}
                  </div>
                  <p className="text-gray-400 text-sm">Available Points</p>
                </div>
                
                <Button 
                  className="w-full bg-gaming-teal hover:bg-gaming-teal/80 text-white"
                  onClick={() => setIsTopUpModalOpen(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Top Up Points
                </Button>
                
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                  <h4 className="text-white font-medium mb-2">
                    {currentUser.is_vip ? 'VIP Benefits:' : 'How Points Work:'}
                  </h4>
                  {currentUser.is_vip ? (
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• VIP customer support priority</li>
                      <li>• Exclusive VIP promotions</li>
                      <li>• Special VIP rewards</li>
                    </ul>
                  ) : (
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Use points to place bets in games</li>
                      <li>• Leaving a game after betting counts as a loss</li>
                      <li>• Top up 1000+ points to become VIP</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Referral Code Widget */}
            <ReferralCodeWidget userId={currentUser.id} username={currentUser.username} referralCode={currentUser.referral_code} />

            {/* Referral Records Table */}
            <ReferralRecordsTable userId={currentUser.id} />
          </div>
        )}

        {activeTab === 'games' && (
          <div className="text-center py-16">
            <Gamepad2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-white text-2xl font-bold mb-2">Games Coming Soon!</h2>
            <p className="text-gray-400 mb-6">Game features will be implemented later.</p>
            <Button
              onClick={() => navigate('/game')}
              className="bg-gaming-teal hover:bg-gaming-teal/80 text-white"
            >
              Go to Game Area
            </Button>
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        currentPoints={currentUser.points || 0}
        onTopUpSuccess={handleTopUpSuccess}
      />
    </div>
  );
};

export default UserDashboard;
