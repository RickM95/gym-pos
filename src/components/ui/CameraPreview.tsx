"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, AlertCircle } from "lucide-react";

interface CameraPreviewProps {
    onCapture?: (imageDataUrl: string) => void;
    isActive?: boolean;
    width?: number;
    height?: number;
}

export const CameraPreview = ({
    onCapture,
    isActive = true,
    width = 320,
    height = 240
}: CameraPreviewProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setHasPermission(true);
        } catch (err) {
            console.error('Camera access error:', err);
            setHasPermission(false);
            setError(err instanceof Error ? err.message : 'Camera access denied');
        } finally {
            setIsLoading(false);
        }
    }, [width, height]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                onCapture?.(imageDataUrl);
            }
        }
    }, [onCapture]);

    const switchCamera = useCallback(async () => {
        stopCamera();
        await startCamera();
    }, [stopCamera, startCamera]);

    useEffect(() => {
        if (isActive && hasPermission !== false) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isActive, hasPermission, startCamera, stopCamera]);

    if (error) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <div>
                        <h3 className="text-white font-semibold mb-2">Camera Access Error</h3>
                        <p className="text-gray-400 text-sm">{error}</p>
                        <p className="text-gray-500 text-xs mt-2">
                            Please check your browser permissions and ensure camera access is allowed.
                        </p>
                    </div>
                    <button
                        onClick={startCamera}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-gray-400">Initializing camera...</p>
                </div>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                    <CameraOff className="w-8 h-8 text-gray-500" />
                    <p className="text-gray-400">Camera preview inactive</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            {/* Video Preview */}
            <div className="relative">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto object-cover"
                    style={{ maxWidth: '100%', height: 'auto' }}
                />

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex justify-center gap-3">
                        {onCapture && (
                            <button
                                onClick={capturePhoto}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors shadow-lg"
                            >
                                <Camera className="w-6 h-6" />
                            </button>
                        )}

                        <button
                            onClick={switchCamera}
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors shadow-lg"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Camera Active Indicator */}
                <div className="absolute top-4 right-4">
                    <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                    </div>
                </div>
            </div>

            {/* Hidden Canvas for Photo Capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

// Hook for accessing camera without UI
export const useCamera = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const startCamera = async (constraints?: MediaStreamConstraints) => {
        try {
            setIsLoading(true);
            const mediaStream = await navigator.mediaDevices.getUserMedia(
                constraints || {
                    video: { facingMode: 'user' },
                    audio: false
                }
            );
            setStream(mediaStream);
            setHasPermission(true);
            return mediaStream;
        } catch (err) {
            console.error('Camera access error:', err);
            setHasPermission(false);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = (videoElement: HTMLVideoElement, format: string = 'image/jpeg', quality: number = 0.95) => {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const context = canvas.getContext('2d');

        if (context) {
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL(format, quality);
        }
        return null;
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return {
        stream,
        hasPermission,
        isLoading,
        startCamera,
        stopCamera,
        capturePhoto
    };
};