import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CameraViewProps {
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [status, setStatus] = useState<'initializing' | 'active' | 'error'>('initializing');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { t } = useTranslation();

    const openCamera = async () => {
        setStatus('initializing');
        setErrorMessage(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setStatus('active');
                };
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            let message = t('beautyStudio.camera.genericError', { error: err.message });
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                message = t('beautyStudio.camera.permissionDenied');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                message = t('beautyStudio.camera.noDevice');
            }
            setErrorMessage(message);
            setStatus('error');
        }
    };

    useEffect(() => {
        openCamera();
        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleTakePhoto = () => {
        if (videoRef.current && status === 'active') {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                onCapture(canvas.toDataURL('image/jpeg'));
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-40 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg aspect-w-3 aspect-h-4 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden flex items-center justify-center">
                {status === 'initializing' && <p className="text-[var(--text-secondary)]">{t('beautyStudio.camera.initializing')}</p>}
                {status === 'error' && (
                    <div className="text-center p-4">
                        <i className="fas fa-exclamation-triangle text-red-400 text-3xl mb-4"></i>
                        <p className="text-red-300 font-semibold">{errorMessage}</p>
                    </div>
                )}
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${status === 'active' ? 'block' : 'hidden'}`}></video>
            </div>
            <div className="flex items-center justify-around w-full max-w-lg mt-6">
                <button onClick={onClose} className="text-white font-semibold py-2 px-4">{t('common.cancel')}</button>
                <button onClick={handleTakePhoto} disabled={status !== 'active'} className="w-16 h-16 rounded-full bg-white ring-4 ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"></button>
                {status === 'error' ? (
                     <button onClick={openCamera} className="text-[var(--accent-cyan)] font-semibold py-2 px-4">{t('common.retry')}</button>
                ) : (
                    <div className="w-20"></div> // Spacer to keep shutter button centered
                )}
            </div>
        </div>
    );
};
