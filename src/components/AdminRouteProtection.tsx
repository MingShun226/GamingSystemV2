
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminRouteProtection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // If admin is logged in and trying to access the landing page, redirect to admin dashboard
    if (currentUser.role === 'admin' && location.pathname === '/') {
      console.log('Admin detected on landing page, redirecting to admin dashboard');
      navigate('/admin-dashboard', { replace: true });
    }
  }, [navigate, location.pathname]);

  return null; // This component doesn't render anything
};

export default AdminRouteProtection;
