
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// --- INIT FIREBASE ADMIN (Ensure only initialized once) ---
let isRealMode = false;
try {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (serviceAccountJson) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccountJson))
            });
            isRealMode = true;
        } else {
            console.warn("[Webhook] Warning: FIREBASE_SERVICE_ACCOUNT_JSON missing. Running in Simulation Mode.");
        }
    } else {
        isRealMode = true;
    }
} catch (error: any) {
    console.error("Firebase Init Error in Webhook:", error.message);
}

// BẢNG GIÁ CỐ ĐỊNH (Cập nhật giá tiền để lưu vào DB)
const PACKAGE_MAP: Record<string, { type: 'credit' | 'vip', amount: number, price: number, name: string }> = {
    'C100': { type: 'credit', amount: 100, price: 50000, name: 'Gói Cơ Bản (100 Credits)' },
    'C500': { type: 'credit', amount: 500, price: 200000, name: 'Gói Chuyên Nghiệp (500 Credits)' },
    'V30': { type: 'vip', amount: 30, price: 400000, name: 'VIP 1 Tháng' },
    'V365': { type: 'vip', amount: 365, price: 3000000, name: 'VIP 1 Năm' },
    // Mapping ID gốc
    'credit_basic': { type: 'credit', amount: 100, price: 50000, name: 'Gói Cơ Bản (100 Credits)' },
    'credit_pro': { type: 'credit', amount: 500, price: 200000, name: 'Gói Chuyên Nghiệp (500 Credits)' },
    'vip_monthly': { type: 'vip', amount: 30, price: 400000, name: 'VIP 1 Tháng' },
    'vip_yearly': { type: 'vip', amount: 365, price: 3000000, name: 'VIP 1 Năm' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = req.body || {};

    // --- BRANCH 1: PAYPAL WEBHOOK HANDLER ---
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        // ... (Giữ nguyên logic PayPal vì PayPal tự gửi amount) ...
        // Code PayPal vẫn ổn, chỉ cần chú ý phần Manual bên dưới
        
        try {
            const resource = body.resource;
            const customIdRaw = resource.custom_id;
            
            if (!customIdRaw) return res.status(200).send('OK - No custom_id');

            let metadata;
            try {
                metadata = JSON.parse(customIdRaw);
            } catch (e) {
                return res.status(200).send('OK - Invalid custom_id');
            }

            const { uid, packageId } = metadata;
            const orderID = resource.id;
            
            if (!uid || !packageId) return res.status(200).send('OK - Incomplete metadata');

            // Validate Package (Map sang thông tin hiển thị đẹp hơn nếu có)
            const pkgInfo = PACKAGE_MAP[packageId] || { name: packageId, type: 'credit', amount: 0 };

            // --- DB UPDATE ---
            if (!isRealMode) {
                console.error("Simulated Mode: Cannot process PayPal Webhook without DB connection.");
                return res.status(500).json({ error: 'Database connection failed (Simulated Mode)' });
            }
            const db = admin.firestore();
            
            // Check deduplication
            const txSnapshot = await db.collection('transactions').where('orderId', '==', orderID).get();
            if (!txSnapshot.empty) return res.status(200).send('OK - Already processed');

            const userRef = db.collection('users').doc(uid);

            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw new Error(`User ${uid} not found`);

                const userData = userDoc.data();
                const amountVal = parseFloat(resource.amount?.value || '0');

                // Log transaction
                const transactionRef = db.collection('transactions').doc();
                transaction.set(transactionRef, {
                    uid: uid,
                    shortId: userData?.shortId || 'UNKNOWN',
                    packageId: packageId,
                    packageName: pkgInfo.name,
                    amount: pkgInfo.amount, // Credits/Days gained
                    price: amountVal,       // Actual money paid
                    currency: resource.amount?.currency_code || 'USD',
                    type: pkgInfo.type,
                    timestamp: new Date().toISOString(),
                    status: 'success',
                    gateway: 'PAYPAL',
                    orderId: orderID,
                    rawContent: `PayPal Webhook: ${body.event_type}`
                });

                // Update User logic...
                 if (pkgInfo.type === 'credit') {
                    const currentCredits = userData?.credits || 0;
                    transaction.update(userRef, { credits: currentCredits + pkgInfo.amount });
                } else if (pkgInfo.type === 'vip') {
                    const currentEndStr = userData?.subscriptionEndDate;
                    let endDate = new Date();
                    if (currentEndStr) {
                        const currentEnd = new Date(currentEndStr);
                        if (currentEnd > new Date()) endDate = currentEnd;
                    }
                    endDate.setDate(endDate.getDate() + pkgInfo.amount);
                    transaction.update(userRef, { subscriptionEndDate: endDate.toISOString() });
                }
            });

            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error("[Webhook] PayPal Error:", error);
            return res.status(500).json({ error: error.message });
        }
    }


    // --- BRANCH 2: BANK TRANSFER / MANUAL ACTIVATION ---
    const { content } = body;

    if (!content) {
        return res.status(400).json({ error: 'Missing transfer content' });
    }

    // Regex: PHOTO [ShortID] [PackageCode]
    const regex = /PHOTO\s+([A-Z0-9]+)\s+([A-Z0-9]+)/i;
    const match = content.match(regex);

    if (!match) {
        return res.status(400).json({ error: 'Cú pháp sai. Yêu cầu: PHOTO [MãUser] [MãGói]' });
    }

    const shortId = match[1].toUpperCase();
    const packageCode = match[2].toUpperCase();

    const pkg = PACKAGE_MAP[packageCode];
    if (!pkg) {
        return res.status(400).json({ error: `Mã gói không tồn tại: ${packageCode}` });
    }

    // --- SAFETY CHECK: SIMULATION MODE ---
    if (!isRealMode) {
        return res.json({ 
            success: true, 
            message: `[CHẾ ĐỘ GIẢ LẬP] Server nhận diện gói ${pkg.name} cho User ${shortId}. Vui lòng thêm 'FIREBASE_SERVICE_ACCOUNT_JSON' vào Vercel để kích hoạt thật.`,
            user: "Simulation User"
        });
    }

    // 5. Find User & Update (Real Mode)
    try {
        const db = admin.firestore();
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('shortId', '==', shortId).limit(1).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ error: `Không tìm thấy người dùng có mã: ${shortId}` });
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userRef = userDoc.ref;

        await db.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(userRef);
            if (!freshDoc.exists) throw "User disappeared!";
            
            const currentData = freshDoc.data();
            
            // a) Update User Balance
            if (pkg.type === 'credit') {
                const currentCredits = currentData?.credits || 0;
                transaction.update(userRef, { credits: currentCredits + pkg.amount });
            } else if (pkg.type === 'vip') {
                const currentEndStr = currentData?.subscriptionEndDate;
                let endDate = new Date();
                if (currentEndStr) {
                    const currentEnd = new Date(currentEndStr);
                    if (currentEnd > new Date()) endDate = currentEnd;
                }
                endDate.setDate(endDate.getDate() + pkg.amount);
                transaction.update(userRef, { subscriptionEndDate: endDate.toISOString() });
            }

            // b) Log Transaction (FIX 0đ: Ghi thêm price và currency)
            const transactionRef = db.collection('transactions').doc();
            transaction.set(transactionRef, {
                uid: userDoc.id,
                shortId: shortId,
                packageId: packageCode,
                packageName: pkg.name,
                amount: pkg.amount, // Số lượng credit/ngày nhận được
                price: pkg.price,   // <--- FIX QUAN TRỌNG: Lưu giá tiền thật
                currency: 'VND',
                type: pkg.type,
                timestamp: new Date().toISOString(),
                status: 'success',
                gateway: 'VIETQR',
                rawContent: content
            });
        });

        return res.json({ 
            success: true, 
            message: `Đã kích hoạt thành công gói ${pkg.name}`,
            user: userData.username
        });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
