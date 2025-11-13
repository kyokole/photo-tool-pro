import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// A promise wrapper to add a definitive timeout to any async operation.
const promiseWithTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  timeoutError = new Error('Promise timed out')
): Promise<T> => {
  // Create a new promise that races the original promise and a timeout.
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(timeoutError);
    }, ms);
  });

  return Promise.race([promise, timeout]);
};

// This function will be called once when the application starts.
export const initializeFirebase = async () => {
  if (app) {
    return; // Already initialized
  }

  // The entire initialization process, including network requests and SDK setup,
  // is wrapped in a hard 20-second timeout.
  const initializationProcess = async () => {
    // We keep the inner AbortController for a more specific fetch-related error message.
    const controller = new AbortController();
    const fetchTimeoutId = setTimeout(() => {
        controller.abort(new Error("Connection to configuration server timed out after 15 seconds."));
    }, 15000);

    let firebaseConfig;
    
    try {
        const response = await fetch('/api/config', { signal: controller.signal });
        clearTimeout(fetchTimeoutId); // Clear the specific fetch timeout if it succeeds

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

        // Initialize Firebase. These sync calls are now protected by the outer timeout.
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized successfully.");

    } catch (error) {
        // Clear any lingering timeout and re-throw the error to be caught by the outer handler.
        clearTimeout(fetchTimeoutId);
        throw new Error(`Firebase initialization failed: ${(error as Error).message}`);
    }
  };

  try {
    // Apply the master timeout to the entire process.
    await promiseWithTimeout(
      initializationProcess(),
      20000, // 20-second overall timeout
      new Error("Firebase initialization process took too long. This might be due to a poor network connection or a service outage.")
    );
  } catch (error) {
     console.error("Fatal error during Firebase initialization:", error);
     // Re-throw the final, clear error message for index.tsx to catch and display to the user.
     throw error;
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
