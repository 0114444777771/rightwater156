// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  // 1. عرض شاشة تحميل أثناء التحقق من حالة المستخدم
  if (loading) {
     return (
      <div className="flex justify-center items-center h-screen">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
     );
  }

  // 2. إذا لم يكن المستخدم مسجلاً، وجهه لصفحة الدخول
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. إذا كانت الصفحة للمدير فقط والمستخدم الحالي ليس مديرًا، وجهه للصفحة الرئيسية
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />; 
  }

  // 4. إذا كان كل شيء على ما يرام، اعرض الصفحة المطلوبة (سواء للمستخدم العادي أو المدير)
  return <Outlet />;
};

export default ProtectedRoute;
