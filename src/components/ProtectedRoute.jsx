// Firestore Security Rules - Updated to use Custom Claims

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ===================================================================
    //  función de ayuda (Helper Function)
    // ===================================================================
    // هذه هي الوظيفة الأساسية للتحقق مما إذا كان المستخدم لديه صلاحيات الأدمن.
    // تبحث عن 'admin: true' في الـ token الخاص بالمستخدم.
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    // ===================================================================
    // Reglas para Productos (Products Collection)
    // ===================================================================
    match /products/{productId} {
      // السماح لأي شخص (زائر أو مستخدم) بقراءة المنتجات.
      // هذا ضروري لعرض المنتجات في متجرك.
      allow read: if true;

      // السماح فقط للأدمن بإنشاء، تعديل، أو حذف المنتجات.
      // 'write' تشمل 'create', 'update', و 'delete'.
      allow write: if isAdmin();
    }

    // ===================================================================
    // Reglas para Usuarios (Users Collection)
    // ===================================================================
    match /users/{userId} {
      // السماح للأدمن بقراءة أو تحديث بيانات أي مستخدم.
      // والسماح للمستخدم العادي بقراءة أو تحديث بياناته الشخصية فقط.
      allow read, update: if isAdmin() || request.auth.uid == userId;

      // السماح فقط للأدمن بإنشاء حسابات جديدة (إذا لزم الأمر) أو حذفها.
      allow create, delete: if isAdmin();
    }

    // ===================================================================
    // Reglas para Pedidos (Orders Collection)
    // ===================================================================
    match /orders/{orderId} {
      // السماح للأدمن بقراءة أي طلب.
      // والسماح للمستخدم بقراءة طلباته الخاصة فقط.
      // (يفترض أن كل مستند طلب يحتوي على حقل 'userId' مع UID الخاص بصاحب الطلب).
      allow read: if isAdmin() || request.auth.uid == resource.data.userId;
      
      // السماح للمستخدمين المسجلين بإنشاء طلبات جديدة.
      allow create: if request.auth != null;

      // السماح فقط للأدمن بتحديث (مثل تغيير حالة الطلب) أو حذف الطلبات.
      allow update, delete: if isAdmin();
    }
    
    // ===================================================================
    // Reglas para Estadísticas (Static Data - optional)
    // ===================================================================
    // هذه قاعدة اختيارية إذا كان لديك مجموعة لتخزين الإحصائيات
    // مثل إجمالي المبيعات أو عدد المستخدمين.
    match /statistics/{statId} {
        // فقط الأدمن يمكنه قراءة أو كتابة هذه البيانات الحساسة.
        allow read, write: if isAdmin();
    }

  }
}
