
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateReferralLink } from '@/lib/supabase';

interface ReferralCodeWidgetProps {
  userId: string;
  username: string;
  referralCode: string;
}

const ReferralCodeWidget = ({ userId, username, referralCode }: ReferralCodeWidgetProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const referralLink = generateReferralLink(referralCode);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6">
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
        <Share2 className="h-5 w-5 mr-2 text-gaming-teal" />
        Your Referral Code
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Referral Code</label>
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="bg-gray-700 border-gray-600 text-white font-mono"
            />
            <Button
              onClick={() => copyToClipboard(referralCode, 'Referral code')}
              variant="outline"
              size="sm"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2">Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-gray-700 border-gray-600 text-white text-sm"
            />
            <Button
              onClick={() => copyToClipboard(referralLink, 'Referral link')}
              variant="outline"
              size="sm"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gaming-teal/20 rounded-lg border border-gaming-teal/30">
          <h4 className="text-gaming-teal font-medium mb-2">Referral Benefits:</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Get 50 points when someone registers with your code</li>
            <li>• Earn 10% commission on every top-up they make</li>
            <li>• Track all your referral earnings in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReferralCodeWidget;
