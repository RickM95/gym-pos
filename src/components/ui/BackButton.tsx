'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
    label?: string;
    fallbackPath?: string;
    className?: string;
}

export default function BackButton({
    label = 'Back',
    fallbackPath = '/',
    className = ''
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        // Try to go back in history
        if (window.history.length > 1) {
            router.back();
        } else {
            // Fallback to specified path if no history
            router.push(fallbackPath);
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        >
            <ArrowLeft className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
