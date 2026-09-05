import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAIYJ6qPQ1T2cGFp7D4_Y3I04TWCpjDN0E",
  authDomain: "attendence-web-x.firebaseapp.com",
  projectId: "attendence-web-x",
  storageBucket: "attendence-web-x.firebasestorage.app",
  messagingSenderId: "212702232055",
  appId: "1:212702232055:web:8a0b99a4fc588f79aec2f2",
  measurementId: "G-R79SYLJ36B"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
