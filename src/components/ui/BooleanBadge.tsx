import React from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BooleanBadgeProps {
    value: boolean;
    className?: string;
}

export const BooleanBadge: React.FC<BooleanBadgeProps> = ({ value, className }) => {
    return (
        <Badge
            variant={value ? "success" : "error"}
            className={cn("px-2 py-0.5 whitespace-nowrap", className)}
        >
            {value ? "True" : "False"}
        </Badge>
    );
};
