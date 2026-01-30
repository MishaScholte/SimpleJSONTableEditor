import * as React from "react"
import { cn } from "@/lib/utils"

export interface ShortcutBadgeProps extends React.HTMLAttributes<HTMLElement> {
    variant?: 'default' | 'small'
}

export function ShortcutBadge({ className, variant = 'default', ...props }: ShortcutBadgeProps) {
    return (
        <kbd
            className={cn(
                "items-center gap-1 rounded border bg-muted font-mono font-medium text-muted-foreground opacity-100 select-none pointer-events-none",
                variant === 'default' && "absolute hidden group-hover:inline-flex h-7 px-2 text-sm whitespace-nowrap z-50",
                variant === 'small' && "inline-flex h-5 justify-center px-1.5 text-[10px] border-muted-foreground/20",
                className
            )}
            {...props}
        />
    )
}
