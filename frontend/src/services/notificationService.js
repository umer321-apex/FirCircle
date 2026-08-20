import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const registerForPushNotifications = async () => {
  try {
    // expo-notifications remote push is unsupported in Expo Go on SDK 53+ —
    // only works in a real EAS development/production build. Bail out early
    // and silently, rather than letting it throw a projectId error.
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
      console.log('[notificationService] Push notifications unavailable in Expo Go — skipping (use a dev build to test this)');
      return null;
    }

    if (!Device.isDevice) {
      console.log('[notificationService] Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[notificationService] Push notification permission denied');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('[notificationService] No EAS projectId configured yet — skipping push registration');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenResponse.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await api.post('/notifications/register-token', { expoPushToken });

    return expoPushToken;
  } catch (error) {
    console.error(`[notificationService.registerForPushNotifications] Error: ${error.message}`);
    return null;
  }
};

export default { registerForPushNotifications };