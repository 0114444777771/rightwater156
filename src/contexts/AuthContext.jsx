// src/contexts/AuthContext.jsx (نسخة معدلة للتحقق من Firestore)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, // سنحتاج لهذه الدالة
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);
      
      if (user) {
        // 🔥🔥 هذا هو الكود الذي طلبته 🔥🔥
        // التحقق من صلاحيات الأدمن عن طريق قراءة مستند من مجموعة 'admins'
        try {
          const adminDocRef = doc(db, "admins", user.uid);
          const adminDoc = await getDoc(adminDocRef);
          setIsAdmin(adminDoc.exists()); // إذا كان المستند موجودًا، فالمستخدم هو أدمن
        } catch (error) {
          console.error("خطأ في التحقق من صلاحيات الأدمن:", error);
          setIsAdmin(false);
        }
      } else {
        // لا يوجد مستخدم، فبالتأكيد ليس أدمن
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- باقي الدوال كما هي بدون أي تغيير ---
  const signUp = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: displayName,
      email: user.email,
      createdAt: serverTimestamp(),
      role: 'user' 
    });
    return user;
  };
  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => firebaseSignOut(auth);
  const sendPasswordReset = (email) => sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/login` });
  const updateUserProfile = async (updates) => {
    if (!currentUser) return Promise.reject(new Error("No user is currently signed in."));
    await updateProfile(currentUser, updates);
    setCurrentUser({ ...auth.currentUser });
  };
  const reauthenticateAndChangePassword = async (currentPassword, newPassword) => {
    if (!currentUser) throw new Error("No user is currently signed in.");
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await firebaseUpdatePassword(currentUser, newPassword);
  };
  
  const value = {
    currentUser,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    updateUserProfile,
    reauthenticateAndChangePassword,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
