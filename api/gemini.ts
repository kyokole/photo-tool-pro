
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

// 1. Advanced Decode HTML Entities
const decodeEntities = (str: string) => {
    if (!str) return str;
    try {
        // Decode standard HTML entities
        let decoded = str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
            
        // Decode Unicode escapes often found in JSON (\u002F -> /)
        decoded = decoded.replace(/\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
        
        // Clean escaped slashes commonly found in JSON strings (http:\/\/ -> http://)
        decoded = decoded.replace(/\\+\//g, '/');
        
        return decoded;
    } catch (e) {
        return str;
    }
};

// 2. Strict URL Validation & Cleaning
const isValidVideoUrl = (url: string) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    const lower = url.toLowerCase();
    
    // Must look like a video file or a signed content link
    const isVideoFile = lower.match(/\.(mp4|webm|mov|m3u8)(\?|$)/);
    const isSignedLink = lower.includes('signature') || lower.includes('token') || lower.includes('expires') || lower.includes('video');
    
    // Must NOT be an image
    const isImage = lower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/) || lower.includes('thumbnail') || lower.includes('poster') || lower.includes('preview_image');

    return (isVideoFile || isSignedLink) && !isImage;
};

// --- DEEP EXTRACTION ENGINE ---

// Strategy A: JSON-LD Structured Data (The most reliable "Pro" method)
const extractFromJsonLd = (html: string): string | null => {
    try {
        const matches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
        if (!matches) return null;

        for (const match of matches) {
            const jsonStr = match.replace(/<script type="application\/ld\+json">|<\/script>/g, '');
            try {
                const data = JSON.parse(jsonStr);
                // Check for VideoObject
                if (data['@type'] === 'VideoObject' || data['@type'] === 'SocialMediaPosting') {
                    if (data.contentUrl && isValidVideoUrl(data.contentUrl)) return data.contentUrl;
                    if (data.embedUrl && isValidVideoUrl(data.embedUrl)) return data.embedUrl;
                }
                // Check nested structures
                if (Array.isArray(data)) {
                    const video = data.find(item => item['@type'] === 'VideoObject');
                    if (video && video.contentUrl) return video.contentUrl;
                }
            } catch (e) { continue; }
        }
    } catch (e) { console.error("JSON-LD parsing error", e); }
    return null;
};

// Strategy B: Hydration Data Mining (Searching inside __NEXT_DATA__ or React props)
const extractFromScriptVariables = (html: string): string | null => {
    // Pattern to find URLs ending in video extensions inside JSON-like structures
    // Looks for: "key": "https://...mp4"
    const regex = /"(?:url|src|contentUrl|playbackUrl|downloadUrl|video_url)":"(https?:[^"]+?\.(?:mp4|webm|mov)[^"]*)"/gi;
    
    let match;
    while ((match = regex.exec(html)) !== null) {
        const rawUrl = match[1];
        const cleanUrl = decodeEntities(rawUrl);
        if (isValidVideoUrl(cleanUrl)) {
            return cleanUrl;
        }
    }
    
    // Fallback: Search for any string that looks like a high-quality MP4 URL inside scripts
    // This is a "brute force" scanner for obfuscated code
    const looseRegex = /"(https?:[^"]+?\.mp4[^"]*)"/g;
    while ((match = looseRegex.exec(html)) !== null) {
        const rawUrl = match[1];
        // Filtering out small/preview keywords
        if (!rawUrl.includes('preview') && !rawUrl.includes('thumb') && isValidVideoUrl(rawUrl)) {
             return decodeEntities(rawUrl);
        }
    }

    return null;
};

// Strategy C: OpenGraph/Twitter Meta (Legacy Fallback)
const extractFromMetaTags = (html: string): string | null => {
    const patterns = [
        /<meta\s+property="og:video:secure_url"\s+content="([^"]+)"/i,
        /<meta\s+property="og:video"\s+content="([^"]+)"/i,
        /<meta\s+name="twitter:player:stream"\s+content="([^"]+)"/i,
        /<meta\s+name="twitter:player"\s+content="([^"]+)"/i
    ];

    for (const p of patterns) {
        const m = html.match(p);
        if (m && isValidVideoUrl(m[1])) return decodeEntities(m[1]);
    }
    return null;
};

// --- MAIN EXTRACTOR ---
const extractVideo = async (url: string): Promise<{ videoUrl: string | null, prompt: string }> => {
    try {
        // 1. Mimic a Real Desktop Browser (Crucial for bypassing bot protection)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://www.google.com/'
            }
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const html = await response.text();

        // 2. Execute Strategies in order of reliability
        let bestUrl = extractFromJsonLd(html); // Highest priority (Official structured data)
        
        if (!bestUrl) {
            bestUrl = extractFromScriptVariables(html); // Second priority (Hydration data)
        }
        
        if (!bestUrl) {
            bestUrl = extractFromMetaTags(html); // Lowest priority (Social sharing tags)
        }

        // 3. Extract Prompt/Description
        let prompt = "";
        const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                          html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                          html.match(/"description":"([^"]+)"/);
        
        if (descMatch) {
            prompt = decodeEntities(descMatch[1]);
            // Clean up common platform suffixes
            prompt = prompt.replace(/ \| Sora/g, '').replace(/ - OpenAI/g, '').trim();
        }

        return { videoUrl: bestUrl, prompt };

    } catch (error) {
        console.error("Deep Extraction Error:", error);
        return { videoUrl: null, prompt: "" };
    }
};


// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, payload } = req.body || {};
    
    try {
        if (action === 'removeVideoWatermark') {
            const { url } = payload;
            if (!url) return res.status(400).json({ error: "Missing URL" });

            console.log(`[Video Extract] Starting Deep Mining for: ${url}`);
            const result = await extractVideo(url);

            if (!result.videoUrl) {
                return res.status(404).json({ 
                    error: "Không thể trích xuất video gốc. Link có thể yêu cầu đăng nhập hoặc công nghệ bảo vệ DRM." 
                });
            }

            console.log(`[Video Extract] Success: ${result.videoUrl.substring(0, 50)}...`);
            return res.json({ videoUrl: result.videoUrl, prompt: result.prompt });
        }

        // ... (Other legacy handlers if any)
        return res.status(400).json({ error: "Unknown action" });

    } catch (e: any) {
        console.error("API Critical Error:", e);
        return res.status(500).json({ error: e.message });
    }
}
