
import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SecondaryButtonProps extends Omit<ButtonProps, "variant"> {
    variant?: "default" | "destructive" | "success"
}

const SecondaryButton = React.forwardRef<HTMLButtonElement, SecondaryButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant="ghost"
                size={size}
                className={cn(
                    // Base styles for all secondary buttons
                    "bg-white/5 gap-2 transition-all rounded-[8px]",
                    // Default variant styles
                    variant === "default" && "hover:bg-white/10 text-white",
                    // Destructive variant styles
                    variant === "destructive" && "text-white hover:bg-destructive/10 hover:text-destructive",
                    // Success variant styles
                    variant === "success" && "text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400",
                    className
                )}
                {...props}
            />
        )
    }
)
SecondaryButton.displayName = "SecondaryButton"

export { SecondaryButton }
