"use client";

import React from "react";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "rounded";
}

export default function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
    const variantClasses = {
        text: "h-4 w-full rounded",
        circular: "rounded-full",
        rectangular: "",
        rounded: "rounded-lg"
    };

    return (
        <div
            className={`animate-pulse bg-gray-700/50 ${variantClasses[variant]} ${className}`}
        />
    );
}

export function GridCardSkeleton() {
    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-24 flex flex-col justify-center space-y-2">
            <Skeleton variant="text" className="w-24 h-3" />
            <Skeleton variant="text" className="w-16 h-8" />
        </div>
    );
}

export function QuickActionSkeleton() {
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-28 animate-pulse" />
    );
}
