import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình dự án Firebase của ứng dụng của bạn
// Xem: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyAXjFpzO4v9ESWsi_2Zdb5wxXudiMz0E2c",
  authDomain: "photo-tool-pro.firebaseapp.com",
  projectId: "photo-tool-pro",
  storageBucket: "photo-tool-pro.firebasestorage.app",
  messagingSenderId: "407393374385",
  appId: "1:407393374385:web:fc7fa01812492ed7a51290"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ Firebase
// Quay lại sử dụng getAuth() để Firebase tự động xử lý cơ chế lưu trữ.
// Điều này tương thích tốt hơn với các môi trường sandbox bị hạn chế.
export const auth = getAuth(app);
export const db = getFirestore(app);
