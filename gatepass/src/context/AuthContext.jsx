import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Create a token refresh mechanism that prevents token expiry issues
const setTokenRefresh = (token) => {
  if (token) {
    // Set the default Authorization header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Remove the Authorization header if no token
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to check authentication status, made into a useCallback
  const checkAuth = useCallback(async () => {
    console.log('Checking authentication...');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        setUser(null);
        setLoading(false);
        setTokenRefresh(null);
        setIsInitialized(true);
        return null;
      }
      
      console.log('Verifying token validity');
      setTokenRefresh(token);
      
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Auth check successful, user data:', response.data);
      setUser(response.data);
      
      // Update role in localStorage to ensure it's always available
      if (response.data && response.data.role) {
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      setAuthError(null);
      return response.data;
    } catch (error) {
      console.error('Auth verification failed:', error);
      
      // Only clear token if error is auth-related (401)
      if (error.response && error.response.status === 401) {
        console.log('Clearing invalid token');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        setTokenRefresh(null);
        setUser(null);
      }
      
      setAuthError(error.message || 'Authentication failed');
      return null;
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Initial auth check when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    // Only set loading to true if there's actually a token to verify
    if (token) {
      setLoading(true);
      checkAuth();
    } else {
      // If no token, just mark as initialized without loading
      setIsInitialized(true);
    }
  }, [checkAuth]);

  // Set up interval for token refresh
  useEffect(() => {
    // Only set up token refresh if initialized
    if (isInitialized) {
      // Set up interval to periodically verify token (every 15 minutes)
      const authInterval = setInterval(() => {
        const token = localStorage.getItem('token');
        // Only check authentication if there's a token
        if (token) {
          console.log('Running periodic auth check');
          checkAuth();
        }
      }, 15 * 60 * 1000);
      
      return () => {
        console.log('Cleaning up auth interval');
        clearInterval(authInterval);
      };
    }
  }, [checkAuth, isInitialized]);

  // Debug useEffect to log user state changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      user: user?.email, 
      role: user?.role,
      loading, 
      authError,
      isInitialized
    });
  }, [user, loading, authError, isInitialized]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Login attempt for:', email);
      
      const response = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });
      
      if (response.data.token) {
        console.log('Login successful, setting user and token');
        
        // Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update axios headers
        setTokenRefresh(response.data.token);
        
        // Update state
        setUser(response.data.user);
        setAuthError(null);
        
        return response.data.user;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.response?.data?.message || error.message || 'Login failed');
      throw error.response?.data || { message: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      setAuthError(null);
      return response.data;
    } catch (error) {
      setAuthError(error.response?.data?.message || error.message || 'Registration failed');
      throw error.response?.data || { message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out, clearing auth data');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    sessionStorage.clear();
    setTokenRefresh(null);
    setUser(null);
    setAuthError(null);
  };

  const authContextValue = {
    user, 
    login, 
    register, 
    logout, 
    loading,
    isInitialized,
    checkAuth,
    authError
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 