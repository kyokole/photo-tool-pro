
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
    // Add mapping for raw IDs if needed
    'credit_basic': { type: 'credit', amount: 100, name: 'Gói Cơ Bản (100 Credits)' },
    'credit_pro': { type: 'credit', amount: 500, name: 'Gói Chuyên Nghiệp (500 Credits)' },
    'vip_monthly': { type: 'vip', amount: 30, name: 'VIP 1 Tháng' },
    'vip_yearly': { type: 'vip', amount: 365, name: 'VIP 1 Năm' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Method check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = req.body || {};

    // --- BRANCH 1: PAYPAL WEBHOOK HANDLER ---
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        console.log("[Webhook] Received PayPal Event:", body.id);
        
        try {
            const resource = body.resource;
            const customIdRaw = resource.custom_id; // Should contain JSON { uid, packageId }
            
            if (!customIdRaw) {
                console.warn("[Webhook] PayPal event missing custom_id. Skipping.");
                return res.status(200).send('OK - No custom_id'); // Return 200 to stop retries
            }

            let metadata;
            try {
                metadata = JSON.parse(customIdRaw);
            } catch (e) {
                console.error("[Webhook] Failed to parse custom_id:", customIdRaw);
                return res.status(200).send('OK - Invalid custom_id');
            }

            const { uid, packageId } = metadata;
            const orderID = resource.id; // Transaction ID from PayPal
            
            if (!uid || !packageId) {
                 return res.status(200).send('OK - Incomplete metadata');
            }

            // Validate Package
            const pkg = PACKAGE_MAP[packageId];
            if (!pkg) {
                console.error("[Webhook] Unknown packageId:", packageId);
                return res.status(200).send('OK - Unknown package');
            }

            // --- DB UPDATE ---
            if (!admin.apps.length) {
                return res.status(500).json({ error: 'Database connection failed' });
            }
            const db = admin.firestore();
            
            // Check for deduplication (Idempotency)
            const txSnapshot = await db.collection('transactions').where('orderId', '==', orderID).get();
            if (!txSnapshot.empty) {
                console.log("[Webhook] Transaction already processed:", orderID);
                return res.status(200).send('OK - Already processed');
            }

            const userRef = db.collection('users').doc(uid);

            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error(`User ${uid} not found`);

                const userData = userDoc.data();

                // Log transaction
                const transactionRef = db.collection('transactions').doc();
                transaction.set(transactionRef, {
                    uid: uid,
                    shortId: userData?.shortId || 'UNKNOWN',
                    packageId: packageId,
                    packageName: pkg.name,
                    amount: pkg.amount,
                    price: parseFloat(resource.amount?.value || '0'),
                    currency: resource.amount?.currency_code || 'USD',
                    type: pkg.type,
                    timestamp: new Date().toISOString(),
                    status: 'success',
                    gateway: 'PAYPAL',
                    orderId: orderID,
                    rawContent: `PayPal Webhook: ${body.event_type}`
                });

                // Update User
                if (pkg.type === 'credit') {
                    const currentCredits = userData?.credits || 0;
                    transaction.update(userRef, { credits: currentCredits + pkg.amount });
                } else if (pkg.type === 'vip') {
                    const currentEndStr = userData?.subscriptionEndDate;
                    let endDate = new Date();
                    if (currentEndStr) {
                        const currentEnd = new Date(currentEndStr);
                        if (currentEnd > new Date()) endDate = currentEnd;
                    }
                    endDate.setDate(endDate.getDate() + pkg.amount);
                    transaction.update(userRef, { subscriptionEndDate: endDate.toISOString() });
                }
            });

            console.log(`[Webhook] PayPal success for user ${uid}, package ${packageId}`);
            return res.status(200).json({ success: true });

        } catch (error: any) {
            console.error("[Webhook] PayPal Processing Error:", error);
            return res.status(500).json({ error: error.message });
        }
    }


    // --- BRANCH 2: BANK TRANSFER SIMULATION (MANUAL) ---
    // Structure: { content: "PHOTO A1B2C3 C100", amount: 50000, ... }
    const { content } = body;

    if (!content) {
        // If it's not PayPal and has no content, it's invalid
        return res.status(400).json({ error: 'Missing transfer content or unknown event type' });
    }

    // 3. Regex content: PHOTO [ShortID] [PackageCode]
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
                
                if (currentEndStr) {
                    const currentEnd = new Date(currentEndStr);
                    if (currentEnd > new Date()) {
                        endDate = currentEnd;
                    }
                }
                
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
                gateway: 'VIETQR', // Mark as Bank Transfer
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
