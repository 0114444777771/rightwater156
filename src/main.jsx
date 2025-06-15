// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
// استخدم مسارًا نسبيًا بدلاً من الاختصار
import App from './App.jsx'; 
// استخدم مسارًا نسبيًا بدلاً من الاختصار
import './index.css'; 
// استخدم مسارًا نسبيًا
import { AuthProvider } from './hooks/useAuth.jsx'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
