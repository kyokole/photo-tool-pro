
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
    // PayPal expects string with 2 decimal places
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
                    // CRITICAL FIX: The 'key' prop forces React to completely destroy and recreate 
                    // the PayPal button instance whenever the package or language changes.
                    // This ensures 'createOrder' always uses the fresh props and PayPal's UI updates correctly.
                    key={`${packageId}-${usdAmount}-${i18n.language}`}
                    
                    style={{ layout: "horizontal", height: 45, tagline: false, label: "pay" }}
                    
                    createOrder={(data, actions) => {
                        // IMPORTANT: Pass userId and packageId in 'custom_id' for Webhook verification
                        const customData = JSON.stringify({ uid: userId, packageId: packageId });
                        
                        // THIS IS THE KEY FIX FOR VISIBILITY:
                        // 1. 'description': This appears at the top level on mobile.
                        // 2. 'soft_descriptor': Appears on credit card statement (Max 22 chars).
                        // 3. 'items': Must match the total exactly to be displayed.
                        
                        return actions.order.create({
                            intent: "CAPTURE",
                            application_context: {
                                brand_name: "AI PHOTO SUITE",
                                shipping_preference: "NO_SHIPPING", // Hides shipping address, making Product Name more visible
                                user_action: "PAY_NOW",
                                landing_page: "NO_PREFERENCE"
                            },
                            purchase_units: [
                                {
                                    reference_id: packageId,
                                    // FIX: Put the Package Name DIRECTLY in the top description. 
                                    // This is what shows up on the main PayPal screen usually.
                                    description: `${packageName}`, 
                                    custom_id: customData,
                                    soft_descriptor: "AI PHOTO VIP", // Max 22 chars
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
                                            name: packageName, // Specific Item Name (e.g., "VIP 1 Month")
                                            description: "Full Access to AI Features", // Sub-description
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
