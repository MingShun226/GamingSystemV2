
import React from 'react';
import { 
  Home, 
  Trophy, 
  Gamepad2, 
  Star,
  Gift,
  Phone,
  Mail,
  UserCircle,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '@/utils/sessionManager';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const navigate = useNavigate();

  // Check if a user is currently logged in
  const currentUser = SessionManager.getCurrentUser();
  const isUserLoggedIn = currentUser?.id && currentUser.role === 'user';

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Trophy, label: 'Live Chat', href: '/chat' },
    { icon: Gamepad2, label: 'Facebook Messenger', href: '/facebook' },
    { icon: Star, label: 'Telegram', href: '/telegram' },
    { icon: Gift, label: 'Twitter', href: '/twitter' },
  ];

  const contactItems = [
    { icon: Phone, label: '+603-2770 2769 (12pm - 10pm)', href: 'tel:+60327702769' },
    { icon: Mail, label: 'help@eclbet.com', href: 'mailto:help@eclbet.com' },
  ];

  const regionItems = [
    { label: 'English', flag: '🇺🇸', href: '/en', active: true },
    { label: '中文', flag: '🇨🇳', href: '/zh' },
    { label: 'Tiếng Việt', flag: '🇻🇳', href: '/vi' },
    { label: '한국어', flag: '🇰🇷', href: '/ko' },
    { label: 'ภาษาไทย', flag: '🇹🇭', href: '/th' },
  ];

  // Disabled click handler that prevents any action for menu items
  const handleDisabledClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handler for admin access button
  const handleAdminAccess = () => {
    if (isUserLoggedIn) return; // Prevent access if user is logged in
    navigate('/admin-login');
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-gaming-darker border-r border-gray-700/50 transition-all duration-300 z-40 flex flex-col",
      isCollapsed ? "w-12" : "w-56"
    )}>
      {/* Logo Section */}
      <div className="p-2 border-b border-gray-700/50">
        {isCollapsed ? (
          <div className="w-8 h-8 flex items-center justify-center">
            <img 
              src="/lovable-uploads/603076d3-9354-4a55-89b3-ce3f167abbfe.png" 
              alt="ECLBET"
              className="w-6 h-6 object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/603076d3-9354-4a55-89b3-ce3f167abbfe.png" 
              alt="ECLBET"
              className="h-8 w-auto"
            />
          </div>
        )}
      </div>

      {/* Menu Section - flex-1 to take available space */}
      <div className="flex-1 py-2">
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Menu</span>
          </div>
        )}
        <nav className="space-y-1 px-2">
          {menuItems.map((item, index) => (
            <div
              key={item.label}
              onClick={handleDisabledClick}
              className={cn(
                "flex items-center px-2 py-2 rounded text-sm font-medium transition-colors cursor-pointer",
                index === 0
                  ? "bg-gaming-teal text-white" 
                  : "text-gray-300 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isCollapsed ? "mx-auto" : "mr-3")} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Contact Section */}
        {!isCollapsed && (
          <div className="mt-6 px-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Contact
            </h3>
            <div className="space-y-1">
              {contactItems.map((item) => (
                <div
                  key={item.label}
                  onClick={handleDisabledClick}
                  className="flex items-center px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  <item.icon className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Region Section */}
        {!isCollapsed && (
          <div className="mt-4 px-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Region
            </h3>
            <div className="space-y-1">
              {regionItems.map((item) => (
                <div
                  key={item.label}
                  onClick={handleDisabledClick}
                  className={cn(
                    "flex items-center px-2 py-1 text-xs transition-colors cursor-pointer",
                    item.active ? "text-gaming-teal" : "text-gray-300 hover:text-white"
                  )}
                >
                  <span className="mr-2 text-sm">{item.flag}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin Access Button - now at the bottom */}
      <div className="p-2 border-t border-gray-700/50">
        <button
          onClick={handleAdminAccess}
          disabled={isUserLoggedIn}
          className={cn(
            "flex items-center w-full px-2 py-2 rounded text-sm font-medium transition-colors",
            isUserLoggedIn 
              ? "bg-gray-600/20 text-gray-500 cursor-not-allowed border border-gray-600/30" 
              : "bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 border border-red-600/50"
          )}
        >
          <Shield className={cn("h-4 w-4 flex-shrink-0", isCollapsed ? "mx-auto" : "mr-3")} />
          {!isCollapsed && (
            <span className="truncate">
              {isUserLoggedIn ? "Access Disabled" : "Admin Access"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
