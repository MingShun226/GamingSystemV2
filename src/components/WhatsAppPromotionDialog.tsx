
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, ExternalLink } from 'lucide-react';

interface WhatsAppPromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsAppPromotionDialog = ({ isOpen, onClose }: WhatsAppPromotionDialogProps) => {
  const handleWhatsAppRedirect = () => {
    const phoneNumber = '60165334085';
    const message = 'i want promotion';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    onClose();
  };

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
              <MessageCircle className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Contact for Promotion</h2>
            
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <p className="text-gray-300 mb-4">
                You will be redirected to WhatsApp to chat with our promotion team.
              </p>
              
              <div className="text-left space-y-2 text-sm">
                <div className="flex items-center text-gray-400">
                  <span className="font-medium mr-2">Phone:</span>
                  <span className="text-gaming-teal">+60165334085</span>
                </div>
                <div className="flex items-start text-gray-400">
                  <span className="font-medium mr-2">Message:</span>
                  <span className="text-gaming-teal">"i want promotion"</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleWhatsAppRedirect}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppPromotionDialog;
