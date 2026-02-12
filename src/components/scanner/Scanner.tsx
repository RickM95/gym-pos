"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CameraPreview } from "@/components/ui/CameraPreview";
import { Camera, Scan, SwitchCamera, RefreshCw, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: string) => void;
    onClientPhoto?: (imageDataUrl: string) => void;
}

export const Scanner = ({ onScan, onError, onClientPhoto }: ScannerProps) => {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [isClientPhotoMode, setIsClientPhotoMode] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanning = async () => {
        if (!mounted || showCamera || isScanning) return;

        try {
            setScanError(null);
            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode("reader");
            }

            if (html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }

            setIsScanning(true);
            await html5QrCodeRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    onScan(decodedText);
                    // Stop scanning once success to prevent multiple scans
                    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                        html5QrCodeRef.current.stop().then(() => setIsScanning(false)).catch(console.error);
                    }
                },
                (errorMessage) => {
                    // Ignored: scanning for QR codes
                }
            );
        } catch (err) {
            console.error("Failed to start scanning:", err);
            setIsScanning(false);
            setScanError("Failed to access camera. Please ensure permissions are granted.");
            if (onError) onError(String(err));
        }
    };

    useEffect(() => {
        if (mounted && !showCamera) {
            startScanning();
        }
    }, [mounted, showCamera]);

    const handlePhotoCapture = (imageDataUrl: string) => {
        if (onClientPhoto) {
            onClientPhoto(imageDataUrl);
        }
        // Switch back to QR scanning after photo capture
        setIsClientPhotoMode(false);
        setShowCamera(false);
    };

    const toggleCameraView = async () => {
        if (!showCamera && html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
            setIsScanning(false);
        }
        setShowCamera(!showCamera);
    };

    if (showCamera) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="mb-4 flex justify-center gap-2">
                    <button
                        onClick={toggleCameraView}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                        <Scan className="w-4 h-4" />
                        QR Scanner
                    </button>
                    {onClientPhoto && (
                        <button
                            onClick={() => setIsClientPhotoMode(true)}
                            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${isClientPhotoMode
                                ? 'bg-primary text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
                        >
                            <Camera className="w-4 h-4" />
                            Client Photo
                        </button>
                    )}
                </div>

                <CameraPreview
                    isActive={true}
                    width={320}
                    height={240}
                    onCapture={isClientPhotoMode ? handlePhotoCapture : undefined}
                />

                {isClientPhotoMode && (
                    <p className="text-center text-gray-400 text-xs mt-2">
                        Take client photo for their profile
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="mb-4 flex justify-center gap-2">
                <button
                    onClick={toggleCameraView}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                    <Camera className="w-4 h-4" />
                    Camera Preview
                </button>
                {onClientPhoto && (
                    <button
                        onClick={() => {
                            setShowCamera(true);
                            setIsClientPhotoMode(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                        <Camera className="w-4 h-4" />
                        Take Client Photo
                    </button>
                )}
            </div>

            <div className={`overflow-hidden rounded-xl border relative ${scanError ? 'border-red-500' : 'border-gray-700'} bg-black aspect-square max-w-sm mx-auto`}>
                <div id="reader" className="w-full h-full"></div>

                {!isScanning && !scanError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4">
                        <LoadingSpinner size="sm" message="Gearing up..." />
                    </div>
                )}

                {scanError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                        <p className="text-sm font-medium mb-4">{scanError}</p>
                        <button
                            onClick={startScanning}
                            className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-sm transition"
                        >
                            Retry Camera
                        </button>
                    </div>
                )}
            </div>
            <p className="text-center text-gray-400 text-xs py-2">
                Point camera at client QR code
            </p>
        </div>
    );
};
