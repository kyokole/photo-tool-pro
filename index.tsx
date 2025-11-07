import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';


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

// Gracefully hide the preloader after the app is mounted
const preloader = document.getElementById('preloader');
if (preloader) {
  // Add a class to trigger the fade-out animation
  preloader.classList.add('loaded');
  // Optional: Remove the preloader from the DOM after the animation completes
  setTimeout(() => {
    preloader.remove();
  }, 500); // Should match the transition duration in CSS
}