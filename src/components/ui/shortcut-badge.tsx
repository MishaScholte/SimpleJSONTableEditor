import * as React from "react"
import { cn } from "@/lib/utils"

export interface ShortcutBadgeProps extends React.HTMLAttributes<HTMLElement> { }

export function ShortcutBadge({ className, ...props }: ShortcutBadgeProps) {
    return (
        <kbd
            className={cn(
                "absolute hidden group-hover:inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground opacity-100 whitespace-nowrap z-50 pointer-events-none",
                className
            )}
            {...props}
        />
    )
}
