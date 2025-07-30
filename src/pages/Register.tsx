
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { registerUser, authenticateUser } from '@/lib/supabase';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if there's a referral code in URL
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
    }
  }, [searchParams]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      const toastId = toast({
        title: "Error",
        description: "Please fill in all required fields",
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

    if (password !== confirmPassword) {
      const toastId = toast({
        title: "Error",
        description: "Passwords do not match",
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

    try {
      const { data, error } = await registerUser(
        username.trim(), 
        password, 
        phone.trim() || undefined,
        referralCode.trim() || undefined
      );

      if (error) {
        const toastId = toast({
          title: "Registration Failed",
          description: error.message,
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

      if (data && data.length > 0) {
        // Auto-login the user after successful registration
        try {
          const { data: loginData, error: loginError } = await authenticateUser(username.trim(), password);
          
          if (loginError || !loginData || loginData.length === 0) {
            // If auto-login fails, show success message and redirect to login
            const toastId = toast({
              title: "Registration Successful",
              description: "Account created! Please login to continue.",
            });
            
            setTimeout(() => {
              if (toastId && toastId.dismiss) {
                toastId.dismiss();
              }
            }, 5000);
            
            navigate('/login');
            return;
          }

          // Auto-login successful - store user data and redirect to dashboard
          const user = loginData[0];
          
          // Check if user is active
          if (!user.is_active) {
            const toastId = toast({
              title: "Account Access Denied",
              description: "Your account has been deactivated. Please contact support for assistance.",
              variant: "destructive",
            });
            
            setTimeout(() => {
              if (toastId && toastId.dismiss) {
                toastId.dismiss();
              }
            }, 5000);
            navigate('/login');
            return;
          }

          // Store user data in localStorage for session management
          const userWithRole = { ...user, role: 'user' };
          localStorage.setItem('currentUser', JSON.stringify(userWithRole));
          
          const toastId = toast({
            title: "Welcome to ECLBET!",
            description: referralCode.trim() 
              ? `Account created successfully! Your referrer has received 50 bonus points. Welcome, ${user.username}!`
              : `Account created successfully! Welcome, ${user.username}!`,
          });
          
          setTimeout(() => {
            if (toastId && toastId.dismiss) {
              toastId.dismiss();
            }
          }, 5000);
          
          // Redirect to user dashboard
          navigate('/user-dashboard');
          
        } catch (autoLoginError) {
          // If auto-login fails, redirect to login page
          const toastId = toast({
            title: "Registration Successful",
            description: "Account created! Please login to continue.",
          });
          
          setTimeout(() => {
            if (toastId && toastId.dismiss) {
              toastId.dismiss();
            }
          }, 5000);
          
          navigate('/login');
        }
      }
    } catch (error) {
      const toastId = toast({
        title: "Registration Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Auto-close toast after 5 seconds
      setTimeout(() => {
        if (toastId && toastId.dismiss) {
          toastId.dismiss();
        }
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gaming-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="gaming-card rounded-lg p-8 border border-gray-700/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-white text-2xl font-bold">Sign up</h1>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12"
                required
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gaming-teal hover:text-gaming-teal/80"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gaming-teal hover:text-gaming-teal/80"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12"
              />
            </div>

            <div>
              <Input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Referral code (optional)"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12"
              />
              {referralCode.trim() && (
                <p className="text-gaming-teal text-xs mt-1">
                  Using referral code: {referralCode.trim()}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full gaming-button font-semibold h-12 rounded-lg"
            >
              Register
            </Button>

            <div className="text-center text-gray-400 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="gaming-gradient bg-clip-text text-transparent font-semibold hover:opacity-80"
              >
                Login now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
