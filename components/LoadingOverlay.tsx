import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LoadingOverlay: React.FC = () => {
    const { t } = useTranslation();
    
    const messageKeys = [
        "loading.init",
        "loading.analyze",
        "loading.hair",
        "loading.clothing",
        "loading.background",
        "loading.lighting",
        "loading.colors",
        "loading.details",
        "loading.finalizing",
        "loading.almostDone",
    ];

    const [messageKey, setMessageKey] = useState(messageKeys[0]);

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % messageKeys.length;
            setMessageKey(messageKeys[index]);
        }, 2000);

        return () => clearInterval(interval);
    }, [messageKeys.length]);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
            <svg className="animate-spin h-10 w-10 text-[#58A6FF] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white text-lg font-semibold">{t(messageKey)}</p>
            <p className="text-gray-300 text-sm mt-1">{t('loading.patience')}</p>
        </div>
    );
};

export default LoadingOverlay;