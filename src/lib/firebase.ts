import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "poetic-metrics-72sm5",
  appId: "1:357175785566:web:0ae57a7a95f8bc6c81dccf",
  apiKey: "AIzaSyAyfxOmHV55LoTlk9lwQml6I_7k1UWiOCk",
  authDomain: "poetic-metrics-72sm5.firebaseapp.com",
  storageBucket: "poetic-metrics-72sm5.firebasestorage.app",
  messagingSenderId: "357175785566",
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

