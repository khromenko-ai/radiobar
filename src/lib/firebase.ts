import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "tonal-maker-5jf39",
  appId: "1:943734494902:web:cad318521cb16700c2f817",
  apiKey: "AIzaSyBs9N-FVBF3fev2tXv75TnMKfxA6BBXE5U",
  authDomain: "tonal-maker-5jf39.firebaseapp.com",
  storageBucket: "tonal-maker-5jf39.firebasestorage.app",
  messagingSenderId: "943734494902",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-immersivedinnerm-468506d3-d3d6-4209-a400-4d79279727c4");
