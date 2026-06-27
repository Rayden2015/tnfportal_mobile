import Constants from 'expo-constants';

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
};

export function getFirebaseClientConfig(): FirebaseClientConfig | null {
  const extra = Constants.expoConfig?.extra ?? {};
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? (extra.firebaseApiKey as string | undefined);
  const authDomain =
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? (extra.firebaseAuthDomain as string | undefined);
  const projectId =
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? (extra.firebaseProjectId as string | undefined);
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? (extra.firebaseAppId as string | undefined);
  const messagingSenderId =
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    (extra.firebaseMessagingSenderId as string | undefined);

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return { apiKey, authDomain, projectId, appId, messagingSenderId };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseClientConfig() !== null;
}
