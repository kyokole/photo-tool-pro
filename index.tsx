// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { initializeFirebase } from './services/firebase';

/**
 * This is the ultimate, bulletproof entry point for the application.
 * It wraps the entire startup process in a simple try/catch block.
 * Crucially, it dynamically imports the main App component. This ensures that ANY error
 * that occurs during the static import phase of any file in the App's dependency tree
 * will be caught here as a promise rejection, rather than causing a silent browser hang.
 */
async function startup() {
  try {
    // Initialize services that must be ready before the app renders.
    // Any failure here will be caught below.
    await initializeFirebase();

    // Dynamically import the main App component. This is the key to catching all module-level errors.
    const App = (await import('./App')).default;

    const rootElement = document.getElementById('root');
    if (!rootElement) {
      // This is a fatal, non-recoverable error.
      throw new Error("Root element '#root' not found in the DOM.");
    }

    // Render the app.
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </React.StrictMode>
    );

    // If we reach this point, the app has started successfully.
    // We can now safely remove the preloader.
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('loaded');
      // Remove from DOM after fade-out animation
      setTimeout(() => preloader.remove(), 500);
    }

  } catch (error) {
    // This is the global error handler. It will catch ANY error during startup.
    // It directly manipulates the DOM to display the error, ensuring it's always visible.
    console.error("A fatal error occurred during application startup:", error);
    
    const preloader = document.getElementById('preloader');
    if (preloader) {
      // Remove the spinning animation and replace content with a detailed error message.
      // This fulfills the user's request to "remove the loading circle" to see the real error.
      preloader.innerHTML = `
        <div style="font-family: 'Inter', sans-serif; color: #c9d1d9; text-align: center; padding: 20px; max-width: 800px; margin: auto;">
          <h1 style="color: #f85149; font-size: 24px;">Application Failed to Start</h1>
          <p style="color: #8b949e; margin-top: 8px;">A critical error prevented the application from loading. Please check the details below and contact support if the issue persists.</p>
          <pre style="background: #161b22; border: 1px solid #30363d; color: #c9d1d9; padding: 15px; border-radius: 6px; text-align: left; white-space: pre-wrap; word-break: break-all; font-size: 13px; margin-top: 20px; max-height: 400px; overflow-y: auto;">${(error as Error).stack || (error as Error).message}</pre>
        </div>
      `;
    }
  }
}

// Execute the startup function.
startup();
