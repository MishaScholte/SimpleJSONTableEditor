import React from 'react';
import { cn } from "@/lib/utils";

interface BooleanBadgeProps {
    value: boolean;
    className?: string;
}

export const BooleanBadge: React.FC<BooleanBadgeProps> = ({ value, className }) => {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium border inline-flex items-center justify-center select-none",
            value
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-red-500/10 text-red-500 border-red-500/20",
            className
        )}>
            {value ? "True" : "False"}
        </span>
    );
};
