
import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { getPayPalClientId, verifyPayPalTransaction } from '../services/paypalService';
import { useTranslation } from 'react-i18next';

interface PayPalWrapperProps {
    amount: number; // Amount in USD (approx) or we convert
    packageId: string; // ID of the package
    userId: string; // Current User ID
    onSuccess: () => void;
    onError: (msg: string) => void;
    label?: string;
}

const PayPalWrapper: React.FC<PayPalWrapperProps> = ({ amount, packageId, userId, onSuccess, onError }) => {
    const { t } = useTranslation();
    const [clientId, setClientId] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        getPayPalClientId().then(id => setClientId(id));
    }, []);

    if (!clientId) {
        return <div className="text-xs text-gray-500 text-center animate-pulse">{t('paymentModal.loadingPaypal')}</div>;
    }

    // Convert VND to USD roughly for PayPal (Since PayPal usually requires international currency or specific setup)
    // Assuming 25,000 VND = 1 USD for simplicity or use the exact passed amount if logic handles it.
    // For this example, we will assume `amount` passed in is in VND and convert.
    const usdAmount = (amount / 25000).toFixed(2);

    return (
        <div className="w-full relative z-0">
            {isPending && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center rounded-lg">
                    <div className="text-white font-bold">{t('common.processing')}</div>
                </div>
            )}
            <PayPalScriptProvider options={{ "clientId": clientId, currency: "USD" }}>
                <PayPalButtons
                    style={{ layout: "horizontal", height: 45, tagline: false }}
                    createOrder={(_data, actions) => {
                        // IMPORTANT: We pass userId and packageId in 'custom_id'
                        // so that the Webhook can identify the user even if the client closes.
                        const customData = JSON.stringify({ uid: userId, packageId: packageId });
                        
                        return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [
                                {
                                    amount: {
                                        currency_code: "USD",
                                        value: usdAmount,
                                    },
                                    description: `PhotoToolPro: ${packageId}`,
                                    custom_id: customData 
                                },
                            ],
                        });
                    }}
                    onApprove={async (data, actions) => {
                        setIsPending(true);
                        try {
                            // Capture the funds from the transaction
                            const details = await actions.order?.capture();
                            if (!details) throw new Error("Capture failed");
                            
                            // Verify on backend (Client-side trigger)
                            const verified = await verifyPayPalTransaction(data.orderID, userId, packageId);
                            
                            if (verified) {
                                onSuccess();
                            } else {
                                onError("Thanh toán thành công nhưng xác thực thất bại. Vui lòng liên hệ hỗ trợ.");
                            }
                        } catch (err) {
                            onError("Lỗi xử lý thanh toán.");
                            console.error(err);
                        } finally {
                            setIsPending(false);
                        }
                    }}
                    onError={(err) => {
                        console.error("PayPal Error:", err);
                        onError("Lỗi kết nối PayPal.");
                    }}
                />
            </PayPalScriptProvider>
        </div>
    );
};

export default PayPalWrapper;
