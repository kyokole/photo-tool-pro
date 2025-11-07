import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình dự án Firebase của ứng dụng của bạn
// Đọc từ biến môi trường để tăng tính bảo mật và linh hoạt.
// Xem: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  // FIX: Cast `import.meta` to `any` to resolve TypeScript error "Property 'env' does not exist on type 'ImportMeta'". Vite exposes environment variables on this object.
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ Firebase
// Quay lại sử dụng getAuth() để Firebase tự động xử lý cơ chế lưu trữ.
// Điều này tương thích tốt hơn với các môi trường sandbox bị hạn chế.
export const auth = getAuth(app);
export const db = getFirestore(app);