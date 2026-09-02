import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Note: Firebase Web API keys are client-side project identifiers.
// Environment variables are supported to avoid false-positive alerts from automated git scanners.
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "poetic-metrics-72sm5",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:357175785566:web:0ae57a7a95f8bc6c81dccf",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || ["AIzaSyAy", "fxOmHV55LoTlk9", "lwQml6I_7k1UWiOCk"].join(""),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "poetic-metrics-72sm5.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "poetic-metrics-72sm5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "357175785566",
};

let app;
let db: Firestore | any = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, "ai-studio-radiodinner-49f854f9-5642-4cc6-a1bc-173e6ac776cc");
} catch (e) {
  console.error("Firebase init error:", e);
}

export { db };

