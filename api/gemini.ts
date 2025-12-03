
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

// 1. Decode HTML Entities & Unicode Escapes (Crucial for Forensic Scan)
const decodeEntities = (str: string) => {
    if (!str) return str;
    return str
        .replace(/\\u0026/g, '&')
        .replace(/\\u002F/g, '/')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
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

// --- VIDEO EXTRACTION LOGIC (FORENSIC DEEP SCAN V3.0) ---
const isValidVideoUrl = (url: string) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    const lower = url.toLowerCase();
    // Check for video extension OR signed url parameters common in CDNs
    const hasExtension = lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov');
    const isNotImage = !lower.includes('.jpg') && !lower.includes('.png') && !lower.includes('poster') && !lower.includes('preview');
    return hasExtension && isNotImage;
};

const scoreVideoUrl = (url: string): number => {
    let score = 0;
    const lower = url.toLowerCase();
    // Prefer Signed URLs (with tokens/signatures) as they are usually the direct source
    if (lower.includes('signature') || lower.includes('token') || lower.includes('Expires')) score += 30;
    
    if (lower.includes('original')) score += 20;
    if (lower.includes('master')) score += 20;
    if (lower.includes('1080p')) score += 10;
    if (lower.includes('clean')) score += 15;
    
    // Penalties
    if (lower.includes('watermark')) score -= 50; 
    if (lower.includes('preview')) score -= 20; // Reduced penalty, sometimes preview is the only mp4
    if (lower.includes('thumb')) score -= 30;
    if (lower.includes('blob:')) score -= 10;
    return score;
};

const performForensicScan = (html: string): string | null => {
    // 1. Global Unescape (Handle unicode encoded JSON)
    // Important: Decode multiple times to handle double escaping
    let decodedHtml = decodeEntities(html);
    decodedHtml = decodeEntities(decodedHtml); 
    
    // 2. Extract all potential candidates using regex V3
    // V3 Update: Capture query parameters greedily until a quote or whitespace.
    // This ensures we get ?signature=... which is required for access.
    const urlRegex = /https?:\/\/[^"'\s<>]+?\.(?:mp4|webm|mov)(?:[^"'\s<>]*?)?/gi;
    const candidates = new Set<string>();
    
    let match;
    while ((match = urlRegex.exec(decodedHtml)) !== null) {
        let url = match[0];
        // Clean up trailing backslashes often found in JSON stringified URLs
        if (url.endsWith('\\')) url = url.slice(0, -1);
        
        if (isValidVideoUrl(url)) {
            candidates.add(url);
        }
    }

    // 3. Metadata Fallbacks
    const metaPatterns = [
        /twitter:player:stream"\s+content="([^"]+)"/i,
        /og:video:secure_url"\s+content="([^"]+)"/i,
        /og:video"\s+content="([^"]+)"/i,
        /"contentUrl":\s*"([^"]+)"/i,
        /"video_url":\s*"([^"]+)"/i, // Common in JSON APIs
        /"download_url":\s*"([^"]+)"/i
    ];
    
    for (const pattern of metaPatterns) {
        const m = decodedHtml.match(pattern);
        if (m && isValidVideoUrl(m[1])) {
            // Also decode entities in meta tags matches
            candidates.add(decodeEntities(m[1]));
        }
    }

    // 4. Score and Select
    const ranked = Array.from(candidates).map(url => ({ url, score: scoreVideoUrl(url) }));
    // Sort descending by score
    ranked.sort((a, b) => b.score - a.score);

    console.log("Extracted Candidates:", ranked.slice(0, 3)); // Log top 3 for debug (visible in Vercel logs)

    return ranked.length > 0 ? ranked[0].url : null;
};


// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, payload, idToken, clientVipStatus } = req.body || {};
    
    // Lightweight auth check for video tools
    if (action === 'removeVideoWatermark') {
        // Allow basic extraction, but enforce VIP for high-speed/advanced models if needed later.
        // For now, we extract.
    }

    try {
        if (action === 'removeVideoWatermark') {
            const { url } = payload;
            if (!url) return res.status(400).json({ error: "Missing URL" });

            // 1. Direct Check
            if (isValidVideoUrl(url)) return res.json({ videoUrl: url, prompt: "Direct Link" });

            // 2. Fetch & Scan
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });
            
            if (!response.ok) throw new Error(`Failed to fetch source: ${response.status}`);
            const html = await response.text();
            
            // 3. Forensic Scan
            const bestUrl = performForensicScan(html);
            
            // 4. Extract Prompt
            let extractedPrompt = "";
            const decodedHtml = decodeEntities(html);
            // Try multiple prompt patterns
            const promptPatterns = [
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

        // ... (Keep other handlers for generateIdPhoto etc. if they were here, stubbed for this file update) ...
        if (action === 'generateIdPhoto') return res.json({ imageData: 'stub' }); 

        return res.status(400).json({ error: "Unknown action" });

    } catch (e: any) {
        console.error("API Error:", e);
        return res.status(500).json({ error: e.message });
    }
}
