import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ApplyRequest from './pages/ApplyRequest';
import PendingRequests from './pages/PendingRequests';
import UpdateRequest from './pages/UpdateRequest';
import FacultyRequests from './pages/FacultyRequests';
import ViewerAllRequests from './pages/ViewerAllRequests';
import ViewerAllowedRequests from './pages/ViewerAllowedRequests';
import RegistrarDashboard from './pages/RegistrarDashboard';
import RegistrarAllRequests from './pages/RegistrarAllRequests';
import PrincipalDashboard from './pages/PrincipalDashboard';
import PrincipalPendingRequests from './pages/PrincipalPendingRequests';
import PrincipalAllRequests from './pages/PrincipalAllRequests';
import AboutUs from './components/About'; // adjust path as needed


import { useEffect } from 'react';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Log for debugging
  useEffect(() => {
    console.log('PrivateRoute - User:', user?.email, 'Loading:', loading, 'Path:', location.pathname);
    if (user) {
      console.log('User role in PrivateRoute:', user.role);
    }
  }, [user, loading, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Store the attempted URL for redirect after login
    sessionStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.some(role => 
    user.role && user.role.toLowerCase() === role.toLowerCase()
  )) {
    console.log('User role does not match required roles. User role:', user.role, 'Required roles:', roles);
    return <Navigate to="/" replace />;
  }

  return children;
};

// Modified PublicRoute to avoid redirection loops
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Log for debugging
  useEffect(() => {
    console.log('PublicRoute - User:', user?.email, 'Loading:', loading, 'Path:', location.pathname);
  }, [user, loading, location]);

  // Only redirect if fully loaded and user exists
  if (!loading && user) {
    // Check for a saved redirect path
    const redirectPath = sessionStorage.getItem('redirectPath');
    
    // If there's a saved path, use it (and clear it)
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      return <Navigate to={redirectPath} replace />;
    }
    
    // Otherwise use role-based default redirect
    if (user.role && user.role.toLowerCase() === 'faculty') {
      return <Navigate to="/apply" replace />;
    } else if (user.role && user.role.toLowerCase() === 'admin') {
      return <Navigate to="/pending-requests" replace />;
    } else if (user.role && user.role.toLowerCase() === 'viewer') {
      return <Navigate to="/viewer/all-requests" replace />;
    } else if (user.role && user.role.toLowerCase() === 'registrar') {
      return <Navigate to="/registrar-dashboard" replace />;
    } else if (user.role && user.role.toLowerCase() === 'principal') {
      return <Navigate to="/principal-dashboard" replace />;
    }
  }

  // Either loading or no user, render the login/register page
  return children;
};

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  
  // Log for debugging
  useEffect(() => {
    console.log('HomeRedirect - User:', user?.email, 'Loading:', loading);
  }, [user, loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if ((user.role && user.role.toLowerCase() === 'faculty')) {
    return <Navigate to="/apply" replace />;
  } else if (user.role && user.role.toLowerCase() === 'admin') {
    return <Navigate to="/pending-requests" replace />;
  } else if (user.role && user.role.toLowerCase() === 'viewer') {
    return <Navigate to="/viewer/all-requests" replace />;
  } else if (user.role && user.role.toLowerCase() === 'registrar') {
    return <Navigate to="/registrar-dashboard" replace />;
  } else if (user.role && user.role.toLowerCase() === 'principal') {
    return <Navigate to="/principal-dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

const Dashboard = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    console.log('Dashboard component loaded, redirecting based on role');
    console.log('User in Dashboard:', user);
  }, [user]);

  if (!user) {
    console.log('No user in Dashboard, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Make case-insensitive checks
  const userRole = user.role ? user.role.toLowerCase() : '';
  console.log('User role in Dashboard (lowercase):', userRole);

  if (userRole === 'faculty') {
    console.log('User is faculty, redirecting to my-requests');
    return <Navigate to="/my-requests" replace />;
  } else if (userRole === 'admin') {
    console.log('User is admin, redirecting to pending-requests');
    return <Navigate to="/pending-requests" replace />;
  } else if (userRole === 'viewer') {
    console.log('User is viewer, redirecting to viewer/all-requests');
    return <Navigate to="/viewer/all-requests" replace />;
  } else if (userRole === 'registrar') {
    console.log('User is registrar, redirecting to registrar-dashboard');
    return <Navigate to="/registrar-dashboard" replace />;
  } else if (userRole === 'principal') {
    console.log('User is principal, redirecting to principal-dashboard');
    return <Navigate to="/principal-dashboard" replace />;
  }

  // Fallback for unknown roles
  console.log('Unknown role, redirecting to login');
  return <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { user, loading, checkAuth } = useAuth();
  const location = useLocation();

  // Log authentication state for debugging
  useEffect(() => {
    console.log('App rendered with user:', user);
    console.log('Location pathname:', location.pathname);
    console.log('Loading state:', loading);
    
    // Force auth check when component mounts
    if (!user && !loading) {
      console.log('Forcing auth check...');
      checkAuth();
    }
  }, [user, loading, location.pathname, checkAuth]);

  // Determine if the navbar should be shown (hide on login and register pages)
  const showNavbar = !['/login', '/register','/about'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <ToastContainer position="top-right" autoClose={3000} />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />
          <Route path="/about" element={<PublicRoute><AboutUs /></PublicRoute>} />
          <Route
            path="/apply"
            element={
              <PrivateRoute roles={['faculty', 'admin']}>
                <ApplyRequest />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <PrivateRoute roles={['faculty', 'admin']}>
                <FacultyRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/pending-requests"
            element={
              <PrivateRoute roles={['admin']}>
                <PendingRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/update-requests"
            element={
              <PrivateRoute roles={['admin']}>
                <UpdateRequest />
              </PrivateRoute>
            }
          />
          {/* Viewer Routes */}
          <Route
            path="/viewer/all-requests"
            element={
              <PrivateRoute roles={['viewer']}>
                <ViewerAllRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/viewer/allowed-requests"
            element={
              <PrivateRoute roles={['viewer']}>
                <ViewerAllowedRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/viewer-dashboard"
            element={<Navigate to="/viewer/all-requests" replace />}
          />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/registrar-dashboard" element={<PrivateRoute allowedRoles={["registrar"]}><RegistrarDashboard /></PrivateRoute>} />
          <Route
            path="/registrar/all-requests"
            element={
              <PrivateRoute roles={['registrar']}>
                <RegistrarAllRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/principal-dashboard"
            element={
              <PrivateRoute roles={['principal']}>
                <PrincipalDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/principal/pending-requests"
            element={
              <PrivateRoute roles={['principal']}>
                <PrincipalPendingRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/principal/all-requests"
            element={
              <PrivateRoute roles={['principal']}>
                <PrincipalAllRequests />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
