// import { useEffect, useRef } from 'react';
// import { AppState } from 'react-native';
// import { AuthProvider } from './src/context/AuthContext';
// import { SubscriptionProvider } from './src/context/SubscriptionContext';
// import RootNavigator from './src/navigation/RootNavigator';
// import offlineQueueService from './src/services/offlineQueueService';

// export default function App() {
//   const appState = useRef(AppState.currentState);

//   useEffect(() => {
//     const subscription = AppState.addEventListener('change', (nextState) => {
//       if (appState.current.match(/inactive|background/) && nextState === 'active') {
//         offlineQueueService.syncQueue();
//       }
//       appState.current = nextState;
//     });

//     offlineQueueService.syncQueue(); // also sync once on cold start

//     return () => subscription.remove();
//   }, []);

//   return (
//     <AuthProvider>
//       <SubscriptionProvider>
//         <RootNavigator />
//       </SubscriptionProvider>
//     </AuthProvider>
//   );
// }

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import offlineQueueService from './src/services/offlineQueueService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const appState = useRef(AppState.currentState);

  const [fontsLoaded] = useFonts({
    Anton_400Regular,
    HankenGrotesk_400Regular,
    HankenGrotesk_700Bold,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        offlineQueueService.syncQueue();
      }
      appState.current = nextState;
    });

    offlineQueueService.syncQueue();

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null; // splash screen stays visible until fonts are ready
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <RootNavigator />
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}