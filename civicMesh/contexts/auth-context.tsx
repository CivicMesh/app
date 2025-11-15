import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, signup as signupApi } from '@/services/api';

type User = {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await loginApi({ email, password });

      if (response.success && response.token) {
        const userData = response.data || { email, id: email };
        setToken(response.token);
        setUser(userData);

        // Store in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, response.token),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
        ]);

        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await signupApi({ email, password, firstName, lastName });

      if (response.success && response.token) {
        const userData = response.data || { email, firstName, lastName, id: email };
        setToken(response.token);
        setUser(userData);

        // Store in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, response.token),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
        ]);

        return { success: true };
      } else {
        return { success: false, error: response.error || 'Signup failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  };

  const logout = async () => {
    try {
      await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        signup,
        logout,
      }}>
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

