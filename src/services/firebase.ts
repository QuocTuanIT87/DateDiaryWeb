import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfuTiq8mKJTSl03J48OykOk43ctY66_6k",
  authDomain: "two-hearts-9bec8.firebaseapp.com",
  databaseURL: "https://two-hearts-9bec8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "two-hearts-9bec8",
  storageBucket: "two-hearts-9bec8.firebasestorage.app",
  messagingSenderId: "265732130824",
  appId: "1:265732130824:web:d051c43561b2d05d38e9bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
