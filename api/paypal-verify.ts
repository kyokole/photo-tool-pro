
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { Buffer } from 'node:buffer';
import process from 'node:process';

// --- INIT FIREBASE ADMIN ---
if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccountJson))
            });
        } catch (error) {
            console.error("Firebase Init Error in PayPal API:", error);
        }
    }
}

// Helper to get access token from PayPal
async function getPayPalAccessToken() {
    const clientId = process.env.VITE_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.paypal.com';

    if (!clientId || !clientSecret) {
        throw new Error("Missing PayPal Credentials");
    }

    const auth = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const data = await response.json();
    return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { orderID, uid, packageId } = req.body;

    if (!orderID || !uid || !packageId) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    // Determine package details based on ID
    const PACKAGE_MAP: Record<string, { type: 'credit' | 'vip', amount: number, name: string }> = {
        'credit_basic': { type: 'credit', amount: 100, name: 'Gói Cơ Bản (100 Credits)' },
        'credit_pro': { type: 'credit', amount: 500, name: 'Gói Chuyên Nghiệp (500 Credits)' },
        'vip_monthly': { type: 'vip', amount: 30, name: 'VIP 1 Tháng' },
        'vip_yearly': { type: 'vip', amount: 365, name: 'VIP 1 Năm' },
    };

    const pkg = PACKAGE_MAP[packageId];
    if (!pkg) {
        return res.status(400).json({ error: 'Invalid Package ID' });
    }

    try {
        const accessToken = await getPayPalAccessToken();
        const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.paypal.com';

        // Verify Order Details
        const response = await fetch(`${apiUrl}/v2/checkout/orders/${orderID}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const orderData = await response.json();

        if (orderData.status !== 'COMPLETED') {
            return res.status(400).json({ error: 'Order not completed', status: orderData.status });
        }

        // --- UPDATE DATABASE ---
        if (!admin.apps.length) {
             return res.status(500).json({ error: 'Database connection failed' });
        }

        const db = admin.firestore();
        const userRef = db.collection('users').doc(uid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error("User not found");

            const userData = userDoc.data();

            // Log transaction
            const transactionRef = db.collection('transactions').doc();
            transaction.set(transactionRef, {
                uid: uid,
                shortId: userData?.shortId || 'UNKNOWN',
                packageId: packageId,
                packageName: pkg.name,
                amount: pkg.amount,
                price: parseFloat(orderData.purchase_units[0].amount.value),
                currency: orderData.purchase_units[0].amount.currency_code,
                type: pkg.type,
                timestamp: new Date().toISOString(),
                status: 'success',
                gateway: 'PAYPAL',
                orderId: orderID,
                rawContent: `PayPal Order: ${orderID}`
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

        return res.json({ success: true, message: 'Transaction verified and processed' });

    } catch (error: any) {
        console.error("PayPal Verify Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
