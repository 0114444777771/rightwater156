// src/components/admin/ProductManagement.jsx

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/firebase'; // تأكد من أن هذا المسار صحيح لإعدادات Firebase
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, doc, query, updateDoc, addDoc, deleteDoc, runTransaction, onSnapshot, orderBy } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';

// استيراد مكونات الواجهة (UI Components)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.jsx";
import { Progress } from '@/components/ui/progress.jsx';
import { useToast } from '@/components/ui/use-toast';

// استيراد الأيقونات (Icons)
import { PlusCircle, Edit, Trash2, Package, Loader2, AlertTriangle, Search, ImagePlus, X } from 'lucide-react';

// الحالة الأولية للمنتج الجديد لتسهيل إعادة التعيين
const INITIAL_PRODUCT_STATE = {
  name: '',
  category: '',
  price: 0,
  description: '',
  stock: 0,
  originalPrice: null, // يستخدم في حالة العروض
};

const ProductManagement = () => {
  // --- State Hooks ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State لإدارة النوافذ المنبثقة (Modals)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  // State لإدارة بيانات الفورم
  const [currentProduct, setCurrentProduct] = useState(INITIAL_PRODUCT_STATE);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // State لعملية رفع الصورة
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { toast } = useToast();

  // --- useEffect Hook لجلب المنتجات ---
  useEffect(() => {
    setLoading(true);
    // جلب المنتجات وترتيبها حسب الاسم
    const q = query(collection(db, 'products'), orderBy('name'));

    // onSnapshot يقوم بالاستماع لأي تغييرات في قاعدة البيانات بشكل حي
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
        setLoading(false);
      }, 
      (err) => {
        // في حالة وجود خطأ (مثل خطأ الصلاحيات)
        console.error("Firebase onSnapshot error: ", err);
        setError("فشلت عملية جلب المنتجات. تأكد من أن لديك الصلاحيات اللازمة.");
        setLoading(false);
      }
    );

    // إلغاء الاشتراك عند مغادرة الصفحة لتجنب تسريب الذاكرة
    return () => unsubscribe();
  }, []);

  // --- دوال التعامل مع الفورم ---
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "ملف غير صالح", description: "يرجى اختيار ملف صورة.", variant: "destructive" });
      return;
    }

    setImagePreview(URL.createObjectURL(file));

    // ضغط الصورة قبل رفعها لتحسين الأداء
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
    try {
      toast({ title: "جاري ضغط الصورة..." });
      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);
      toast({ title: "✅ الصورة جاهزة للرفع!", className: "bg-green-500 text-white" });
    } catch (error) {
      toast({ title: "خطأ في ضغط الصورة", description: "سيتم استخدام الصورة الأصلية.", variant: "destructive" });
      setImageFile(file); // استخدام الصورة الأصلية في حالة فشل الضغط
    }
  };

  const resetForm = () => {
    setCurrentProduct(INITIAL_PRODUCT_STATE);
    setImageFile(null);
    setImagePreview('');
    setUploadProgress(0);
    setIsUploading(false);
    setIsModalOpen(false);
  };
  
  // --- دوال التعامل مع Firebase ---
  const uploadImage = () => {
    return new Promise((resolve, reject) => {
      if (!imageFile) return resolve(null); // لا يوجد صورة جديدة للرفع
      
      setIsUploading(true);
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on('state_changed',
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => { setIsUploading(false); reject(error); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setIsUploading(false);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentProduct.name || currentProduct.price <= 0) {
      toast({ title: "بيانات ناقصة", description: "اسم المنتج وسعره مطلوبان.", variant: "destructive" });
      return;
    }
    
    // في حالة الإضافة، الصورة مطلوبة
    if (modalMode === 'add' && !imageFile) {
        toast({ title: "صورة مطلوبة", description: "يرجى اختيار صورة للمنتج الجديد.", variant: "destructive" });
        return;
    }

    try {
      const imageUrl = await uploadImage();
      const productData = { ...currentProduct };
      if (imageUrl) {
        productData.image = imageUrl;
      }

      if (modalMode === 'add') {
        await addDoc(collection(db, 'products'), productData);
        toast({ title: "✅ تم إضافة المنتج بنجاح", className: "bg-green-500 text-white" });
      } else {
        const productRef = doc(db, 'products', currentProduct.id);
        await updateDoc(productRef, productData);
        toast({ title: "✅ تم تعديل المنتج بنجاح", className: "bg-green-500 text-white" });
      }
      resetForm();

    } catch (err) {
      console.error("Error submitting product: ", err);
      toast({ title: "❌ حدث خطأ", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف المنتج "${productName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      toast({ title: "🗑️ تم حذف المنتج", className: "bg-red-500 text-white" });
    } catch (err) {
      console.error("Error deleting product: ", err);
      toast({ title: "❌ خطأ في الحذف", description: err.message, variant: "destructive" });
    }
  };

  // --- دوال فتح النوافذ المنبثقة ---
  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setIsModalOpen(true);
  };
  
  const openEditModal = (product) => {
    resetForm();
    setModalMode('edit');
    setCurrentProduct(product);
    setImagePreview(product.image); // عرض الصورة الحالية
    setIsModalOpen(true);
  };

  // --- فلترة المنتجات بناءً على البحث ---
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- عرض حالات التحميل والخطأ ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">جاري تحميل المنتجات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center bg-red-50 dark:bg-red-900/20 rounded-lg">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-lg text-destructive font-semibold">حدث خطأ</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  // --- JSX الرئيسي للعرض ---
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Package className="mr-3 h-8 w-8 text-primary" />
          إدارة المنتجات
        </h1>
        <Button onClick={openAddModal}>
          <PlusCircle className="mr-2 h-5 w-5" />
          إضافة منتج جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>قائمة المنتجات ({filteredProducts.length})</CardTitle>
            <div className="relative mt-2">
                <Search className="absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    type="text" 
                    placeholder="ابحث بالاسم أو التصنيف..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full max-w-sm pl-10 rtl:pr-10" 
                />
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصورة</TableHead>
                <TableHead>اسم المنتج</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img src={product.image} alt={product.name} className="h-12 w-12 object-cover rounded-md" />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || 'غير مصنف'}</TableCell>
                    <TableCell>{product.price} ج.م</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell className="space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="icon" onClick={() => openEditModal(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(product.id, product.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    لا توجد منتجات تطابق بحثك.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* --- نافذة الإضافة والتعديل --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg text-right">
          <DialogHeader>
            <DialogTitle>{modalMode === 'add' ? 'إضافة منتج جديد' : 'تعديل المنتج'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'add' ? 'أدخل تفاصيل المنتج الجديد.' : `أنت تقوم بتعديل "${currentProduct.name}".`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
            <div>
              <Label htmlFor="name">اسم المنتج</Label>
              <Input id="name" name="name" value={currentProduct.name} onChange={handleInputChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">السعر (ج.م)</Label>
                <Input id="price" name="price" type="number" value={currentProduct.price} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="stock">الكمية بالمخزون</Label>
                <Input id="stock" name="stock" type="number" value={currentProduct.stock} onChange={handleInputChange} />
              </div>
            </div>
             <div>
              <Label htmlFor="category">التصنيف</Label>
              <Input id="category" name="category" value={currentProduct.category} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" name="description" value={currentProduct.description} onChange={handleInputChange} />
            </div>
            <div>
              <Label>صورة المنتج</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
              {imagePreview && (
                <div className="mt-4 relative w-40 h-40">
                  <img src={imagePreview} alt="معاينة" className="rounded-md w-full h-full object-cover" />
                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => {setImagePreview(''); setImageFile(null);}}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {isUploading && <Progress value={uploadProgress} className="mt-2" />}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'جاري الرفع...' : (modalMode === 'add' ? 'إضافة المنتج' : 'حفظ التعديلات')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
