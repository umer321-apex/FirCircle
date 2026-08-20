import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import notificationService from '../services/notificationService';

const TOKEN_KEY = 'fitcircle_auth_token';
const USER_KEY = 'fitcircle_auth_user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while restoring session on app boot

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        notificationService.registerForPushNotifications();
      }
    } catch (error) {
      console.error(`[AuthContext.restoreSession] Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken, newUser) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      notificationService.registerForPushNotifications(); // fire-and-forget, don't block login on this
    } catch (error) {
      console.error(`[AuthContext.login] Error persisting session: ${error.message}`);
      throw error;
    }
  };

  // Called after onboarding PATCH succeeds, so app state reflects the latest user doc
  // without requiring a full re-login
  const updateUser = async (updatedUser) => {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error(`[AuthContext.updateUser] Error persisting user: ${error.message}`);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error(`[AuthContext.logout] Error clearing session: ${error.message}`);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  // A user is considered "onboarded" once goal + age + homeGym are all set —
  // matches what OnboardingNavigator checks to decide where to route.
  const isOnboarded = !!(user?.goal && user?.age && user?.homeGym?.lat);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isOnboarded, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = useAuthContext; // alias — some screens import this name instead