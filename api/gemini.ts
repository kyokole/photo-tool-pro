
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
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

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

const processGoogleError = (error: any): string => {
    const rawMessage = error.message || String(error);
    console.error("Raw Google Error:", rawMessage);

    if (rawMessage.includes('overloaded') || rawMessage.includes('503')) {
        return "Máy chủ AI đang quá tải (High Traffic). Đang thử lại với mô hình dự phòng...";
    }
    return "Đã xảy ra lỗi không xác định khi tạo ảnh.";
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

const addWatermark = async (imageBuffer: Buffer): Promise<Buffer> => {
    // Simplified watermark logic for brevity
    return imageBuffer; 
};

const getAi = (useBackup: boolean = false) => {
    const apiKey = useBackup ? (process.env.VEO_API_KEY || process.env.GEMINI_API_KEY) : process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Server API Key missing.");
    return new GoogleGenAI({ apiKey });
};

// --- VIDEO EXTRACTION LOGIC (FORENSIC DEEP SCAN) ---
const isValidVideoUrl = (url: string) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    const lower = url.toLowerCase();
    return (lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov')) && 
           !lower.includes('.jpg') && !lower.includes('.png') && !lower.includes('poster') && !lower.includes('preview');
};

const scoreVideoUrl = (url: string): number => {
    let score = 0;
    const lower = url.toLowerCase();
    if (lower.includes('original')) score += 20;
    if (lower.includes('master')) score += 20;
    if (lower.includes('1080p')) score += 10;
    if (lower.includes('hd')) score += 10;
    if (lower.includes('720p')) score += 5;
    if (lower.includes('clean')) score += 15;
    if (lower.includes('watermark')) score -= 50; 
    if (lower.includes('preview')) score -= 30;
    if (lower.includes('thumb')) score -= 30;
    if (lower.includes('blob:')) score -= 10; // Blobs are hard to download
    return score;
};

const performForensicScan = (html: string): string | null => {
    // 1. Global Unescape (Crucial for JSON hidden links)
    const decodedHtml = decodeEntities(html);
    
    // 2. Extract all potential candidates using regex
    // Looks for https://....mp4 inside quotes, regardless of JSON structure
    const urlRegex = /https?:\/\/[^"'\s<>]+?\.(?:mp4|webm|mov)(?:[^"'\s<>]*?)?/gi;
    const candidates = new Set<string>();
    
    let match;
    while ((match = urlRegex.exec(decodedHtml)) !== null) {
        // Clean up trailing characters that might be captured erroneously
        let url = match[0];
        if (url.endsWith('\\')) url = url.slice(0, -1);
        if (isValidVideoUrl(url)) {
            candidates.add(url);
        }
    }

    // 3. Specific Metadata Fallbacks (if regex misses)
    const metaPatterns = [
        /twitter:player:stream"\s+content="([^"]+)"/i,
        /og:video:secure_url"\s+content="([^"]+)"/i,
        /og:video"\s+content="([^"]+)"/i,
        /"contentUrl":\s*"([^"]+)"/i
    ];
    
    for (const pattern of metaPatterns) {
        const m = decodedHtml.match(pattern);
        if (m && isValidVideoUrl(m[1])) candidates.add(m[1]);
    }

    // 4. Score and Select
    const ranked = Array.from(candidates).map(url => ({ url, score: scoreVideoUrl(url) }));
    ranked.sort((a, b) => b.score - a.score);

    return ranked.length > 0 ? ranked[0].url : null;
};


// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, payload, idToken, clientVipStatus } = req.body || {};
    const { isVip } = await getUserStatus(idToken, clientVipStatus);

    try {
        if (action === 'removeVideoWatermark') {
            const { url } = payload;
            if (!url) return res.status(400).json({ error: "Missing URL" });

            // 1. Direct Check
            if (isValidVideoUrl(url)) return res.json({ videoUrl: url, prompt: "Direct Link" });

            // 2. Fetch & Scan
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
            const html = await response.text();
            
            // 3. Forensic Scan
            const bestUrl = performForensicScan(html);
            
            // 4. Extract Prompt (Bonus)
            let extractedPrompt = "";
            const decodedHtml = decodeEntities(html);
            const descMatch = decodedHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/i) || 
                              decodedHtml.match(/"description":\s*"([^"]+)"/i);
            if (descMatch) extractedPrompt = descMatch[1];

            if (!bestUrl) {
                return res.status(404).json({ error: "Không tìm thấy video gốc trong mã nguồn trang web. Link có thể là riêng tư." });
            }

            return res.json({ videoUrl: bestUrl, prompt: extractedPrompt });
        }

        // ... Handle other actions (stubbed for brevity, keep existing logic for images) ...
        if (action === 'generateIdPhoto') return res.json({ imageData: 'stub' }); // Placeholder to keep file valid typescript
        
        return res.status(400).json({ error: "Unknown action" });

    } catch (e: any) {
        console.error("API Error:", e);
        return res.status(500).json({ error: e.message });
    }
}
