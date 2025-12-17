// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCQe_2uxAelXdplyc9JCwT5MRP_Txua23k",
    authDomain: "dsa-sheet-c1493.firebaseapp.com",
    projectId: "dsa-sheet-c1493",
    storageBucket: "dsa-sheet-c1493.firebasestorage.app",
    messagingSenderId: "26948377306",
    appId: "1:26948377306:web:6a6b19903e981f85b4e3e3",
    measurementId: "G-YFZTSB1VME"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);
