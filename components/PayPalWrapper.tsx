
import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { getPayPalClientId, verifyPayPalTransaction } from '../services/paypalService';
import { useTranslation } from 'react-i18next';

interface PayPalWrapperProps {
    amount: number; // Amount in VND
    packageId: string; // ID of the package
    packageName: string; // Name of the package to display on PayPal
    userId: string; // Current User ID
    onSuccess: () => void;
    onError: (msg: string) => void;
    label?: string;
}

const PayPalWrapper: React.FC<PayPalWrapperProps> = ({ amount, packageId, packageName, userId, onSuccess, onError }) => {
    const { t, i18n } = useTranslation();
    const [clientId, setClientId] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        getPayPalClientId().then(id => setClientId(id));
    }, []);

    if (!clientId) {
        return <div className="text-xs text-gray-500 text-center animate-pulse">{t('paymentModal.loadingPaypal')}</div>;
    }

    // Convert VND to USD roughly for PayPal
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
                    // KEY FIX: Force destroy and recreation of button when package/amount/lang changes.
                    // This solves the issue of descriptions not updating or UI caching old order data.
                    key={`${packageId}-${usdAmount}-${i18n.language}`}
                    
                    style={{ layout: "horizontal", height: 45, tagline: false, label: "pay" }}
                    createOrder={(_data, actions) => {
                        // IMPORTANT: Pass userId and packageId in 'custom_id' for Webhook
                        const customData = JSON.stringify({ uid: userId, packageId: packageId });
                        
                        // Localize descriptions
                        const itemDescription = t('paymentModal.paypalItemDesc', { defaultValue: 'AI Photo Suite Service Package' });
                        const orderDescription = t('paymentModal.paypalOrderDesc', { packageName, defaultValue: `Payment for: ${packageName}` });

                        return actions.order.create({
                            intent: "CAPTURE",
                            application_context: {
                                brand_name: "AI PHOTO SUITE",
                                shipping_preference: "NO_SHIPPING", // Digital goods, no shipping needed
                                user_action: "PAY_NOW"
                            },
                            purchase_units: [
                                {
                                    reference_id: packageId,
                                    description: orderDescription, // Main description visible on mobile/header
                                    custom_id: customData,
                                    amount: {
                                        currency_code: "USD",
                                        value: usdAmount,
                                        breakdown: {
                                            item_total: {
                                                currency_code: "USD",
                                                value: usdAmount
                                            }
                                        }
                                    },
                                    items: [
                                        {
                                            name: packageName, // Specific Item Name
                                            description: itemDescription,
                                            unit_amount: {
                                                currency_code: "USD",
                                                value: usdAmount
                                            },
                                            quantity: "1",
                                            category: "DIGITAL_GOODS"
                                        }
                                    ]
                                },
                            ],
                        });
                    }}
                    onApprove={async (data, actions) => {
                        setIsPending(true);
                        try {
                            const details = await actions.order?.capture();
                            if (!details) throw new Error("Capture failed");
                            
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
