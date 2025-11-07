import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình dự án Firebase của ứng dụng của bạn
// Đọc từ biến môi trường để tăng tính bảo mật và linh hoạt.
// Xem: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  // FIX: Removed "VITE_" prefix to align with standard environment variable injection on the platform.
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ Firebase
// Quay lại sử dụng getAuth() để Firebase tự động xử lý cơ chế lưu trữ.
// Điều này tương thích tốt hơn với các môi trường sandbox bị hạn chế.
export const auth = getAuth(app);
export const db = getFirestore(app);