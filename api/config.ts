// /api/config.ts
// This is a Vercel Serverless Function to securely provide Firebase config to the frontend.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure this is only a GET request for security
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // These variables are securely stored in Vercel's environment variables.
  // The frontend fetches this endpoint to get the configuration it needs.
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
  
  // Basic validation to ensure variables are present on the server
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
     return res.status(500).json({ error: 'Firebase configuration is missing on the server. Please check Vercel environment variables.' });
  }

  // Send the public configuration to the client
  res.status(200).json(firebaseConfig);
}