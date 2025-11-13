import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
    // **ROBUST SOLUTION:** Use AbortController for a clean 15-second timeout.
    // If the fetch hangs, it will abort and throw an error, which will be caught.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort(new Error("Connection to configuration server timed out after 15 seconds. Please check your network and try again."));
    }, 15000);

    const response = await fetch('/api/config', {
      signal: controller.signal
    });

    clearTimeout(timeoutId); // Clear the timeout if fetch completes successfully

    if (response.ok) {
        // Production environment: Get config from API
        firebaseConfig = await response.json();
        if (!firebaseConfig.apiKey) {
            throw new Error("API config from server is missing apiKey.");
        }
        console.log("Firebase config loaded from /api/config (Production Mode)");
    } else if (response.status === 404) {
        // Development environment (AI Studio): 404 is expected, use DUMMY config
        console.warn("Could not fetch /api/config (404). AI Studio environment detected. Initializing Firebase with a DUMMY config to allow the app to run. Auth features will be disabled.");
        firebaseConfig = {
            apiKey: "AIzaSy...",
            authDomain: "dummy-project.firebaseapp.com",
            projectId: "dummy-project",
            storageBucket: "dummy-project.appspot.com",
            messagingSenderId: "1234567890",
            appId: "1:1234567890:web:dummy",
        };
    } else {
        // Any other error (5xx, etc.) in production should be a hard failure.
        throw new Error(`Failed to fetch config from server. Status: ${response.status} ${response.statusText}`);
    }

    // Initialize Firebase with the determined config
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log("Firebase initialized successfully.");

  } catch (error) {
    console.error("Fatal error initializing Firebase:", error);
    // Re-throw the error so index.tsx can catch it and display the error message to the user.
    throw new Error(`Failed to initialize Firebase: ${(error as Error).message}`);
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
