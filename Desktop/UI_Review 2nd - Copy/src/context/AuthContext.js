import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication state
    checkAuthState();
    
    // Safety timeout: Always set loading to false after 3 seconds
    const timeout = setTimeout(() => {
      console.log('Auth loading timeout - forcing isLoading to false');
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  const checkAuthState = async () => {
    try {
      // Simulate checking for stored authentication
      // In a real app, you would check AsyncStorage or secure storage
      const storedAuth = false; // Replace with actual storage check
      
      if (storedAuth) {
        setIsAuthenticated(true);
        setUser({ email: 'user@nexawave.com', name: 'NexaWave User' });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      // Always set loading to false, even on error
      // Use immediate setState to ensure it happens
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation
      if (email && password) {
        setIsAuthenticated(true);
        setUser({ email, name: 'NexaWave User' });
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsAuthenticated(false);
      setUser(null);
      
      // Clear any stored authentication data
      // In a real app, you would clear AsyncStorage or secure storage
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

