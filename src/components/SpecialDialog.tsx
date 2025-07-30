
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Crown, Gift } from 'lucide-react';
import VipNotificationDialog from './VipNotificationDialog';
import WhatsAppPromotionDialog from './WhatsAppPromotionDialog';

interface SpecialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPlay: () => void;
}

const SpecialDialog = ({ isOpen, onClose, onStartPlay }: SpecialDialogProps) => {
  const [isVipDialogOpen, setIsVipDialogOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);

  const specialCategories = [
    { name: "VIP", icon: Crown, onClick: () => setIsVipDialogOpen(true) },
    { name: "Promotion", icon: Gift, onClick: () => setIsWhatsAppDialogOpen(true) }
  ];

  const handleStartPlay = () => {
    onStartPlay();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-gaming-darker border-gray-700/50 text-white p-0 overflow-hidden">
          <div className="relative">
            <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 text-white">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>

            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Special</h2>
              
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  {specialCategories.map((category, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className="bg-gray-700/50 rounded-lg p-4 mb-2 hover:bg-gray-700/70 transition-colors cursor-pointer"
                        onClick={category.onClick}
                      >
                        <category.icon className="h-8 w-8 text-gray-300 mx-auto" />
                      </div>
                      <span className="text-gray-300 text-sm">{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 mb-4">That year, she showed us the world</p>
                <Button 
                  className="bg-gaming-orange hover:bg-gaming-orange/80 text-white px-8"
                  onClick={handleStartPlay}
                >
                  开启游戏 Start Playing
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIP Notification Dialog */}
      <VipNotificationDialog 
        isOpen={isVipDialogOpen}
        onClose={() => setIsVipDialogOpen(false)}
      />

      {/* WhatsApp Promotion Dialog */}
      <WhatsAppPromotionDialog 
        isOpen={isWhatsAppDialogOpen}
        onClose={() => setIsWhatsAppDialogOpen(false)}
      />
    </>
  );
};

export default SpecialDialog;
