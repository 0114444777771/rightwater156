// src/components/auth/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // سنقوم بإنشاء هذا الهوك المخصص
import { Loader2 } from 'lucide-react';

/**
 * @param {{ requiredRole: 'admin' | 'user' }} props
 * props.requiredRole: يحدد الصلاحية المطلوبة للوصول ('admin' أو 'user')
 */
const ProtectedRoute = ({ requiredRole }) => {
  const { user, isAdmin, loading } = useAuth();

  // الحالة 1: جاري التحقق من حالة المصادقة (Loading)
  // نعرض شاشة تحميل لمنع الوميض (flickering) أثناء إعادة التوجيه
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // الحالة 2: المستخدم غير مسجل دخوله
  if (!user) {
    // أعد توجيه المستخدم إلى صفحة تسجيل الدخول واحفظ المسار الذي كان يحاول الوصول إليه
    return <Navigate to="/login" replace />;
  }

  // الحالة 3: المسار يتطلب صلاحية 'admin' والمستخدم ليس أدمن
  if (requiredRole === 'admin' && !isAdmin) {
    // المستخدم مسجل دخوله لكنه ليس أدمن، أعد توجيهه إلى الصفحة الرئيسية أو صفحة خطأ
    return <Navigate to="/" replace />;
  }
  
  // إذا كانت كل الشروط متحققة، اسمح بعرض الصفحة المطلوبة
  // <Outlet /> هو المكان الذي سيتم فيه عرض المكون المحمي (مثل AdminDashboardPage)
  return <Outlet />;
};

export default ProtectedRoute;
