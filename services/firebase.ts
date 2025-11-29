import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, runTransaction } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Hàm này sẽ được gọi một lần duy nhất khi ứng dụng khởi động.
export const initializeFirebase = async () => {
  if (app) {
    return; // Đã khởi tạo rồi thì không làm gì cả
  }

  let firebaseConfig;

  try {
    // 1. Cố gắng lấy cấu hình từ Vercel Serverless Function (dành cho production)
    const response = await fetch('/api/config');
    
    if (response.ok) {
        // Nếu thành công (đang chạy trên Vercel), lấy config từ API
        firebaseConfig = await response.json();
        if (!firebaseConfig.apiKey) {
            throw new Error("API config from server is missing apiKey.");
        }
        console.log("Firebase config loaded from /api/config (Production Mode)");
    } else {
        // 2. Nếu thất bại (lỗi 404 trong AI Studio), sử dụng DUMMY config
        console.warn("Could not fetch /api/config. AI Studio environment detected. Initializing Firebase with a DUMMY config to allow the app to run. Auth features will be disabled.");
        firebaseConfig = {
            apiKey: "AIzaSy...",
            authDomain: "dummy-project.firebaseapp.com",
            projectId: "dummy-project",
            storageBucket: "dummy-project.appspot.com",
            messagingSenderId: "1234567890",
            appId: "1:1234567890:web:dummy",
        };
    }

    // 3. Khởi tạo Firebase với cấu hình đã có
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log("Firebase initialized successfully.");

  } catch (error) {
    console.error("Fatal error initializing Firebase:", error);
    // Ném lỗi ra ngoài để `index.tsx` có thể bắt và hiển thị thông báo lỗi
    throw new Error(`Failed to initialize Firebase: ${(error as Error).message}`);
  }
};

// Các hàm "getter" để đảm bảo luôn trả về instance đã được khởi tạo
export const getAppInstance = (): FirebaseApp => {
    if (!app) throw new Error("Firebase App is not initialized. Call initializeFirebase() first.");
    return app;
};

export const getAuthInstance = (): Auth => {
    if (!auth) throw new Error("Firebase Auth is not initialized. Call initializeFirebase() first.");
    return auth;
};

export const getDbInstance = (): Firestore => {
    if (!db) throw new Error("Firestore is not initialized. Call initializeFirebase() first.");
    return db;
};

/**
 * Trừ credit của người dùng hiện tại (Client-side Transaction)
 * Đảm bảo tính nhất quán và cập nhật UI ngay lập tức.
 */
export const deductUserCredits = async (cost: number): Promise<void> => {
    if (!auth?.currentUser || !db) return; 
    const userRef = doc(db, "users", auth.currentUser.uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User document does not exist!");
            }

            const userData = userDoc.data();
            const currentCredits = userData.credits || 0;
            
            // Kiểm tra VIP/Admin
            const isAdmin = userData.isAdmin === true;
            const expiryDate = new Date(userData.subscriptionEndDate || 0);
            const isVip = isAdmin || (expiryDate > new Date());

            if (isVip) {
                return; // VIP không bị trừ
            }

            if (currentCredits < cost) {
                throw new Error("INSUFFICIENT_CREDITS");
            }

            transaction.update(userRef, { credits: currentCredits - cost });
        });
    } catch (e: any) {
        console.error("Credit deduction failed:", e);
        throw e;
    }
};

/**
 * Hoàn tiền credit cho người dùng (Sử dụng khi API lỗi)
 * Đây là logic "Optimistic UI Rollback" quan trọng.
 */
export const refundUserCredits = async (amount: number): Promise<void> => {
    if (!auth?.currentUser || !db) return;
    const userRef = doc(db, "users", auth.currentUser.uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) return;

            const userData = userDoc.data();
            // Chỉ hoàn tiền nếu không phải VIP (vì VIP không bị trừ lúc đầu)
            const isAdmin = userData.isAdmin === true;
            const expiryDate = new Date(userData.subscriptionEndDate || 0);
            const isVip = isAdmin || (expiryDate > new Date());

            if (!isVip) {
                const currentCredits = userData.credits || 0;
                transaction.update(userRef, { credits: currentCredits + amount });
                console.log(`[Billing System] Refunded ${amount} credits due to generation failure.`);
            }
        });
    } catch (e) {
        console.error("FATAL: Failed to refund credits:", e);
        // Lỗi hoàn tiền là lỗi nghiêm trọng, nên log lại để xử lý thủ công nếu cần
    }
};