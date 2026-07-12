// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdJCeqZpSxuS8Lk51EEEVXQwSlfTpt1GQ",
  authDomain: "pokesenpai-db7ab.firebaseapp.com",
  projectId: "pokesenpai-db7ab",
  storageBucket: "pokesenpai-db7ab.firebasestorage.app",
  messagingSenderId: "66391026429",
  appId: "1:66391026429:web:d3eb3e7371980ef8de6c94",
  measurementId: "G-SJJ7CG1XYJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);