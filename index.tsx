import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { initializeFirebase } from './services/firebase';

// A robust promise wrapper to add a definitive timeout to any async operation.
const promiseWithTimeout = <T,>(
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


// Wrap the startup in an async function to allow for dynamic imports inside the try/catch block.
// This is critical for catching module-level errors (e.g., from Firebase initialization).
async function main() {
  const preloader = document.getElementById('preloader');

  try {
    // Define the entire startup sequence as a single async operation.
    const startupPromise = (async () => {
      // **CRITICAL STEP 1:** Wait for Firebase to initialize.
      // This now includes fetching config AND downloading the Firebase SDK scripts.
      await initializeFirebase();

      // **CRITICAL STEP 2:** Dynamically import the App component.
      // This waits for App.tsx and all its dependencies (like firebase/auth) to download.
      const App = (await import('./App')).default;

      const rootElement = document.getElementById('root');
      if (!rootElement) {
        throw new Error("Could not find root element to mount to");
      }

      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
        </React.StrictMode>
      );
    })();
    
    // **MASTER TIMEOUT:** Apply a single, robust timeout to the entire startup process.
    // This will catch hangs from ANY network request (config, SDKs, App code).
    await promiseWithTimeout(
        startupPromise,
        30000, // 30-second timeout, generous for slow mobile networks
        new Error("Application startup timed out after 30 seconds. This is likely due to a poor network connection. Please check your connection and refresh.")
    );


    // The app has been successfully mounted. Now, we can safely remove the preloader.
    if (preloader) {
        preloader.classList.add('loaded');
        setTimeout(() => {
            preloader.remove();
        }, 500); // Wait for the fade-out animation to complete
    }

  } catch (e) {
    console.error("Fatal error during application startup:", e);
    if (preloader) {
      // Stop the spinner animation
      const spinner = preloader.querySelector('.spinner');
      if (spinner) {
        (spinner as HTMLElement).style.display = 'none';
      }
      
      // Display an informative error message
      preloader.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #ff8a8a; font-family: sans-serif; max-width: 600px; margin: auto;">
            <h1 style="font-size: 24px; margin-bottom: 10px;">Application Startup Error</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">Could not load the application. The most common cause is a misconfiguration of <strong>Environment Variables</strong>. Please double-check your Firebase keys in your project settings and redeploy.</p>
            <pre style="background: #2d2d2d; color: #ccc; padding: 15px; border-radius: 5px; text-align: left; white-space: pre-wrap; word-wrap: break-word; font-size: 12px; max-height: 200px; overflow-y: auto;">${(e as Error).stack || (e as Error).message}</pre>
        </div>
      `;
    }
  }
}

// Run the application startup logic.
main();