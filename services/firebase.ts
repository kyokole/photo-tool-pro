import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function will be called once when the application starts.
export const initializeFirebase = async () => {
  if (app) {
    return; // Already initialized
  }
  
  let firebaseConfig;

  try {
    // This fetch is now guarded by the master timeout in index.tsx
    const response = await fetch('/api/config');

    if (response.ok) {
        firebaseConfig = await response.json();
        if (!firebaseConfig.apiKey) {
            throw new Error("API config from server is missing apiKey.");
        }
        console.log("Firebase config loaded from /api/config (Production Mode)");
    } else if (response.status === 404) {
        console.warn("Could not fetch /api/config (404). Assuming development environment. Using dummy config.");
        firebaseConfig = {
            apiKey: "AIzaSy...",
            authDomain: "dummy-project.firebaseapp.com",
            projectId: "dummy-project",
            storageBucket: "dummy-project.appspot.com",
            messagingSenderId: "1234567890",
            appId: "1:1234567890:web:dummy",
        };
    } else {
        throw new Error(`Failed to fetch config from server. Status: ${response.status} ${response.statusText}`);
    }

    // **CRITICAL FIX**: Dynamically import Firebase SDKs.
    // This moves the network request for these scripts *inside* this async function,
    // so the master timeout in index.tsx can catch them if they hang.
    const { initializeApp } = await import("firebase/app");
    const { getAuth } = await import("firebase/auth");
    const { getFirestore } = await import("firebase/firestore");

    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");

  } catch (error) {
    // Re-throw the error to be caught by the master try/catch in index.tsx
    throw new Error(`Firebase initialization failed: ${(error as Error).message}`);
  }
};

// "Getter" functions to ensure initialized instances are always returned
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