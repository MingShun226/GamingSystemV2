
import React from 'react';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VipBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

const VipBadge = ({ className = '', size = 'sm' }: VipBadgeProps) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';
  
  return (
    <Badge 
      className={`bg-gradient-to-r from-yellow-600 to-yellow-500 text-white border-yellow-400 ${sizeClasses} ${className}`}
    >
      <Crown className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
      VIP
    </Badge>
  );
};

export default VipBadge;
