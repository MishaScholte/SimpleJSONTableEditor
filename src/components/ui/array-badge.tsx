import * as React from "react"
import { badgeVariants } from "./badge"
import { cn } from "@/lib/utils"

export interface ArrayBadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    length: number
}

export const ArrayBadge = ({ length, className, ...props }: ArrayBadgeProps) => {
    return (
        <button
            type="button"
            className={cn(
                badgeVariants({ variant: "info" }),
                "font-mono cursor-pointer truncate max-w-full block",
                className
            )}
            title={`Array [${length}]`}
            {...props}
        >
            <span>[ {length} items ]</span>
        </button>
    )
}
