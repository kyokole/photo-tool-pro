
// services/paypalService.ts

// Since we cannot use process.env here directly due to the previous error
// we will fetch the client ID from the existing /api/config endpoint which we updated.

let cachedClientId: string | null = null;

export const getPayPalClientId = async (): Promise<string | null> => {
    if (cachedClientId) return cachedClientId;
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const config = await response.json();
            if (config.paypalClientId) {
                cachedClientId = config.paypalClientId;
                return config.paypalClientId;
            }
        }
    } catch (e) {
        console.error("Failed to fetch PayPal Client ID", e);
    }
    return null;
};

export const verifyPayPalTransaction = async (orderID: string, uid: string, packageId: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/paypal-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderID, uid, packageId }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
            return true;
        } else {
            console.error("PayPal Verification Failed:", data.error);
            return false;
        }
    } catch (error) {
        console.error("Error calling verify API:", error);
        return false;
    }
};
