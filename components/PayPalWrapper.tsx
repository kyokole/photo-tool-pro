
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

    // Determine PayPal Locale based on App Language
    // Nếu app là tiếng Việt -> PayPal hiện tiếng Việt. Nếu Anh -> hiện tiếng Anh (Mỹ).
    const paypalLocale = i18n.language === 'vi' ? 'vi_VN' : 'en_US';

    return (
        <div className="w-full relative z-0">
            {isPending && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center rounded-lg">
                    <div className="text-white font-bold">{t('common.processing')}</div>
                </div>
            )}
            <PayPalScriptProvider options={{ 
                "clientId": clientId, 
                currency: "USD",
                locale: paypalLocale // Cấu hình ngôn ngữ hiển thị nút và popup PayPal
            }}>
                <PayPalButtons
                    // QUAN TRỌNG: Thêm paypalLocale vào key để ép React vẽ lại nút khi đổi ngôn ngữ
                    key={`${packageId}-${usdAmount}-${paypalLocale}`}
                    
                    style={{ layout: "horizontal", height: 45, tagline: false, label: "pay" }}
                    
                    createOrder={(data, actions) => {
                        // Dữ liệu dùng cho Webhook xác thực
                        const customData = JSON.stringify({ uid: userId, packageId: packageId });
                        
                        // --- CHIẾN THUẬT HIỂN THỊ THÔNG TIN ---
                        // Đưa tên gói vào brand_name để nó hiện to nhất trên Mobile
                        // packageName đã được dịch từ component cha (UpgradeVipModal) nên sẽ đúng ngôn ngữ.
                        const uniqueInvoiceId = `${packageId.toUpperCase()}-${Date.now()}`;
                        const dynamicBrandName = `AI PHOTO: ${packageName}`.substring(0, 127); // Max 127 chars

                        return actions.order.create({
                            intent: "CAPTURE",
                            application_context: {
                                brand_name: dynamicBrandName, // Tên gói sẽ hiện ở tiêu đề
                                shipping_preference: "NO_SHIPPING", // Ẩn địa chỉ ship để giao diện gọn hơn
                                user_action: "PAY_NOW",
                                landing_page: "NO_PREFERENCE"
                            },
                            purchase_units: [
                                {
                                    reference_id: packageId,
                                    description: packageName, // Mô tả phụ (có thể bị ẩn trên mobile, nhưng brand_name sẽ hiện)
                                    custom_id: customData,
                                    invoice_id: uniqueInvoiceId,
                                    soft_descriptor: "AI PHOTO VIP", 
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
                                            name: packageName, 
                                            description: "Premium Subscription", 
                                            sku: packageId,
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
