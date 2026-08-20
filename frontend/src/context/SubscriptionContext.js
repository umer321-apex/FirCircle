import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import subscriptionService from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await subscriptionService.getMySubscription();
      setIsPremium(!!data.isPremium);
    } catch (err) {
      console.error('Failed to load subscription status:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleDevPremium = async () => {
    try {
      const data = await subscriptionService.devTogglePremium();
      setIsPremium(!!data.isPremium);
      return data.isPremium;
    } catch (err) {
      console.error('Failed to toggle premium:', err.message);
      throw err;
    }
  };

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading, refresh, toggleDevPremium }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
export const useSubscriptionContext = useSubscription; // alias — some screens import this name instead