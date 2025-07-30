import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { User, Eye, EyeOff } from 'lucide-react';
import { SessionManager } from '@/utils/sessionManager';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      const toastId = toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      
      // Auto-close toast after 5 seconds
      setTimeout(() => {
        if (toastId && toastId.dismiss) {
          toastId.dismiss();
        }
      }, 5000);
      return;
    }

    // Check admin credentials
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const admin = users.find((u: any) => u.username === username.trim() && u.password === password && u.role === 'admin');
    
    if (!admin) {
      const toastId = toast({
        title: "Error",
        description: "Invalid admin credentials",
        variant: "destructive",
      });
      
      // Auto-close toast after 5 seconds
      setTimeout(() => {
        if (toastId && toastId.dismiss) {
          toastId.dismiss();
        }
      }, 5000);
      return;
    }

    // Check if admin status is active
    if (admin.status !== 'active') {
      const toastId = toast({
        title: "Admin Access Denied",
        description: "Your admin account has been deactivated. Please contact system administrator.",
        variant: "destructive",
      });
      
      // Auto-close toast after 5 seconds
      setTimeout(() => {
        if (toastId && toastId.dismiss) {
          toastId.dismiss();
        }
      }, 5000);
      return;
    }

    // Set current user using SessionManager
    SessionManager.login(admin, 'admin');

    const toastId = toast({
      title: "Admin Login Successful",
      description: `Welcome back, Admin!`,
    });
    
    // Auto-close toast after 5 seconds
    setTimeout(() => {
      if (toastId && toastId.dismiss) {
        toastId.dismiss();
      }
    }, 5000);
    
    navigate('/admin-dashboard');
  };

  return (
    <div className="min-h-screen bg-gaming-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="gaming-card rounded-lg p-8 border border-gray-700/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-white text-2xl font-bold">Admin Login</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/603076d3-9354-4a55-89b3-ce3f167abbfe.png"
              alt="ECLBET"
              className="h-12 w-auto"
            />
          </div>

          {/* Admin Badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2">
              <User className="h-4 w-4 text-gaming-teal" />
              <span className="text-gaming-teal text-sm font-medium">Administrator Access</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin Username"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12"
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gaming-teal hover:text-gaming-teal/80"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="text-left">
              <button
                type="button"
                className="text-gaming-teal hover:text-gaming-teal/80 text-sm"
              >
                Forgot password?
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full gaming-button font-semibold h-12 rounded-lg"
            >
              Sign in as Admin
            </Button>

            <div className="text-center text-gray-400 text-sm">
              Need an admin account?{' '}
              <button
                type="button"
                onClick={() => navigate('/admin-register')}
                className="gaming-gradient bg-clip-text text-transparent font-semibold hover:opacity-80"
              >
                Register here
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
