
// /api/webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// --- INIT FIREBASE ADMIN (Ensure only initialized once) ---
try {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (serviceAccountJson) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccountJson))
            });
        } else {
            console.warn("[Webhook] Warning: FIREBASE_SERVICE_ACCOUNT_JSON missing. Running in Simulation Mode.");
        }
    }
} catch (error: any) {
    console.error("Firebase Init Error in Webhook:", error.message);
}

// Hardcoded package map since we can't import from constants.ts (React dependency issue in node)
const PACKAGE_MAP: Record<string, { type: 'credit' | 'vip', amount: number, name: string }> = {
    'C100': { type: 'credit', amount: 100, name: 'Gói Cơ Bản (100 Credits)' },
    'C500': { type: 'credit', amount: 500, name: 'Gói Chuyên Nghiệp (500 Credits)' },
    'V30': { type: 'vip', amount: 30, name: 'VIP 1 Tháng' },
    'V365': { type: 'vip', amount: 365, name: 'VIP 1 Năm' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Method check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Parse Payload (Mocking a typical bank/payment gateway payload or our simulator)
    // Structure: { content: "PHOTO A1B2C3 C100", amount: 50000, ... }
    const { content, amount } = req.body || {};

    if (!content) {
        return res.status(400).json({ error: 'Missing transfer content' });
    }

    // 3. Regex content: PHOTO [ShortID] [PackageCode]
    // Case insensitive
    const regex = /PHOTO\s+([A-Z0-9]+)\s+([A-Z0-9]+)/i;
    const match = content.match(regex);

    if (!match) {
        return res.status(400).json({ error: 'Invalid syntax. Expected: PHOTO [UserCode] [PackageCode]' });
    }

    const shortId = match[1].toUpperCase();
    const packageCode = match[2].toUpperCase();

    // 4. Validate Package
    const pkg = PACKAGE_MAP[packageCode];
    if (!pkg) {
        return res.status(400).json({ error: `Unknown package code: ${packageCode}` });
    }

    // --- SAFETY CHECK: SIMULATION MODE ---
    // If Firebase Admin is not initialized (due to missing keys), return a success simulation
    // to prevent crashing the UI. This allows testing logic without DB connection.
    if (!admin.apps.length) {
        return res.json({ 
            success: true, 
            message: `[GIẢ LẬP THÀNH CÔNG] Đã nhận diện gói ${packageCode} cho User ${shortId}. (Lưu ý: Database chưa được cập nhật do thiếu Server Key)`,
            user: "Simulation User"
        });
    }

    // 5. Find User by shortId (Real Mode)
    try {
        const db = admin.firestore();
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('shortId', '==', shortId).limit(1).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ error: `User with ShortID ${shortId} not found.` });
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userRef = userDoc.ref;

        // 6. Execute Update Transaction & Log History
        await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(userRef);
            if (!freshDoc.exists) throw "User disappeared!";
            
            const currentData = freshDoc.data();
            
            // a) Update User Balance/Rights
            if (pkg.type === 'credit') {
                const currentCredits = currentData?.credits || 0;
                const newCredits = currentCredits + pkg.amount;
                transaction.update(userRef, { credits: newCredits });
                console.log(`[Webhook] Added ${pkg.amount} credits to ${shortId}`);
            } else if (pkg.type === 'vip') {
                const currentEndStr = currentData?.subscriptionEndDate;
                let endDate = new Date();
                
                // If currently VIP, extend from existing date
                if (currentEndStr) {
                    const currentEnd = new Date(currentEndStr);
                    if (currentEnd > new Date()) {
                        endDate = currentEnd;
                    }
                }
                
                // Add days
                endDate.setDate(endDate.getDate() + pkg.amount);
                transaction.update(userRef, { subscriptionEndDate: endDate.toISOString() });
                console.log(`[Webhook] Extended VIP by ${pkg.amount} days for ${shortId}`);
            }

            // b) Log Transaction
            const transactionRef = db.collection('transactions').doc();
            transaction.set(transactionRef, {
                uid: userDoc.id,
                shortId: shortId,
                packageId: packageCode,
                packageName: pkg.name,
                amount: pkg.amount,
                type: pkg.type,
                timestamp: new Date().toISOString(),
                status: 'success',
                rawContent: content
            });
        });

        return res.json({ 
            success: true, 
            message: `Successfully processed package ${packageCode} for user ${shortId}`,
            user: userData.username
        });

    } catch (error: any) {
        console.error("Webhook Processing Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
