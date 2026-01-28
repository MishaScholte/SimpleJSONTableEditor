
import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                className={cn("btn-gradient-border gap-2 transition-all", className)}
                {...props}
            />
        )
    }
)
PrimaryButton.displayName = "PrimaryButton"

export { PrimaryButton }
