// src/pages/UserProfilePage.jsx (النسخة الصحيحة لمشروع Vite)

import React, { useState, useEffect } from 'react';
// 🔥🔥 التعديل: استيراد useNavigate من react-router-dom 🔥🔥
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { db, doc, updateDoc } from '@/firebase';
import { updateProfile } from 'firebase/auth';

// --- استيراد مكونات الواجهة والأيقونات ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// --- المكون الرئيسي ---
const UserProfilePage = () => {
  // 🔥🔥 التعديل: استخدام useNavigate بدلاً من useRouter 🔥🔥
  const navigate = useNavigate(); 
  const { currentUser, loading: authLoading } = useAuth(); // لا يوجد دالة logout في السياق الحالي، سنستخدم signOut
  const { toast } = useToast();

  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    if (authLoading) return;
    // إذا انتهى التحميل ولم يكن هناك مستخدم، وجهه لصفحة الدخول
    if (!currentUser) {
      navigate('/login'); // <-- استخدام navigate
    } else {
      setFormData({
        name: currentUser.displayName || '',
        phone: currentUser.phoneNumber || '',
      });
    }
  }, [currentUser, authLoading, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "خطأ", description: "حقل الاسم لا يمكن أن يكون فارغاً.", variant: "destructive" });
      return;
    }
    setIsUpdating(true);
    try {
      if (currentUser.displayName !== formData.name) {
        await updateProfile(currentUser, { displayName: formData.name });
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: formData.name,
        phone: formData.phone,
      }, { merge: true });

      toast({ title: "تم التحديث", description: "تم حفظ معلوماتك بنجاح." });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({ title: "خطأ", description: "فشل تحديث المعلومات.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || !currentUser) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  // الجزء ده من الكود مش موجود في الملف اللي بعتهولي، فهسيبه زي ما هو
  // لو فيه أي مشاكل تانية هتظهر بعد ما نحل دي
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <CardHeader className="p-0 mb-6">
          <CardTitle className="text-2xl font-bold">المعلومات الشخصية</CardTitle>
          <CardDescription>قم بتحديث اسمك وبيانات الاتصال الخاصة بك.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                  <Label htmlFor="email">البريد الإلكتروني (لا يمكن تغييره)</Label>
                  <Input id="email" type="email" value={currentUser?.email || ''} disabled />
              </div>
              <div>
                  <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="animate-spin mr-2" /> : null}
                  {isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
          </form>
      </CardContent>
    </motion.div>
  );
};

export default UserProfilePage;
