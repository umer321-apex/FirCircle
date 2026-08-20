import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from '../context/OnboardingContext';
import GoalSelectScreen from '../screens/onboarding/GoalSelectScreen';
import HomeGymSetupScreen from '../screens/onboarding/HomeGymSetupScreen';
import ProfileVisibilityScreen from '../screens/onboarding/ProfileVisibilityScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="GoalSelect" component={GoalSelectScreen} />
        <Stack.Screen name="HomeGymSetup" component={HomeGymSetupScreen} />
        <Stack.Screen name="ProfileVisibility" component={ProfileVisibilityScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}