import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình dự án Firebase của ứng dụng của bạn
// Đọc từ biến môi trường để tăng tính bảo mật và linh hoạt.
// FIX: Thêm các giá trị giữ chỗ (placeholder) để ứng dụng không bị lỗi
// khi chạy trong môi trường không có biến môi trường như AI Studio.
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "project-id.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "project-id",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "project-id.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:123456789012:web:xxxxxxxxxxxxxxxxxxxxxx"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ Firebase
// Quay lại sử dụng getAuth() để Firebase tự động xử lý cơ chế lưu trữ.
// Điều này tương thích tốt hơn với các môi trường sandbox bị hạn chế.
export const auth = getAuth(app);
export const db = getFirestore(app);
