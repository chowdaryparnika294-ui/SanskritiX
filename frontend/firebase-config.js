import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase web configuration is safe to expose in the client. Access is enforced
// by Firebase Authentication and the Firestore rules in ../firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyAlJZikwSyyxOMiuxT5Wl8cLqoJWaYCtLg",
  authDomain: "sanskritix.firebaseapp.com",
  projectId: "sanskritix",
  storageBucket: "sanskritix.firebasestorage.app",
  messagingSenderId: "919799131667",
  appId: "1:919799131667:web:36da0a04a745f593e2d9e6",
  measurementId: "G-3E06RE5H6R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics is unavailable in some browser contexts (for example, private mode).
// Authentication should remain usable when it is unavailable.
isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

export { auth, db };
