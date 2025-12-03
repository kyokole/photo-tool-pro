
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
    try {
        // Decode unicode escapes (e.g., \u002F -> /)
        let decoded = str.replace(/\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
        // Decode escaped slashes (e.g., \/ -> /)
        decoded = decoded.replace(/\\+\//g, '/');
        // Decode standard HTML entities
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

// --- VIDEO EXTRACTION LOGIC (BRUTE FORCE STRING HUNTER v4.0) ---
const isValidVideoUrl = (url: string) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    const lower = url.toLowerCase();
    // Check for video extension OR signed url parameters common in CDNs
    const hasExtension = lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov');
    const isNotImage = !lower.includes('.jpg') && !lower.includes('.png') && !lower.includes('poster') && !lower.includes('preview') && !lower.includes('thumbnail');
    return hasExtension && isNotImage;
};

const scoreVideoUrl = (url: string): number => {
    let score = 0;
    const lower = url.toLowerCase();
    
    // Prefer Signed URLs (with tokens/signatures)
    if (lower.includes('signature') || lower.includes('token') || lower.includes('expires') || lower.includes('key=')) score += 50;
    
    // Prefer High Quality keywords
    if (lower.includes('original')) score += 30;
    if (lower.includes('master')) score += 30;
    if (lower.includes('1080p')) score += 20;
    if (lower.includes('clean')) score += 20;
    if (lower.includes('hd')) score += 10;
    
    // Penalties
    if (lower.includes('watermark')) score -= 50; 
    if (lower.includes('preview')) score -= 20;
    if (lower.includes('thumb')) score -= 40;
    if (lower.includes('small')) score -= 20;
    if (lower.includes('blob:')) score -= 100; // Blobs are useless for backend
    
    // Prefer longer URLs (usually implies signed tokens)
    if (url.length > 150) score += 10;
    
    return score;
};

const performBruteForceScan = (html: string): string | null => {
    // 1. Decode heavily to handle double/triple escaping in JSON strings
    let processingHtml = html;
    
    // Regex to find ANYTHING that looks like a video URL
    // Matches https:// followed by non-whitespace/quotes, ending in mp4/webm/mov plus potential query params
    // We are very aggressive here: capture until we hit a quote or whitespace.
    const bruteRegex = /https?:\\?\/\\?\/[^"'\s<>]+\.(?:mp4|webm|mov)(?:[^"'\s<>]*?)?/gi;
    
    const candidates = new Set<string>();
    
    let match;
    while ((match = bruteRegex.exec(processingHtml)) !== null) {
        let url = match[0];
        
        // CLEANUP: Remove backslashes from JSON escaping (e.g. https:\/\/ -> https://)
        url = url.replace(/\\/g, '');
        
        // VALIDATION
        if (isValidVideoUrl(url)) {
            candidates.add(url);
        }
    }

    // 2. If Brute Force fails, try specific OpenGraph/Twitter tags (decoded)
    const decodedHtml = decodeEntities(html);
    const metaPatterns = [
        /twitter:player:stream"\s+content="([^"]+)"/i,
        /og:video:secure_url"\s+content="([^"]+)"/i,
        /og:video"\s+content="([^"]+)"/i,
        /"contentUrl":\s*"([^"]+)"/i
    ];
    
    for (const pattern of metaPatterns) {
        const m = decodedHtml.match(pattern);
        if (m) {
            let url = m[1].replace(/\\/g, '');
            if (isValidVideoUrl(url)) candidates.add(url);
        }
    }

    console.log(`[Extract] Found ${candidates.size} candidates.`);

    // 3. Score and Select
    const ranked = Array.from(candidates).map(url => ({ url, score: scoreVideoUrl(url) }));
    // Sort descending by score
    ranked.sort((a, b) => b.score - a.score);

    if (ranked.length > 0) {
        console.log("[Extract] Top Winner:", ranked[0]);
        return ranked[0].url;
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

            // 1. Fetch Source
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.google.com/'
                }
            });
            
            if (!response.ok) throw new Error(`Failed to fetch source: ${response.status}`);
            const html = await response.text();
            
            // 2. Brute Force Scan
            const bestUrl = performBruteForceScan(html);
            
            // 3. Extract Prompt (Best Effort)
            let extractedPrompt = "";
            const decodedHtml = decodeEntities(html);
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

        // ... (Other handlers) ...
        if (action === 'generateIdPhoto') return res.json({ imageData: 'stub' }); 

        return res.status(400).json({ error: "Unknown action" });

    } catch (e: any) {
        console.error("API Error:", e);
        return res.status(500).json({ error: e.message });
    }
}
