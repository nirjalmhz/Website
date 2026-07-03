import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  projectId: "principal-anchor-cfs6l",
  appId: "1:1047688028256:web:71d15527e72f077eb8e305",
  apiKey: "AIzaSyDNPPqV09S8Tb4tikuAPygEIZOZo2t06IQ",
  authDomain: "principal-anchor-cfs6l.firebaseapp.com",
  storageBucket: "principal-anchor-cfs6l.firebasestorage.app",
  messagingSenderId: "1047688028256"
};

const customDatabaseId = "ai-studio-weatherdashboard-a92ac380-a7aa-4fe6-8b5e-ea4dfec69808";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID
const db = getFirestore(app, customDatabaseId);

// Initialize Firebase Auth
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export {
  app,
  db,
  auth,
  googleProvider,
  githubProvider,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  orderBy,
  limit,
  serverTimestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged
};
