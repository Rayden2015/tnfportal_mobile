import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import * as api from '@/src/api';
import { getFirebaseClientConfig } from '@/src/firebase/config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseClientConfig();
  if (!config) {
    return null;
  }

  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(config);
  }

  return app;
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  if (!auth) {
    auth = getAuth(firebaseApp);
  }

  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }

  return firestore;
}

export async function signInToFirebase(authContext: { token: string; tenantSlug: string }): Promise<boolean> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    return false;
  }

  const { token } = await api.getFirebaseToken(authContext);
  await signInWithCustomToken(firebaseAuth, token);

  return true;
}

export async function signOutFromFirebase(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth?.currentUser) {
    return;
  }

  await signOut(firebaseAuth);
}

export function directChatId(userIdA: number, userIdB: number): string {
  const [low, high] = userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

  return `u${low}_u${high}`;
}

export function firebaseUid(tenantId: number, userId: number): string {
  return `tenant_${tenantId}_user_${userId}`;
}

export function getCurrentFirebaseUid(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

export function tenantChatsCollection(tenantId: number) {
  const db = getFirebaseFirestore();
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  return `tenants/${tenantId}/directChats`;
}
