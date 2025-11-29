import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string>('');
    const [error, setError] = useState<string>('');

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const startCamera = useCallback(async (deviceId?: string) => {
        stopStream();
        setError('');
        try {
            const constraints: MediaStreamConstraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
                audio: false
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(t('beautyStudio.camera.error'));
        }
    }, [stopStream, t]);

    useEffect(() => {
        if (isOpen) {
            navigator.mediaDevices.enumerateDevices().then(devs => {
                const videoDevices = devs.filter(d => d.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0 && !activeDeviceId) {
                    // Prefer front camera if labeled, otherwise first available
                    const frontCam = videoDevices.find(d => d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('user'));
                    setActiveDeviceId(frontCam?.deviceId || videoDevices[0].deviceId);
                }
                startCamera(activeDeviceId || (videoDevices.length > 0 ? videoDevices[0].deviceId : undefined));
            });
        } else {
            stopStream();
        }
        return () => stopStream();
    }, [isOpen]); // Only depend on isOpen to init

    // Handle switching camera separately
    const handleSwitchCamera = () => {
        if (devices.length < 2) return;
        const currentIndex = devices.findIndex(d => d.deviceId === activeDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        const nextDeviceId = devices[nextIndex].deviceId;
        setActiveDeviceId(nextDeviceId);
        startCamera(nextDeviceId);
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Mirror if using front camera (user/front logic usually applies here)
                // For simplicity, we capture raw feed.
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                onCapture(dataUrl);
                onClose();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center">
            <div className="relative w-full h-full max-w-lg bg-black flex flex-col">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
                    <button onClick={onClose} className="text-white p-2">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                    <span className="text-white font-semibold">{t('beautyStudio.camera.title')}</span>
                    <button 
                        onClick={handleSwitchCamera} 
                        className={`text-white p-2 ${devices.length < 2 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <i className="fas fa-sync-alt text-xl"></i>
                    </button>
                </div>

                {/* Video Feed */}
                <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
                    {error ? (
                        <div className="text-red-500 p-4 text-center">{error}</div>
                    ) : (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover" 
                            style={{ transform: 'scaleX(-1)' }} // Mirror view for better UX
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent">
                    <button 
                        onClick={handleCapture}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                    >
                        <div className="w-16 h-16 bg-white rounded-full"></div>
                    </button>
                </div>
                
                {/* Hidden Canvas */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};
