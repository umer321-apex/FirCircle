import { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState({
    goal: null,
    age: null,
    sex: null,
    homeGym: null,
    visibility: null,
  });

  const updateOnboardingData = (fields) => {
    setOnboardingData((prev) => ({ ...prev, ...fields }));
  };

  const resetOnboardingData = () => {
    setOnboardingData({
      goal: null,
      age: null,
      sex: null,
      homeGym: null,
      visibility: null,
    });
  };

  return (
    <OnboardingContext.Provider
      value={{ onboardingData, updateOnboardingData, resetOnboardingData }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
};