import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import * as api from '@/src/api';

export type PushRegistrationResult = {
  expoPushToken: string | null;
  status: 'granted' | 'denied' | 'unsupported';
};

/** Remote push is not available in Expo Go (SDK 53+). Use an EAS development build. */
export function isPushSupported(): boolean {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;
  if (Constants.appOwnership === 'expo') return false;
  return true;
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (!isPushSupported()) {
    return { expoPushToken: null, status: 'unsupported' };
  }

  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TNF Portal',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { expoPushToken: null, status: 'denied' };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return { expoPushToken: token.data, status: 'granted' };
}

export async function registerPushTokenWithApi(
  auth: { token: string; tenantSlug: string },
  expoPushToken: string,
): Promise<void> {
  const deviceName = Device.deviceName ?? Device.modelName ?? 'TNF Mobile';
  await api.registerPushToken(auth, expoPushToken, Platform.OS, deviceName);
}
