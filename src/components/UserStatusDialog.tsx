
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, AlertTriangle, UserX, UserCheck } from 'lucide-react';
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

interface UserStatusDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const UserStatusDialog = ({ user, isOpen, onClose, onStatusUpdated }: UserStatusDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (user && isOpen) {
      setSelectedStatus(user.status);
      setShowConfirmation(false);
    }
  }, [user, isOpen]);

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
  };

  const handleUpdateStatus = () => {
    if (!user || selectedStatus === user.status) {
      onClose();
      return;
    }
    setShowConfirmation(true);
  };

  const confirmStatusUpdate = () => {
    if (!user) return;

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = allUsers.findIndex((u: User) => u.id === user.id);
    
    if (userIndex !== -1) {
      allUsers[userIndex].status = selectedStatus;
      
      // Also update current user if they're logged in and being set to offline
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id === user.id) {
        currentUser.status = selectedStatus;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // If user is being set to offline, they should be logged out
        if (selectedStatus === 'offline') {
          localStorage.removeItem('currentUser');
        }
      }
      
      localStorage.setItem('users', JSON.stringify(allUsers));
      
      toast({
        title: "Status Updated Successfully",
        description: `${user.username}'s status has been changed to ${selectedStatus}`,
        variant: selectedStatus === 'offline' ? 'destructive' : 'default',
      });
      
      onStatusUpdated();
    }
    
    setShowConfirmation(false);
    onClose();
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setSelectedStatus(user?.status || 'active');
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gaming-dark border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2 text-gaming-teal" />
            Manage User Status
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
                <span className="text-gray-300 text-sm">Current Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.status === 'active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-gray-300 text-sm font-medium">
                Select New Status
              </label>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="active" className="text-white hover:bg-gray-600">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span>Active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="offline" className="text-white hover:bg-gray-600">
                    <div className="flex items-center space-x-2">
                      <UserX className="h-4 w-4 text-red-500" />
                      <span>Offline</span>
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
                onClick={handleUpdateStatus}
                className="flex-1 bg-gaming-teal hover:bg-gaming-teal/80 text-white"
                disabled={selectedStatus === user.status}
              >
                Update Status
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Confirm Status Change</h3>
              <p className="text-gray-300">
                Are you sure you want to change <span className="font-semibold text-white">{user.username}</span>'s status from{' '}
                <span className={`font-semibold ${user.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                  {user.status}
                </span> to{' '}
                <span className={`font-semibold ${selectedStatus === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedStatus}
                </span>?
              </p>
              {selectedStatus === 'offline' && (
                <p className="text-red-400 text-sm mt-2 font-medium">
                  Warning: This user will be logged out and unable to access their account.
                </p>
              )}
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
                onClick={confirmStatusUpdate}
                className={`flex-1 ${
                  selectedStatus === 'offline' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gaming-teal hover:bg-gaming-teal/80'
                } text-white`}
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

export default UserStatusDialog;
