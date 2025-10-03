import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB97vMflKPswmAhNmsyU94oobtzGuOO0lo",
  authDomain: "notsoquicksearch.firebaseapp.com",
  projectId: "notsoquicksearch",
  storageBucket: "notsoquicksearch.firebasestorage.app",
  messagingSenderId: "95645439975",
  appId: "1:95645439975:web:be49c945c0a4c889e20f42"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);