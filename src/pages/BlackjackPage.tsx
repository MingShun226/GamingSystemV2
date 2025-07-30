import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Info } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TopUpModal from '@/components/TopUpModal';
import { processGameTransaction } from '@/lib/supabase';
import { SessionManager } from '@/utils/sessionManager';

interface Card {
  suit: string;
  value: string;
  numValue: number;
}

interface Seat {
  id: number;
  bet: number;
  cards: Card[];
  score: number;
  isActive: boolean;
  canDoubleDown: boolean;
  hasDoubledDown: boolean;
  result: string;
}

const BlackjackPage = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [seats, setSeats] = useState<Seat[]>([
    { id: 1, bet: 10, cards: [], score: 0, isActive: false, canDoubleDown: false, hasDoubledDown: false, result: '' },
    { id: 2, bet: 10, cards: [], score: 0, isActive: false, canDoubleDown: false, hasDoubledDown: false, result: '' },
    { id: 3, bet: 10, cards: [], score: 0, isActive: false, canDoubleDown: false, hasDoubledDown: false, result: '' }
  ]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [currentSeatIndex, setCurrentSeatIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = SessionManager.getCurrentUser();
    if (!user?.id || user.role !== 'user') {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  const createDeck = (): Card[] => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck: Card[] = [];

    suits.forEach(suit => {
      values.forEach(value => {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        newDeck.push({ suit, value, numValue });
      });
    });

    return shuffleDeck(newDeck);
  };

  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const calculateScore = (cards: Card[]): number => {
    let score = 0;
    let aces = 0;

    cards.forEach(card => {
      if (card.value === 'A') {
        aces++;
        score += 11;
      } else {
        score += card.numValue;
      }
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  };

  const dealCard = (currentDeck: Card[]): { card: Card; newDeck: Card[] } => {
    const newDeck = [...currentDeck];
    const card = newDeck.pop()!;
    return { card, newDeck };
  };

  const updateSeatBet = (seatId: number, newBet: number) => {
    if (gameState !== 'betting') return;
    
    setSeats(prev => prev.map(seat => 
      seat.id === seatId 
        ? { ...seat, bet: Math.max(1, Math.min(currentUser.points, newBet)) }
        : seat
    ));
  };

  const toggleSeatActive = (seatId: number) => {
    if (gameState !== 'betting') return;
    
    setSeats(prev => prev.map(seat => 
      seat.id === seatId 
        ? { ...seat, isActive: !seat.isActive }
        : seat
    ));
  };

  const startGame = () => {
    const activeSeats = seats.filter(seat => seat.isActive);
    if (activeSeats.length === 0) {
      toast({
        title: "No Active Seats",
        description: "Please activate at least one seat to play",
        variant: "destructive"
      });
      return;
    }

    const totalBet = activeSeats.reduce((sum, seat) => sum + seat.bet, 0);
    if (totalBet > currentUser.points) {
      setShowTopUpModal(true);
      return;
    }

    const newDeck = createDeck();
    let workingDeck = newDeck;

    // Reset seats and deal initial cards
    const updatedSeats = seats.map(seat => {
      if (!seat.isActive) {
        return { ...seat, cards: [], score: 0, result: '', canDoubleDown: false, hasDoubledDown: false };
      }

      const seatCards: Card[] = [];
      // Deal 2 cards to active seat
      for (let i = 0; i < 2; i++) {
        const { card, newDeck } = dealCard(workingDeck);
        seatCards.push(card);
        workingDeck = newDeck;
      }

      const initialScore = calculateScore(seatCards);
      return {
        ...seat,
        cards: seatCards,
        score: initialScore,
        result: '',
        canDoubleDown: [9, 10, 11].includes(initialScore),
        hasDoubledDown: false
      };
    });

    // Deal dealer cards
    const dealerHand: Card[] = [];
    for (let i = 0; i < 2; i++) {
      const { card, newDeck } = dealCard(workingDeck);
      dealerHand.push(card);
      workingDeck = newDeck;
    }

    setDeck(workingDeck);
    setSeats(updatedSeats);
    setDealerCards(dealerHand);
    setDealerScore(calculateScore(dealerHand));
    setGameState('playing');
    setCurrentSeatIndex(0);

    // Find first active seat
    const firstActiveSeatIndex = updatedSeats.findIndex(seat => seat.isActive);
    setCurrentSeatIndex(firstActiveSeatIndex);

    // Check for blackjacks
    const hasBlackjacks = updatedSeats.some(seat => seat.isActive && seat.score === 21);
    if (hasBlackjacks) {
      setTimeout(() => finishGame(updatedSeats, dealerHand), 500);
    }
  };

  const getCurrentSeat = () => {
    const activeSeats = seats.filter(seat => seat.isActive);
    if (currentSeatIndex >= activeSeats.length) return null;
    return activeSeats[currentSeatIndex];
  };

  const moveToNextSeat = () => {
    const activeSeats = seats.filter(seat => seat.isActive);
    if (currentSeatIndex + 1 >= activeSeats.length) {
      // All seats played, move to dealer
      setTimeout(() => dealerPlay(), 1000);
    } else {
      setCurrentSeatIndex(currentSeatIndex + 1);
    }
  };

  const hit = () => {
    const currentSeat = getCurrentSeat();
    if (!currentSeat) return;

    const { card, newDeck } = dealCard(deck);
    const newCards = [...currentSeat.cards, card];
    const newScore = calculateScore(newCards);
    
    setSeats(prev => prev.map(seat => 
      seat.id === currentSeat.id 
        ? { ...seat, cards: newCards, score: newScore, canDoubleDown: false }
        : seat
    ));
    setDeck(newDeck);

    if (newScore > 21) {
      setTimeout(moveToNextSeat, 500);
    }
  };

  const doubleDown = () => {
    const currentSeat = getCurrentSeat();
    if (!currentSeat) return;

    if (currentSeat.bet * 2 > currentUser.points) {
      setShowTopUpModal(true);
      return;
    }

    const { card, newDeck } = dealCard(deck);
    const newCards = [...currentSeat.cards, card];
    const newScore = calculateScore(newCards);
    
    setSeats(prev => prev.map(seat => 
      seat.id === currentSeat.id 
        ? { ...seat, cards: newCards, score: newScore, bet: seat.bet * 2, canDoubleDown: false, hasDoubledDown: true }
        : seat
    ));
    setDeck(newDeck);

    setTimeout(moveToNextSeat, 1000);
  };

  const stand = () => {
    moveToNextSeat();
  };

  const dealerPlay = () => {
    let newDealerCards = [...dealerCards];
    let workingDeck = [...deck];
    
    // Dealer draws cards until score is 17 or higher
    while (calculateScore(newDealerCards) < 17) {
      const { card, newDeck } = dealCard(workingDeck);
      newDealerCards.push(card);
      workingDeck = newDeck;
    }

    setDealerCards(newDealerCards);
    setDealerScore(calculateScore(newDealerCards));
    setDeck(workingDeck);
    
    setTimeout(() => finishGame(seats, newDealerCards), 500);
  };

  const finishGame = (finalSeats: Seat[], finalDealerCards: Card[]) => {
    const finalDealerScore = calculateScore(finalDealerCards);
    let totalWinAmount = 0;

    const updatedSeats = finalSeats.map(seat => {
      if (!seat.isActive) return seat;

      let result = '';
      let winAmount = 0;

      // Check for 5-Card Charlie
      const isFiveCardCharlie = seat.cards.length >= 5 && seat.score <= 21;

      if (seat.score > 21) {
        result = 'Bust';
        winAmount = -seat.bet;
      } else if (isFiveCardCharlie) {
        result = '5-Card Charlie!';
        winAmount = seat.bet * 2;
      } else if (finalDealerScore > 21) {
        result = 'Win (Dealer Bust)';
        winAmount = seat.bet;
      } else if (seat.score === 21 && seat.cards.length === 2 && !seat.hasDoubledDown) {
        result = 'Blackjack!';
        winAmount = seat.bet * 1.5;
      } else if (seat.score === finalDealerScore) {
        result = 'Push';
        winAmount = 0;
      } else if (seat.score > finalDealerScore) {
        result = 'Win';
        winAmount = seat.bet;
      } else {
        result = 'Lose';
        winAmount = -seat.bet;
      }

      totalWinAmount += winAmount;
      return { ...seat, result };
    });

    setSeats(updatedSeats);
    setGameState('finished');

    // Process game transaction with Supabase
    const processTransaction = async () => {
      try {
        const totalBetAmount = activeSeatsBets.reduce((sum, bet) => sum + bet, 0);
        const gameResult = totalWinAmount > 0 ? 'win' : totalWinAmount < 0 ? 'lose' : 'draw';
        
        const gameData = {
          seats: updatedSeats.map(seat => ({
            id: seat.id,
            bet: seat.bet,
            result: seat.result,
            cards: seat.cards,
            score: seat.score
          })),
          dealerCards,
          dealerScore,
          totalBetAmount,
          totalWinAmount
        };

        const result = await processGameTransaction(
          currentUser.id,
          'blackjack',
          totalBetAmount,
          totalWinAmount,
          gameResult,
          gameData
        );

        if (result.success) {
          // Update local user points
          const newPoints = currentUser.points + totalWinAmount;
          const updatedUser = { ...currentUser, points: newPoints };
          setCurrentUser(updatedUser);
          SessionManager.updateCurrentUser(updatedUser);
        } else {
          console.error('Failed to process game transaction:', result.error);
          toast({
            title: "Warning",
            description: "Game transaction not recorded properly",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error processing game transaction:', error);
      }
    };

    // Process the transaction
    processTransaction();

    if (totalWinAmount > 0) {
      toast({
        title: "You Won!",
        description: `+${totalWinAmount} points total`,
      });
    } else if (totalWinAmount < 0) {
      toast({
        title: "You Lost",
        description: `${totalWinAmount} points total`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Break Even!",
        description: "No points gained or lost",
      });
    }
  };

  const resetGame = () => {
    setGameState('betting');
    setSeats(prev => prev.map(seat => ({
      ...seat,
      cards: [],
      score: 0,
      result: '',
      canDoubleDown: false,
      hasDoubledDown: false,
      isActive: false
    })));
    setDealerCards([]);
    setDealerScore(0);
    setDeck([]);
    setCurrentSeatIndex(0);
  };

  const handleExit = async () => {
    if (gameState === 'playing') {
      const activeSeats = seats.filter(seat => seat.isActive);
      const totalBet = activeSeats.reduce((sum, seat) => sum + seat.bet, 0);
      
      // Process abandonment as a loss transaction
      try {
        const gameData = {
          reason: 'abandoned',
          seats: activeSeats.map(seat => ({
            id: seat.id,
            bet: seat.bet,
            cards: seat.cards,
            score: seat.score
          })),
          dealerCards,
          dealerScore
        };

        const result = await processGameTransaction(
          currentUser.id,
          'blackjack',
          totalBet,
          -totalBet, // Full loss
          'lose',
          gameData
        );

        if (result.success) {
          // Update local user points
          const lostPoints = currentUser.points - totalBet;
          const updatedUser = { ...currentUser, points: lostPoints };
          setCurrentUser(updatedUser);
          SessionManager.updateCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error('Error processing abandonment transaction:', error);
      }

      toast({
        title: "Game Abandoned",
        description: `You lost ${totalBet} points for leaving mid-game`,
        variant: "destructive"
      });
    }
    navigate('/game');
  };

  const renderCard = (card: Card, hidden: boolean = false) => {
    if (hidden) {
      return (
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 border-2 border-blue-700 rounded-xl w-20 h-28 shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
          <div className="w-12 h-16 bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg border border-blue-500 flex items-center justify-center">
            <div className="w-8 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded border border-blue-400"></div>
          </div>
        </div>
      );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';
    
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 rounded-xl w-20 h-28 shadow-2xl flex flex-col justify-between p-3 transform hover:scale-105 transition-transform">
        <div className={`text-sm font-bold ${isRed ? 'text-red-600' : 'text-black'} leading-none`}>
          {card.value}
        </div>
        <div className={`text-3xl ${isRed ? 'text-red-600' : 'text-black'} text-center leading-none`}>
          {card.suit}
        </div>
        <div className={`text-sm font-bold ${isRed ? 'text-red-600' : 'text-black'} rotate-180 self-end leading-none`}>
          {card.value}
        </div>
      </div>
    );
  };

  if (!currentUser) return null;

  const currentSeat = getCurrentSeat();
  const activeSeats = seats.filter(seat => seat.isActive);
  const totalActiveBet = activeSeats.reduce((sum, seat) => sum + seat.bet, 0);

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(/lovable-uploads/f3ec990d-5a9f-47ba-a2f3-79e2af98f9c4.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay to maintain readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Header */}
      <header className="relative bg-black/90 backdrop-blur-md border-b border-yellow-400/50 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-400/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Games
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gaming-dark border-yellow-400/30">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-yellow-300">Leave Game?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    {gameState === 'playing' 
                      ? `If you leave now, you will lose your total bet of ${totalActiveBet} points. Are you sure?`
                      : 'Are you sure you want to leave the game?'
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600">
                    Stay
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleExit} className="bg-red-600 hover:bg-red-700">
                    Leave Game
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <h1 className="text-yellow-300 text-2xl font-bold tracking-wide">BLACKJACK</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 px-4 py-2 rounded-lg border border-yellow-400/50 backdrop-blur-sm">
              <span className="text-yellow-300 font-semibold">Balance: </span>
              <span className="text-yellow-100 font-bold">{currentUser.points}</span>
            </div>
            
            {/* Rules Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-400/50 backdrop-blur-sm">
                  <Info className="h-4 w-4 mr-2" />
                  Rules
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/30 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-yellow-300 text-xl font-bold text-center">BLACKJACK RULES</DialogTitle>
                </DialogHeader>
                <div className="text-gray-300 space-y-3 text-sm">
                  <div className="bg-green-900/30 p-3 rounded-lg border border-green-400/30">
                    <div className="text-green-300 font-semibold mb-2">SPECIAL FEATURES</div>
                    <div className="space-y-1">
                      <div>• Multiple seats available - place bets to activate seats</div>
                      <div>• Double Down available on 9, 10, or 11 (doubles bet, one card only)</div>
                      <div>• 5-Card Charlie: 5+ cards without busting pays double</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-400/30">
                    <div className="text-blue-300 font-semibold mb-2">BASIC RULES</div>
                    <div className="space-y-1">
                      <div>• Blackjack pays 3:2</div>
                      <div>• Dealer stands on 17</div>
                      <div>• Get as close to 21 without going over</div>
                      <div>• Face cards are worth 10, Aces are 1 or 11</div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="relative p-6">
        {/* Table edge with casino-style border */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-green-800/40 to-green-900/60 rounded-t-[3rem] border-4 border-yellow-600/60 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            {/* Table edge highlight */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-yellow-500/30 to-transparent rounded-t-[2.5rem]"></div>
            
            <div className="p-8 pt-12">
              {/* Dealer Section */}
              <div className="text-center mb-12">
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-3 border-2 border-yellow-400/60 inline-block mb-6 shadow-xl">
                  <h2 className="text-yellow-300 text-xl font-bold tracking-wider">DEALER</h2>
                </div>
                
                {/* Dealer card area with felt background */}
                <div className="bg-green-900/30 rounded-xl p-4 mb-4 border border-green-600/40">
                  <div className="flex space-x-3 justify-center mb-4">
                    {dealerCards.map((card, index) => (
                      <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                        {renderCard(card, gameState === 'playing' && index === 1)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-black/80 backdrop-blur-sm rounded-xl px-6 py-3 border-2 border-yellow-400/60 inline-block shadow-lg">
                  <div className="text-yellow-100 font-bold text-2xl">
                    {gameState === 'playing' ? (dealerCards.length > 0 ? dealerCards[0].numValue : 0) : dealerScore}
                  </div>
                </div>
              </div>

              {/* Player Seats - arranged in arc */}
              <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                {seats.map((seat, index) => (
                  <div 
                    key={seat.id} 
                    className={`text-center p-6 rounded-2xl border-3 transition-all duration-300 ${
                      seat.isActive 
                        ? 'bg-gradient-to-br from-green-700/40 to-green-800/60 border-green-400/80 shadow-2xl' 
                        : 'bg-gradient-to-br from-gray-800/30 to-gray-900/40 border-gray-600/60 shadow-lg'
                    } ${
                      gameState === 'playing' && currentSeat?.id === seat.id 
                        ? 'ring-4 ring-yellow-400 ring-opacity-80' 
                        : ''
                    } backdrop-blur-sm`}
                  >
                    {/* Seat number with casino-style badge */}
                    <div className="mb-6">
                      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold px-4 py-2 rounded-full inline-block text-lg shadow-lg">
                        SEAT {seat.id}
                      </div>
                      
                      {gameState === 'betting' && (
                        <div className="space-y-4 mt-4">
                          <div className="flex items-center justify-center space-x-3">
                            <Button
                              onClick={() => updateSeatBet(seat.id, seat.bet - 5)}
                              className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg shadow-lg border border-red-400/50"
                            >
                              -5
                            </Button>
                            <div className="bg-black/80 text-yellow-100 border-2 border-yellow-400/60 rounded-xl px-4 py-2 min-w-20 text-center font-bold text-lg shadow-lg">
                              ${seat.bet}
                            </div>
                            <Button
                              onClick={() => updateSeatBet(seat.id, seat.bet + 5)}
                              className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg shadow-lg border border-green-400/50"
                            >
                              +5
                            </Button>
                          </div>
                          <Button
                            onClick={() => toggleSeatActive(seat.id)}
                            className={`w-full font-bold py-3 rounded-xl shadow-lg border-2 transition-all ${
                              seat.isActive 
                                ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-red-400/50' 
                                : 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-green-400/50'
                            }`}
                          >
                            {seat.isActive ? 'Remove Bet' : 'Place Bet'}
                          </Button>
                        </div>
                      )}

                      {(gameState === 'playing' || gameState === 'finished') && seat.isActive && (
                        <>
                          {/* Card area with felt background */}
                          <div className="bg-green-900/30 rounded-xl p-4 mt-4 border border-green-600/40">
                            <div className="flex space-x-2 justify-center mb-3 min-h-32">
                              {seat.cards.map((card, cardIndex) => (
                                <div key={cardIndex} className="animate-fade-in" style={{ animationDelay: `${cardIndex * 0.2}s` }}>
                                  {renderCard(card)}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-black/80 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-yellow-400/60 inline-block mt-3 shadow-lg">
                            <div className="text-yellow-100 font-bold text-xl">{seat.score}</div>
                          </div>
                          
                          {seat.result && (
                            <div className={`text-sm font-bold px-3 py-2 rounded-lg mt-2 border-2 ${
                              seat.result.includes('Win') || seat.result.includes('Blackjack') || seat.result.includes('Charlie')
                                ? 'text-green-300 bg-green-800/40 border-green-400/60' 
                                : seat.result === 'Push' 
                                ? 'text-yellow-300 bg-yellow-800/40 border-yellow-400/60'
                                : 'text-red-300 bg-red-800/40 border-red-400/60'
                            } shadow-lg`}>
                              {seat.result}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Game Controls */}
              <div className="text-center space-y-8">
                {gameState === 'betting' && (
                  <Button
                    onClick={startGame}
                    disabled={activeSeats.length === 0}
                    className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black font-bold px-16 py-6 rounded-2xl text-2xl shadow-2xl border-2 border-yellow-400 transform hover:scale-105 transition-all"
                  >
                    DEAL CARDS
                  </Button>
                )}

                {gameState === 'playing' && currentSeat && (
                  <div className="space-y-6">
                    <div className="text-yellow-300 text-xl font-semibold bg-black/60 px-6 py-3 rounded-xl border border-yellow-400/50 inline-block">
                      Playing Seat {currentSeat.id} (${currentSeat.bet})
                    </div>
                    <div className="flex gap-6 justify-center">
                      <Button
                        onClick={hit}
                        disabled={currentSeat.score >= 21}
                        className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-10 py-4 rounded-xl text-xl shadow-xl border-2 border-green-400/50"
                      >
                        HIT
                      </Button>
                      <Button
                        onClick={stand}
                        className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-10 py-4 rounded-xl text-xl shadow-xl border-2 border-red-400/50"
                      >
                        STAND
                      </Button>
                      {currentSeat.canDoubleDown && (
                        <Button
                          onClick={doubleDown}
                          className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-10 py-4 rounded-xl text-xl shadow-xl border-2 border-blue-400/50"
                        >
                          DOUBLE DOWN
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {gameState === 'finished' && (
                  <Button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold px-16 py-6 rounded-2xl text-2xl shadow-2xl border-2 border-green-400 transform hover:scale-105 transition-all"
                  >
                    PLAY AGAIN
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentPoints={currentUser.points}
        onTopUpSuccess={(newPoints) => setCurrentUser({ ...currentUser, points: newPoints })}
      />
    </div>
  );
};

export default BlackjackPage;
