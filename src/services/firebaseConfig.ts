/**
 * Centralized Firebase Configuration with Environment Isolation (DEV vs PROD)
 * - DEV: cartaz-ia-dev-778bc (https://cartaz-ia-dev-778bc.web.app ou localhost)
 * - PROD: cartaz-ia-playcomunique (https://cartaz-ia-playcomunique.web.app)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export function isDevEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    const host = (window.location.hostname || '').toLowerCase();
    if (
      host.includes('dev-') ||
      host.includes('.dev.') ||
      host.includes('cartaz-ia-dev') ||
      host.includes('localhost') ||
      host === '127.0.0.1'
    ) {
      return true;
    }
  }
  return Boolean(
    import.meta.env?.VITE_APP_ENV === 'development' ||
    import.meta.env?.DEV ||
    import.meta.env?.MODE === 'development'
  );
}

const isDev = isDevEnvironment();

const devFirebaseConfig = {
  projectId: 'cartaz-ia-dev-778bc',
  appId: '1:674721203437:web:43ff0c402ec96629fff8e4',
  storageBucket: 'cartaz-ia-dev-778bc.firebasestorage.app',
  apiKey: 'AIzaSyDEqaCNFbg0wguDoAqwXBmQaJbtCJXBoAw',
  authDomain: 'cartaz-ia-dev-778bc.firebaseapp.com',
  messagingSenderId: '674721203437',
  projectNumber: '674721203437',
};

const prodFirebaseConfig = {
  projectId: 'cartaz-ia-playcomunique',
  appId: '1:197813011852:web:50dedd7c880168f29342a9',
  storageBucket: 'cartaz-ia-playcomunique.firebasestorage.app',
  apiKey: 'AIzaSyAkr0jo3972Kv2Zz1m9YQu4Bt033ZfgZMA',
  authDomain: 'cartaz-ia-playcomunique.firebaseapp.com',
  messagingSenderId: '197813011852',
  projectNumber: '197813011852',
};

// Respeita variáveis de ambiente se fornecidas, com fallback inteligente e seguro para dev/prod
export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (isDev ? devFirebaseConfig.projectId : prodFirebaseConfig.projectId),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (isDev ? devFirebaseConfig.appId : prodFirebaseConfig.appId),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (isDev ? devFirebaseConfig.storageBucket : prodFirebaseConfig.storageBucket),
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (isDev ? devFirebaseConfig.apiKey : prodFirebaseConfig.apiKey),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (isDev ? devFirebaseConfig.authDomain : prodFirebaseConfig.authDomain),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (isDev ? devFirebaseConfig.messagingSenderId : prodFirebaseConfig.messagingSenderId),
  projectNumber: import.meta.env.VITE_FIREBASE_PROJECT_NUMBER || (isDev ? devFirebaseConfig.projectNumber : prodFirebaseConfig.projectNumber),
};

// Singleton initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
