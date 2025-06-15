// src/firebase.js - النسخة النهائية والمركزية (مُصححة)

import { initializeApp } from "firebase/app";
import { 
  getAuth, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, 
  sendPasswordResetEmail, updateProfile, signInWithPopup, updatePassword, 
  reauthenticateWithCredential, EmailAuthProvider 
} from "firebase/auth";
import { 
  getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, setDoc, // <<<=== تم إضافة setDoc هنا
  deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, 
  Timestamp, writeBatch, increment 
} from "firebase/firestore";
import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBVkdyjJi3l-QB1KpSQJle_P9ujHQ2LTn0",
  authDomain: "right-water.firebaseapp.com",
  projectId: "right-water",
  storageBucket: "right-water.appspot.com",
  messagingSenderId: "134412024932",
  appId: "1:134412024932:web:be47e36b50f087e2a87371",
  measurementId: "G-0RZ3XYPXR7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

export {
  db,
  auth,
  storage,
  analytics,

  googleProvider,
  facebookProvider,
  twitterProvider,

  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc, // <<<=== وتم تصديرها هنا أيضاً
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
  
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
