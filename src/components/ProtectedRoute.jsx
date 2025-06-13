// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
     return (
      <div className="flex justify-center items-center h-screen">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
     );
  }

  if (!currentUser) {
    // إذا لم يكن المستخدم مسجلاً، وجهه لصفحة الدخول
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    // إذا كانت الصفحة للمدير فقط والمستخدم ليس مديرًا، وجهه للصفحة الرئيسية
    return <Navigate to="/" replace />; 
  }

  // إذا تم كل شيء بنجاح، اعرض المحتوى المحمي
  return <Outlet />;
};

export default ProtectedRoute;
