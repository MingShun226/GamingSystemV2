
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (currentUser.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (currentUser.role === 'user') {
      navigate('/user-dashboard');
    } else {
      navigate('/');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gaming-dark flex items-center justify-center p-4">
      <div className="bg-gray-800/50 rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-yellow-500/20 rounded-full">
            <AlertCircle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <h1 className="text-white text-4xl font-bold mb-4">404</h1>
        <h2 className="text-white text-xl font-semibold mb-4">Page Not Found</h2>
        
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="bg-gray-900/50 rounded p-3 mb-6">
          <p className="text-gray-500 text-sm break-words">
            <span className="text-gray-400">Requested URL:</span> {location.pathname}
          </p>
        </div>
        
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleGoHome}
            className="bg-gaming-teal hover:bg-gaming-teal/80 text-white"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
