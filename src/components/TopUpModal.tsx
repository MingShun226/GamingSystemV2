
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CreditCard, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processTopUp } from '@/lib/supabase';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  onTopUpSuccess: (newPoints: number) => void;
}

const TopUpModal = ({ isOpen, onClose, currentPoints, onTopUpSuccess }: TopUpModalProps) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const predefinedAmounts = [100, 500, 1000, 2000, 5000];

  const handleTopUp = async () => {
    const topUpAmount = parseInt(amount);
    
    if (!topUpAmount || topUpAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (topUpAmount < 10) {
      toast({
        title: "Error",
        description: "Minimum top-up amount is 10 points",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      if (!currentUser.id) {
        toast({
          title: "Error",
          description: "User not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Process top-up with Supabase (includes referral commission processing)
      const result = await processTopUp(currentUser.id, topUpAmount);
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to process top-up. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update current user points in localStorage
      const newPoints = currentUser.points + topUpAmount;
      const updatedCurrentUser = { 
        ...currentUser, 
        points: newPoints,
        // Auto-promote to VIP if points >= 1000
        is_vip: newPoints >= 1000 ? true : currentUser.is_vip,
        rank: newPoints >= 1000 ? 'VIP' : currentUser.rank
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
      
      onTopUpSuccess(newPoints);
      
      toast({
        title: "Top Up Successful",
        description: `Successfully added ${topUpAmount} points to your account${newPoints >= 1000 && !currentUser.is_vip ? '. Congratulations! You are now VIP!' : ''}`,
      });
      
      setAmount('');
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process top-up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gaming-dark border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-gaming-teal" />
              Top Up Points
            </DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-gray-400 text-sm">
            Add points to your account to continue playing. Minimum top-up amount is 10 points.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Current Balance</p>
            <p className="text-gaming-teal text-2xl font-bold">{currentPoints} Points</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Enter Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Minimum 10 points"
                className="bg-gray-700 border-gray-600 text-white"
                min="10"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-2">Quick Select</label>
              <div className="grid grid-cols-3 gap-2">
                {predefinedAmounts.map((preAmount) => (
                  <Button
                    key={preAmount}
                    variant="outline"
                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                    onClick={() => setAmount(preAmount.toString())}
                  >
                    {preAmount}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopUp}
              disabled={isProcessing}
              className="flex-1 bg-gaming-teal hover:bg-gaming-teal/80 text-white"
            >
              {isProcessing ? 'Processing...' : 'Top Up'}
            </Button>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>Secure payment processing</p>
            <p>Points will be added instantly to your account</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpModal;
