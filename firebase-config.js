// Firebase initialization — exposes db/auth/functions on window so
// plain <script> files (data.js, admin.js, and inline page scripts)
// can use them without needing to be modules themselves.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, query, orderBy, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQFn_7y-9xUTZgL6ZthMFxKWqRLPx1znw",
  authDomain: "nyn-website.firebaseapp.com",
  projectId: "nyn-website",
  storageBucket: "nyn-website.firebasestorage.app",
  messagingSenderId: "1097672671543",
  appId: "1:1097672671543:web:9c47bca1662a828ef79ab2",
  measurementId: "G-6DRPT0D27Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.firebaseDB = db;
window.firebaseAuth = auth;
window.firebaseFunctions = {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, query, orderBy, where, onSnapshot
};
window.firebaseAuthFunctions = { signInWithEmailAndPassword, signOut, onAuthStateChanged };
