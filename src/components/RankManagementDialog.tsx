
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, User, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  points: number;
  phone: string;
  referralCode: string;
  referredBy: string | null;
  status: string;
  role: string;
  isVip?: boolean;
  rank?: string;
}

interface RankManagementDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onRankUpdated: () => void;
}

const RankManagementDialog = ({ user, isOpen, onClose, onRankUpdated }: RankManagementDialogProps) => {
  const [selectedRank, setSelectedRank] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (user && isOpen) {
      setSelectedRank(user.isVip ? 'VIP' : 'Normal');
      setShowConfirmation(false);
    }
  }, [user, isOpen]);

  const handleRankChange = (newRank: string) => {
    setSelectedRank(newRank);
  };

  const handleUpdateRank = () => {
    if (!user || selectedRank === (user.isVip ? 'VIP' : 'Normal')) {
      onClose();
      return;
    }
    setShowConfirmation(true);
  };

  const confirmRankUpdate = () => {
    if (!user) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = allUsers.findIndex((u: User) => u.id === user.id);
    
    if (userIndex !== -1) {
      const isVip = selectedRank === 'VIP';
      allUsers[userIndex].isVip = isVip;
      allUsers[userIndex].rank = selectedRank;
      
      // Also update current user if they're logged in
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id === user.id) {
        currentUser.isVip = isVip;
        currentUser.rank = selectedRank;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
      
      localStorage.setItem('users', JSON.stringify(allUsers));
      
      toast({
        title: "Rank Updated Successfully",
        description: `${user.username}'s rank has been changed to ${selectedRank}`,
      });
      
      onRankUpdated();
    }
    
    setShowConfirmation(false);
    onClose();
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setSelectedRank(user?.isVip ? 'VIP' : 'Normal');
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gaming-dark border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Crown className="h-5 w-5 mr-2 text-gaming-teal" />
            Manage User Rank
          </DialogTitle>
        </DialogHeader>
        
        {!showConfirmation ? (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gaming-teal rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{user.username}</h3>
                  <p className="text-gray-400 text-sm">{user.points} points</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Current Rank:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.isVip 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.isVip ? 'VIP' : 'Normal'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-gray-300 text-sm font-medium">
                Select New Rank
              </label>
              <Select value={selectedRank} onValueChange={handleRankChange}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="Normal" className="text-white hover:bg-gray-600">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Normal Customer</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="VIP" className="text-white hover:bg-gray-600">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span>VIP Customer</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRank}
                className="flex-1 bg-gaming-teal hover:bg-gaming-teal/80 text-white"
                disabled={selectedRank === (user.isVip ? 'VIP' : 'Normal')}
              >
                Update Rank
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Confirm Rank Change</h3>
              <p className="text-gray-300">
                Are you sure you want to change <span className="font-semibold text-white">{user.username}</span>'s rank from{' '}
                <span className={`font-semibold ${user.isVip ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {user.isVip ? 'VIP' : 'Normal'}
                </span> to{' '}
                <span className={`font-semibold ${selectedRank === 'VIP' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {selectedRank}
                </span>?
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={cancelConfirmation}
                variant="outline"
                className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRankUpdate}
                className="flex-1 bg-gaming-teal hover:bg-gaming-teal/80 text-white"
              >
                Confirm Change
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RankManagementDialog;
