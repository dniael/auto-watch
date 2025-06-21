// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBuOYoMwdf_g1GtZkdy8Wp4GunJCswRMnU",
  authDomain: "auto-watch-b4614.firebaseapp.com",
  projectId: "auto-watch-b4614",
  storageBucket: "auto-watch-b4614.firebasestorage.app",
  messagingSenderId: "447377749580",
  appId: "1:447377749580:web:e8944f41ecc0507dc026e9",
  measurementId: "G-XFESMGHXG8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app };