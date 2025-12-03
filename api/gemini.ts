
// /api/gemini.ts
import { GoogleGenAI, Modality, Part } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';

// --- CONSTANTS ---
const MODEL_PRO = 'gemini-3-pro-image-preview';
const MODEL_FLASH = 'gemini-2.5-flash-image';
const TEXT_MODEL = 'gemini-2.5-flash';
const VEO_MODEL = 'veo-3.1-fast-generate-preview';

// --- INIT FIREBASE ADMIN ---
let isFirebaseInitialized = false;
try {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (serviceAccountJson) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccountJson))
            });
            isFirebaseInitialized = true;
        } else {
            console.warn("Warning: FIREBASE_SERVICE_ACCOUNT_JSON is missing. Server cannot verify ID tokens.");
        }
    } else {
        isFirebaseInitialized = true;
    }
} catch (error: any) {
    console.error("Firebase Init Error:", error.message);
}

// --- HELPER FUNCTIONS ---

// 1. Decode HTML Entities & Unicode Escapes
const decodeEntities = (str: string) => {
    if (!str) return str;
    try {
        let decoded = str.replace(/\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
        decoded = decoded.replace(/\\+\//g, '/');
        decoded = decoded
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        return decoded;
    } catch (e) {
        return str;
    }
};

const getUserStatus = async (idToken?: string, clientVipStatus?: boolean) => {
    if (!idToken) return { isVip: false, isAdmin: false, uid: null, credits: 0 };
    if (isFirebaseInitialized) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;
            const db = admin.firestore();
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            if (!userDoc.exists) return { isVip: !!clientVipStatus, isAdmin: false, uid, credits: 0 };
            const userData = userDoc.data();
            const isAdmin = userData?.isAdmin === true;
            let isVip = isAdmin;
            if (!isVip && userData?.subscriptionEndDate) {
                const expiryDate = new Date(userData.subscriptionEndDate);
                if (expiryDate > new Date()) isVip = true;
            }
            return { isVip, isAdmin, uid, credits: userData?.credits || 0 };
        } catch (error) { console.error("Server Auth Error:", error); }
    }
    return { isVip: !!clientVipStatus, isAdmin: false, uid: 'fallback', credits: 0 };
};

const getAi = (useBackup: boolean = false) => {
    const apiKey = useBackup ? (process.env.VEO_API_KEY || process.env.GEMINI_API_KEY) : process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Server API Key missing.");
    return new GoogleGenAI({ apiKey });
};

// --- VIDEO EXTRACTION LOGIC (SOCIAL GRAPH EXTRACTION) ---
const isValidVideoUrl = (url: string) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    const lower = url.toLowerCase();
    // Check common video extensions or signed url patterns
    const hasExtension = lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov') || lower.includes('.m3u8');
    // If no extension, check if it looks like a signed CDN link (often has huge tokens)
    const isSignedCdn = lower.includes('token') || lower.includes('signature') || lower.includes('expires');
    
    const isNotImage = !lower.includes('.jpg') && !lower.includes('.png') && !lower.includes('poster') && !lower.includes('preview') && !lower.includes('thumbnail');
    return (hasExtension || isSignedCdn) && isNotImage;
};

const extractVideoFromMeta = (html: string): string | null => {
    // Priority 1: OpenGraph Video (The Gold Standard for Social Sharing)
    const ogVideoMatch = html.match(/<meta\s+property="og:video(?::secure_url)?"\s+content="([^"]+)"/i) || 
                         html.match(/<meta\s+content="([^"]+)"\s+property="og:video(?::secure_url)?"/i);
    if (ogVideoMatch && isValidVideoUrl(ogVideoMatch[1])) return decodeEntities(ogVideoMatch[1]);

    // Priority 2: Twitter Player Stream
    const twitterMatch = html.match(/<meta\s+name="twitter:player:stream"\s+content="([^"]+)"/i) ||
                         html.match(/<meta\s+content="([^"]+)"\s+name="twitter:player:stream"/i);
    if (twitterMatch && isValidVideoUrl(twitterMatch[1])) return decodeEntities(twitterMatch[1]);

    // Priority 3: JSON-LD or Script Variables (Common in React Apps)
    // Look for any string inside JSON that looks like a video URL
    const jsonUrlMatch = html.match(/"(https?:\\?\/\\?\/[^"]+?\.(?:mp4|webm|mov)(?:\\?[^"]*)?)"/i);
    if (jsonUrlMatch) {
        // Unescape JSON slashes
        const rawUrl = jsonUrlMatch[1].replace(/\\/g, '');
        if (isValidVideoUrl(rawUrl)) return decodeEntities(rawUrl);
    }
    
    return null;
};

// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, payload, idToken, clientVipStatus } = req.body || {};
    
    try {
        if (action === 'removeVideoWatermark') {
            const { url } = payload;
            if (!url) return res.status(400).json({ error: "Missing URL" });

            // 1. Fetch Source using Social Bot User-Agent
            // This forces sites like Sora/Veo to render server-side meta tags for preview
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });
            
            if (!response.ok) throw new Error(`Failed to fetch source: ${response.status}`);
            const html = await response.text();
            
            // 2. Extract Best Video URL
            const bestUrl = extractVideoFromMeta(html);
            
            // 3. Extract Prompt (Best Effort)
            let extractedPrompt = "";
            const decodedHtml = decodeEntities(html);
            const promptPatterns = [
                /<meta\s+property="og:description"\s+content="([^"]+)"/i,
                /<meta\s+name="description"\s+content="([^"]+)"/i,
                /"description":\s*"([^"]+)"/i,
                /"prompt":\s*"([^"]+)"/i,
                /<title>([^<]+)<\/title>/i
            ];
            
            for (const p of promptPatterns) {
                const m = decodedHtml.match(p);
                if (m) {
                    extractedPrompt = m[1].replace(' | Sora', '').replace(' - OpenAI', '').trim();
                    break;
                }
            }

            if (!bestUrl) {
                return res.status(404).json({ error: "Không tìm thấy video gốc. Link có thể là riêng tư hoặc bị giới hạn địa lý." });
            }

            return res.json({ videoUrl: bestUrl, prompt: extractedPrompt });
        }

        // ... (Other handlers) ...
        if (action === 'generateIdPhoto') return res.json({ imageData: 'stub' }); 

        return res.status(400).json({ error: "Unknown action" });

    } catch (e: any) {
        console.error("API Error:", e);
        return res.status(500).json({ error: e.message });
    }
}
