
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Gamepad2, ArrowLeft, Trophy } from 'lucide-react';

const GamePage = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if current user is a regular user
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.id || user.role !== 'user') {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const handleGameClick = (gameId: number) => {
    if (gameId === 1) {
      navigate('/blackjack');
    } else {
      toast({
        title: "Coming Soon",
        description: `Game ${gameId} will be available soon!`,
      });
    }
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
            <h1 className="text-white text-xl font-bold">Game Arena</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-gaming-teal font-semibold">
              Points: {currentUser.points}
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gaming-teal/20 rounded-full">
              <Gamepad2 className="h-12 w-12 text-gaming-teal" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to Game Arena, {currentUser.username}!
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            Get ready to play exciting games and win points!
          </p>
          <div className="flex justify-center items-center space-x-4 text-lg">
            <Trophy className="h-5 w-5 text-gaming-teal" />
            <span className="text-white">Your Points:</span>
            <span className="text-gaming-teal font-bold">{currentUser.points}</span>
          </div>
        </div>

        {/* Games Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((gameId) => (
            <div key={gameId} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="aspect-video bg-gradient-to-br from-gaming-teal/20 to-purple-600/20 rounded-lg mb-4 flex items-center justify-center">
                <Gamepad2 className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">
                {gameId === 1 ? 'Blackjack' : `Game ${gameId}`}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {gameId === 1 ? 'Play classic Blackjack and win big!' : 'Exciting gameplay coming soon! Stay tuned for updates.'}
              </p>
              <Button
                onClick={() => handleGameClick(gameId)}
                disabled={gameId !== 1}
                className={gameId === 1 ? "w-full bg-gaming-teal hover:bg-gaming-teal/80" : "w-full bg-gray-700 text-gray-400 cursor-not-allowed"}
              >
                {gameId === 1 ? 'Play Now' : 'Coming Soon'}
              </Button>
            </div>
          ))}
        </div>

        {/* How to Play Section */}
        <div className="mt-12 bg-gray-800/30 rounded-lg p-8 border border-gray-700">
          <h2 className="text-white text-2xl font-bold mb-4">How to Play</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gaming-teal/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gaming-teal font-bold">1</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Choose a Game</h3>
              <p className="text-gray-400 text-sm">
                Select from our variety of exciting games
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gaming-teal/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gaming-teal font-bold">2</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Place Your Bet</h3>
              <p className="text-gray-400 text-sm">
                Use your points to place bets and play
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gaming-teal/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gaming-teal font-bold">3</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Win Points</h3>
              <p className="text-gray-400 text-sm">
                Win games to earn more points and rewards
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
