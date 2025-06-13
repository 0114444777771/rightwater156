// src/contexts/AuthContext.jsx (النسخة المعدلة للبحث في Firestore)

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
// 🔥 التغيير رقم 1: استيراد getDoc و doc
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'; 
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
      if (user) {
        setCurrentUser(user);
        
        // 🔥🔥 الكود الجديد للتحقق من صلاحيات الأدمن عبر Firestore 🔥🔥
        try {
          // ننشئ مرجعًا (reference) لمستند الأدمن المحتمل
          // المسار هو 'admins/{user.uid}'
          const adminDocRef = doc(db, 'admins', user.uid);
          
          // نحاول جلب هذا المستند
          const adminDocSnap = await getDoc(adminDocRef);

          // نتحقق مما إذا كان المستند موجودًا بالفعل
          if (adminDocSnap.exists()) {
            // إذا كان موجودًا، فالمستخدم هو أدمن
            console.log("تم التحقق: المستخدم أدمن.");
            setIsAdmin(true);
          } else {
            // إذا لم يكن موجودًا، فالمستخدم ليس أدمن
            console.log("تم التحقق: المستخدم ليس أدمن.");
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("خطأ في التحقق من صلاحيات الأدمن من Firestore:", error);
          setIsAdmin(false); // نعيده للحالة الآمنة عند حدوث خطأ
        }

      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- باقي الكود يبقى كما هو بدون أي تغيير ---
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

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const sendPasswordReset = (email) => {
    return sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`
    });
  };

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

  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
