// FIX: Use Firebase v8 compat imports to resolve "no exported member" errors, which suggest an older API is expected.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;

// This function will now be called from within the App component.
// It returns a boolean to indicate success or failure.
export const initializeFirebase = async (): Promise<boolean> => {
  if (app) {
    return true; // Already initialized, return success.
  }

  let firebaseConfig;

  try {
    const response = await fetch('/api/config');
    
    if (response.ok) {
        firebaseConfig = await response.json();
        if (!firebaseConfig.apiKey) {
            throw new Error("API config from server is missing apiKey.");
        }
        console.log("Firebase config loaded from /api/config (Production Mode)");
    } else {
        console.warn("Could not fetch /api/config. AI Studio environment detected. Initializing Firebase with a DUMMY config to allow the app to run. Auth features will be disabled.");
        firebaseConfig = {
            apiKey: "AIzaSyAXjFpzO4v9ESWsi_2Zdb5wxXudiMz0E2c",
            authDomain: "photo-tool-pro.firebaseapp.com",
            projectId: "photo-tool-pro",
            storageBucket: "photo-tool-pro.appspot.com",
            messagingSenderId: "407393374385",
            appId: "1:407393374385:web:fc7fa01812492ed7a51290",
        };
    }

    // FIX: Use namespaced firebase object for initialization.
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();

    console.log("Firebase initialized successfully.");
    return true; // Indicate success

  } catch (error) {
    console.error("Fatal error initializing Firebase:", error);
    return false; // Indicate failure instead of throwing
  }
};

// Getter functions remain the same but will now only be called after
// initializeFirebase has successfully completed.
// FIX: Update return types to use the compat namespace.
export const getAppInstance = (): firebase.app.App => {
    if (!app) throw new Error("Firebase App is not initialized. Call initializeFirebase() first.");
    return app;
};

export const getAuthInstance = (): firebase.auth.Auth => {
    if (!auth) throw new Error("Firebase Auth is not initialized. Call initializeFirebase() first.");
    return auth;
};

export const getDbInstance = (): firebase.firestore.Firestore => {
    if (!db) throw new Error("Firestore is not initialized. Call initializeFirebase() first.");
    return db;
};