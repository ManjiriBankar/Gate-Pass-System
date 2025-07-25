import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'principal') {
      navigate('/principal/pending-requests', { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default PrincipalDashboard; 