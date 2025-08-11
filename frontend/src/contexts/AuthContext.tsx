import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getAuthToken, setAuthToken, removeAuthToken } from '../services/api';
import { authService } from '../services/auth';

export interface User {
  id: number;
  name: string;
  email: string;
  artist?: {
    id: number;
    name: string;
    bio: string;
    avatar?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      
      await setAuthToken(response.token);
      setUser(response.user);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different error types
      if (error.response?.status === 422) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint to revoke token on server
      try {
        await authService.logout();
      } catch (error) {
        console.warn('Logout API call failed, proceeding with local logout');
      }
      
      // Clear local storage
      await removeAuthToken();
      setUser(null);
      
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout completely. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.me();
      setUser(userData);
    } catch (error: any) {
      console.error('Refresh user error:', error);
      
      // If token is invalid, clear auth state
      if (error.response?.status === 401) {
        await removeAuthToken();
        setUser(null);
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
