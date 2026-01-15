"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, User } from "lucide-react";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";

interface ProfilePictureProps {
    currentPhoto?: string;
    onPhotoChange: (photoUrl: string | null) => void;
    className?: string;
    size?: number;
    editable?: boolean;
}

export function ProfilePicture({ 
    currentPhoto, 
    onPhotoChange, 
    className = "",
    size = 128,
    editable = true 
}: ProfilePictureProps) {
    const { addNotification } = useGlobalNotifications();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onPhotoChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' }, 
                audio: false 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOpen(true);
                setIsMenuOpen(false);
            }
        } catch (error) {
            console.error('Camera access denied:', error);
            addNotification("error", "Unable to access camera. Please check permissions.", 5000);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                
                const photoUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
                onPhotoChange(photoUrl);
                stopCamera();
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraOpen(false);
        }
    };

    const removePhoto = () => {
        onPhotoChange(null);
        setIsMenuOpen(false);
    };

    return (
        <>
            <div className={`relative ${className}`}>
                {/* Profile Picture */}
                <div 
                    className="relative rounded-full overflow-hidden border-2 border-gray-600 bg-gray-800 cursor-pointer group"
                    style={{ width: size, height: size }}
                    onClick={() => editable && setIsMenuOpen(!isMenuOpen)}
                >
                    {currentPhoto ? (
                        <img 
                            src={currentPhoto} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User size={size * 0.4} className="text-gray-500" />
                        </div>
                    )}
                    
                    {editable && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="text-white" size={size * 0.3} />
                        </div>
                    )}
                </div>

                {/* Menu Dropdown */}
                {isMenuOpen && editable && (
                    <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                        <button
                            onClick={() => {
                                fileInputRef.current?.click();
                                setIsMenuOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-white"
                        >
                            <Upload size={16} />
                            Upload Photo
                        </button>
                        <button
                            onClick={startCamera}
                            className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-white"
                        >
                            <Camera size={16} />
                            Take Photo
                        </button>
                        {currentPhoto && (
                            <button
                                onClick={removePhoto}
                                className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 text-red-400"
                            >
                                <X size={16} />
                                Remove Photo
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Camera Modal */}
            {isCameraOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Take Photo</h3>
                            <button
                                onClick={stopCamera}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="relative mb-4">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full rounded-lg bg-black"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={stopCamera}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={capturePhoto}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                            >
                                <Camera size={16} />
                                Capture
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}