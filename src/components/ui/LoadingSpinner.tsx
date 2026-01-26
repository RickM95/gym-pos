"use client";

import { useState, useEffect } from "react";
import { Dumbbell } from "lucide-react";

const MOTIVATIONAL_QUOTES = [
    "No Pain, No Gain...",
    "One more rep...",
    "Loading the plates...",
    "Crushing the sets...",
    "Spartans never quit...",
    "Building your legacy...",
    "Focus on the pump...",
    "Almost at the finish line...",
    "Pushing the limits..."
];

interface LoadingSpinnerProps {
    message?: string;
    fullPage?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message, fullPage = false, size = 'md' }: LoadingSpinnerProps) {
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const sizeClasses = {
        xs: { container: "w-8 h-6", space: "space-y-0", text: "hidden", quotes: false },
        sm: { container: "w-20 h-16", space: "space-y-2", text: "text-[10px]", quotes: false },
        md: { container: "w-32 h-24", space: "space-y-6", text: "text-sm", quotes: true },
        lg: { container: "w-48 h-36", space: "space-y-8", text: "text-base", quotes: true }
    };

    const currentSize = sizeClasses[size];

    const content = (
        <div className={`flex flex-col items-center justify-center ${currentSize.space}`}>
            <div className={`relative ${currentSize.container} flex items-center justify-center`}>
                {/* Pushup Man SVG */}
                <svg viewBox="0 0 100 60" className="w-full h-full">
                    {/* Floor */}
                    <line x1="10" y1="50" x2="90" y2="50" stroke="#374151" strokeWidth="2" strokeLinecap="round" />

                    {/* Man Group */}
                    <g className="animate-[pushup_2s_ease-in-out_infinite] origin-[85px_50px]">
                        {/* Head */}
                        <circle cx="25" cy="20" r="5" fill="#3B82F6" />
                        {/* Torso */}
                        <line x1="25" y1="20" x2="80" y2="45" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" />
                        {/* Arms (Back) */}
                        <path d="M 35 25 L 35 50" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
                        {/* Legs */}
                        <line x1="80" y1="45" x2="90" y2="50" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
                    </g>
                </svg>

                <style jsx>{`
                    @keyframes pushup {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-10px) rotate(10deg); }
                    }
                `}</style>
            </div>

            <div className="text-center">
                <p className={`text-white font-bold tracking-widest animate-pulse uppercase ${currentSize.text}`}>
                    {message || "Loading..."}
                </p>
                {currentSize.quotes && (
                    <div className="h-4 flex items-center justify-center mt-2">
                        <p className="text-gray-400 text-[10px] italic transition-opacity duration-500">
                            "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
                {content}
            </div>
        );
    }

    const padding = size === 'xs' ? 'p-0' : size === 'sm' ? 'p-4' : size === 'md' ? 'p-12' : 'p-20';

    return (
        <div className={`${padding} w-full flex items-center justify-center`}>
            {content}
        </div>
    );
}
