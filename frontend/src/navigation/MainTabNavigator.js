import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import theme from '../constants/theme';

// Home stack — landing screen + everything reachable from its quick actions
import HomeScreen from '../screens/home/HomeScreen';
import GymCheckInScreen from '../screens/checkin/GymCheckInScreen';
import ProgressDashboardScreen from '../screens/progress/ProgressDashboardScreen';
import AddProgressEntryScreen from '../screens/progress/AddProgressEntryScreen';
import StartDateSquadScreen from '../screens/squad/StartDateSquadScreen';
import DailyMealPlanScreen from '../screens/diet/DailyMealPlanScreen';
import DietSetupScreen from '../screens/diet/DietSetupScreen';
import MealOptionDetailScreen from '../screens/diet/MealOptionDetailScreen';
import CustomMealEntryScreen from '../screens/diet/CustomMealEntryScreen';
import SocialFeedScreen from '../screens/feed/SocialFeedScreen';
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatPodScreen from '../screens/chat/ChatPodScreen';
import DirectMessageScreen from '../screens/chat/DirectMessageScreen';
import WeeklyInsightScreen from '../screens/insights/WeeklyInsightScreen';
import CoachMarketplaceScreen from '../screens/coach/CoachMarketplaceScreen';
import CoachPlanDetailScreen from '../screens/coach/CoachPlanDetailScreen';
import PremiumPaywallScreen from '../screens/subscription/PremiumPaywallScreen';

// Workouts stack
import WorkoutSplitScreen from '../screens/workouts/WorkoutSplitScreen';
import ExerciseListScreen from '../screens/workouts/ExerciseListScreen';
import ExerciseDetailScreen from '../screens/workouts/ExerciseDetailScreen';
import LogWorkoutScreen from '../screens/workouts/LogWorkoutScreen';

// Profile stack
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import GymScheduleScreen from '../screens/profile/GymScheduleScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const WorkoutsStack = createNativeStackNavigator();
const SquadStack = createNativeStackNavigator();
const DietStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.text,
  headerShadowVisible: false,
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'FitCircle' }} />
      <HomeStack.Screen name="GymCheckIn" component={GymCheckInScreen} options={{ title: 'Check In' }} />
      <HomeStack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} options={{ title: 'Progress' }} />
      <HomeStack.Screen name="AddProgressEntry" component={AddProgressEntryScreen} options={{ title: 'Log Progress' }} />
      <HomeStack.Screen name="StartDateSquad" component={StartDateSquadScreen} options={{ title: 'Your Squad' }} />
      <HomeStack.Screen name="DailyMealPlan" component={DailyMealPlanScreen} options={{ title: 'Meal Plan' }} />
      <HomeStack.Screen name="DietSetup" component={DietSetupScreen} options={{ title: 'Diet Setup' }} />
      <HomeStack.Screen name="MealOptionDetail" component={MealOptionDetailScreen} options={{ title: 'Meal Details' }} />
      <HomeStack.Screen name="CustomMealEntry" component={CustomMealEntryScreen} options={{ title: 'Custom Meal' }} />
      <HomeStack.Screen name="SocialFeed" component={SocialFeedScreen} options={{ title: 'Feed' }} />
      <HomeStack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <HomeStack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
      <HomeStack.Screen name="ChatPod" component={ChatPodScreen} options={{ title: 'Pod Chat' }} />
      <HomeStack.Screen name="DirectMessage" component={DirectMessageScreen} options={{ title: 'Message' }} />
      <HomeStack.Screen name="WeeklyInsight" component={WeeklyInsightScreen} options={{ title: 'Weekly Insight' }} />
      <HomeStack.Screen name="CoachMarketplace" component={CoachMarketplaceScreen} options={{ title: 'Coach Marketplace' }} />
      <HomeStack.Screen name="CoachPlanDetail" component={CoachPlanDetailScreen} options={{ title: 'Plan Details' }} />
      <HomeStack.Screen name="PremiumPaywall" component={PremiumPaywallScreen} options={{ title: 'Go Premium' }} />
    </HomeStack.Navigator>
  );
}

function WorkoutsStackNavigator() {
  return (
    <WorkoutsStack.Navigator screenOptions={screenOptions}>
      <WorkoutsStack.Screen name="WorkoutSplit" component={WorkoutSplitScreen} options={{ title: 'Workouts' }} />
      <WorkoutsStack.Screen name="ExerciseList" component={ExerciseListScreen} options={{ title: 'Exercises' }} />
      <WorkoutsStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Exercise' }} />
      <WorkoutsStack.Screen name="LogWorkout" component={LogWorkoutScreen} options={{ title: 'Log Workout' }} />
    </WorkoutsStack.Navigator>
  );
}

function SquadStackNavigator() {
  return (
    <SquadStack.Navigator screenOptions={screenOptions}>
      <SquadStack.Screen name="StartDateSquadTab" component={StartDateSquadScreen} options={{ title: 'Squad' }} />
    </SquadStack.Navigator>
  );
}

function DietStackNavigator() {
  return (
    <DietStack.Navigator screenOptions={screenOptions}>
      <DietStack.Screen name="DailyMealPlanTab" component={DailyMealPlanScreen} options={{ title: 'Diet' }} />
      <DietStack.Screen name="DietSetupTab" component={DietSetupScreen} options={{ title: 'Diet Setup' }} />
      <DietStack.Screen name="MealOptionDetailTab" component={MealOptionDetailScreen} options={{ title: 'Meal Details' }} />
      <DietStack.Screen name="CustomMealEntryTab" component={CustomMealEntryScreen} options={{ title: 'Custom Meal' }} />
    </DietStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <ProfileStack.Screen name="GymSchedule" component={GymScheduleScreen} options={{ title: 'Gym Schedule' }} />
    </ProfileStack.Navigator>
  );
}

const TAB_ICONS = {
  HomeTab: '🏠',
  WorkoutsTab: '🏋️',
  SquadTab: '🏆',
  DietTab: '🍽️',
  ProfileTab: '👤',
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="WorkoutsTab" component={WorkoutsStackNavigator} options={{ title: 'Workouts' }} />
      <Tab.Screen name="SquadTab" component={SquadStackNavigator} options={{ title: 'Squad' }} />
      <Tab.Screen name="DietTab" component={DietStackNavigator} options={{ title: 'Diet' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}