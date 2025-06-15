// src/hooks/useAuth.js

import { useState, useEffect, createContext, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// إنشاء سياق (Context) لتوفير بيانات المصادقة لجميع المكونات
const AuthContext = createContext();

// Provider component: هذا المكون سيغلف التطبيق بأكمله
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    // onAuthStateChanged: يستمع لتغيرات حالة تسجيل الدخول (دخول، خروج)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // المستخدم مسجل دخوله
        setUser(firebaseUser);
        
        // جلب الـ ID Token والتحقق من صلاحيات الأدمن
        // هذا هو الجزء الذي يتصل بالعمل الذي قمنا به في Firebase
        const idTokenResult = await firebaseUser.getIdTokenResult();
        // !! لتحويل القيمة إلى boolean (true/false)
        setIsAdmin(!!idTokenResult.claims.admin); 
        
      } else {
        // المستخدم قام بتسجيل الخروج
        setUser(null);
        setIsAdmin(false);
      }
      // انتهاء التحميل بعد التأكد من حالة المستخدم
      setLoading(false); 
    });

    // إلغاء الاستماع عند مغادرة التطبيق لتجنب مشاكل الـ memory leaks
    return () => unsubscribe();
  }, []);

  const value = { user, isAdmin, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook مخصص لاستخدام بيانات المصادقة بسهولة في أي مكون
export const useAuth = () => {
  return useContext(AuthContext);
};
