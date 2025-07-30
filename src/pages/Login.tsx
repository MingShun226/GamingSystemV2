import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { authenticateUser } from '@/lib/supabase';
import { decryptPassword, clearUrlParameters } from '@/utils/encryption';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const autoUsername = searchParams.get('username');
    const encryptedToken = searchParams.get('token');
    const legacyPassword = searchParams.get('password'); // Fallback for old links
    
    if (autoUsername && (encryptedToken || legacyPassword) && !autoLoginAttempted) {
      setAutoLoginAttempted(true);
      
      let autoPassword: string | null = null;
      
      if (encryptedToken) {
        // Decrypt the password from the token
        autoPassword = decryptPassword(encryptedToken);
        console.log('🔓 Password decrypted from secure token');
      } else if (legacyPassword) {
        // Fallback for old non-encrypted links
        autoPassword = legacyPassword;
        console.log('⚠️ Using legacy password parameter');
      }
      
      if (autoPassword) {
        setUsername(autoUsername);
        setPassword(autoPassword);
        
        toast({
          title: "🎉 Welcome!",
          description: "Your credentials have been auto-filled. Just click Sign In!",
        });
        
        console.log('✅ Auto-fill successful');
        
        // Clear URL parameters after a short delay for security
        setTimeout(() => {
          clearUrlParameters();
        }, 2000);
      } else {
        console.error('❌ Failed to decrypt password');
        toast({
          title: "🔒 Invalid secure link",
          description: "Please enter credentials manually.",
          variant: "destructive",
        });
      }
    }
  }, [location.search, autoLoginAttempted]);

  const performLogin = async (loginUsername: string, loginPassword: string, isAutoLogin: boolean = false) => {
    if (!isAutoLogin) {
      setIsLoading(true);
    }

    try {
      const { data, error } = await authenticateUser(loginUsername.trim(), loginPassword);

      if (error) {
        const toastId = toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        
        setTimeout(() => {
          if (toastId && toastId.dismiss) {
            toastId.dismiss();
          }
        }, 5000);
        if (!isAutoLogin) setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const user = data[0];
        
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
          if (!isAutoLogin) setIsLoading(false);
          return;
        }

        const userWithRole = { ...user, role: 'user' };
        localStorage.setItem('currentUser', JSON.stringify(userWithRole));
        
        const toastId = toast({
          title: "Login Successful",
          description: `Welcome back, ${user.username}!${isAutoLogin ? ' (Auto-login successful)' : ''}`,
        });
        
        setTimeout(() => {
          if (toastId && toastId.dismiss) {
            toastId.dismiss();
          }
        }, 5000);
        
        navigate('/');
      }
    } catch (error) {
      const toastId = toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      
      setTimeout(() => {
        if (toastId && toastId.dismiss) {
          toastId.dismiss();
        }
      }, 5000);
    }
    
    if (!isAutoLogin) setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(username, password);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gaming-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          onClick={handleBackToHome}
          variant="ghost"
          className="text-gray-300 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="bg-gaming-darker border-gray-700">
          <CardHeader className="text-center">
            <img 
              src="/lovable-uploads/603076d3-9354-4a55-89b3-ce3f167abbfe.png" 
              alt="ECLBET"
              className="h-12 w-auto mx-auto mb-4"
            />
            <CardTitle className="text-white text-2xl">User Login</CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to your account to start playing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gaming-button"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="gaming-gradient bg-clip-text text-transparent font-semibold hover:opacity-80">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link to="/admin-login" className="text-gray-500 hover:text-gray-400 text-sm">
                Admin Access
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
