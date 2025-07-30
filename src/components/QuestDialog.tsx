
import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Ticket, Target, Gamepad2, Trophy } from 'lucide-react';

interface QuestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuestDialog = ({ isOpen, onClose }: QuestDialogProps) => {
  const questItems = [
    {
      title: "Number Game Ticket",
      subtitle: "Ticket 0",
      badge: "DAILY",
      icon: Ticket,
      badgeColor: "bg-red-500"
    },
    {
      title: "UEFA Main Prediction Event",
      subtitle: "Complete 0 / 11",
      badge: "SPECIAL",
      icon: Target,
      badgeColor: "bg-red-500"
    },
    {
      title: "Esports Free Bonus",
      subtitle: "Complete MYR0 / MYR7400",
      badge: "WEEKLY",
      icon: Gamepad2,
      badgeColor: "bg-red-500"
    },
    {
      title: "Sports Free Bonus",
      subtitle: "Complete MYR0 / MYR7400",
      badge: "WEEKLY",
      icon: Trophy,
      badgeColor: "bg-red-500"
    },
    {
      title: "Live Casino Free Bonus",
      subtitle: "Complete MYR0 / MYR9900",
      badge: "WEEKLY",
      icon: Target,
      badgeColor: "bg-red-500"
    },
    {
      title: "Slots game Free Bonus",
      subtitle: "Complete MYR0 / MYR7600",
      badge: "WEEKLY",
      icon: Gamepad2,
      badgeColor: "bg-red-500"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gaming-darker border-gray-700/50 text-white p-0 overflow-hidden">
        <div className="relative">
          <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Quest</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questItems.map((item, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <item.icon className="h-6 w-6 text-gray-300" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-medium">{item.title}</h3>
                        <span className={`${item.badgeColor} text-white text-xs px-2 py-1 rounded`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{item.subtitle}</p>
                    </div>
                  </div>
                  <Button 
                    className="bg-gaming-orange hover:bg-gaming-orange/80 text-white px-6"
                    onClick={() => {}}
                  >
                    Go
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestDialog;
