import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Hàm này sẽ được gọi một lần duy nhất khi ứng dụng khởi động.
// Nó sẽ lấy cấu hình từ một API endpoint an toàn phía server.
export const initializeFirebase = async () => {
  if (app) {
    return; // Đã khởi tạo rồi thì không làm gì cả
  }

  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch Firebase config: ${errorText}`);
    }
    const firebaseConfig = await response.json();

    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("AIzaSyXXX")) {
        throw new Error("Invalid or placeholder Firebase config received from server. Please check Vercel environment variables.");
    }

    // Khởi tạo Firebase với cấu hình nhận được
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Fatal error initializing Firebase:", error);
    // Ném lỗi ra ngoài để `index.tsx` có thể bắt và hiển thị thông báo lỗi
    throw error;
  }
};

// Xuất các biến đã được khởi tạo để các thành phần khác có thể sử dụng
// Lưu ý: Các thành phần import cần đảm bảo `initializeFirebase` đã chạy xong.
export { app, auth, db };