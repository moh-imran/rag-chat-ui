import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

export default function Logo({ className = "", size = 40 }: LogoProps) {
    return (
        <img
            src="/logo.svg"
            alt="RAG Chat Logo"
            width={size}
            height={size}
            className={className}
        />
    );
}
