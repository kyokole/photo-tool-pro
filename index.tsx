import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Wrap the startup in an async function to allow for dynamic imports inside the try/catch block.
// This is critical for catching module-level errors (e.g., from Firebase initialization).
async function main() {
  try {
    // Dynamically import the App component. This ensures that any errors during its module evaluation
    // (including its dependencies like firebase.ts) are caught by this try...catch block.
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
  } catch (error) {
    console.error("Fatal error during application startup:", error);
    const preloader = document.getElementById('preloader');
    if (preloader) {
      // Stop the spinner animation
      const spinner = preloader.querySelector('.spinner');
      if (spinner) {
        (spinner as HTMLElement).style.display = 'none';
      }
      
      // Display an informative error message
      preloader.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #ff8a8a; font-family: sans-serif; max-width: 600px; margin: auto;">
            <h1 style="font-size: 24px; margin-bottom: 10px;">Lỗi Khởi Động Ứng Dụng</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">Không thể tải ứng dụng. Nguyên nhân phổ biến nhất là do cấu hình sai <strong>biến môi trường (Environment Variables)</strong>. Vui lòng kiểm tra lại các key Firebase trong cài đặt dự án của bạn và deploy lại.</p>
            <pre style="background: #2d2d2d; color: #ccc; padding: 15px; border-radius: 5px; text-align: left; white-space: pre-wrap; word-wrap: break-word; font-size: 12px; max-height: 200px; overflow-y: auto;">${(error as Error).stack || (error as Error).message}</pre>
        </div>
      `;
    }
  }
}

// Run the application startup logic.
main();
