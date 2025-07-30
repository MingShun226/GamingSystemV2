
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Crown, Star } from 'lucide-react';

interface VipNotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const VipNotificationDialog = ({ isOpen, onClose }: VipNotificationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gaming-darker border-gray-700/50 text-white p-0 overflow-hidden">
        <div className="relative">
          <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <div className="p-6 text-center">
            <div className="mb-4">
              <Crown className="h-16 w-16 text-yellow-500 mx-auto" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-yellow-500">VIP Membership</h2>
            
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-3">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-lg font-semibold">Become a VIP Customer</span>
                <Star className="h-5 w-5 text-yellow-500 ml-2" />
              </div>
              
              <p className="text-gray-300 mb-4">
                Top up <span className="text-gaming-teal font-bold">1000 points or more</span> to become a VIP customer and enjoy exclusive benefits!
              </p>
              
              <div className="text-left space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>VIP Badge displayed on your account</span>
                </div>
                <div className="flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>Priority customer support</span>
                </div>
                <div className="flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>Exclusive VIP promotions</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-gaming-teal hover:bg-gaming-teal/80 text-white"
              onClick={onClose}
            >
              Got It!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VipNotificationDialog;
