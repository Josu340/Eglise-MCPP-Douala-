import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJWAdpjZ_6dKVsiccQ9cjiEPBaz6qxoRU",
  authDomain: "mcpp-douala.firebaseapp.com",
  projectId: "mcpp-douala",
  storageBucket: "mcpp-douala.firebasestorage.app",
  messagingSenderId: "351483264483",
  appId: "1:351483264483:web:ab2adefc321224f8c934d6",
  measurementId: "G-WGWW0SV3SV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
