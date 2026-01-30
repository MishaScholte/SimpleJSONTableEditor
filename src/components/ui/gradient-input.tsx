import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface GradientInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    wrapperClassName?: string
    noSuccessState?: boolean
    error?: boolean
}

const GradientInput = React.forwardRef<HTMLInputElement, GradientInputProps>(
    ({ className, wrapperClassName, value, noSuccessState = false, error = false, ...props }, ref) => {
        // If noSuccessState is true OR error is true, we never apply 'has-value'
        // Otherwise, we check if there is a value
        const hasValue = !error && !noSuccessState && value !== undefined && value !== "" && value !== null

        return (
            <div
                className={cn(
                    "input-gradient-wrapper w-full relative group rounded-[8px]",
                    hasValue && "has-value",
                    error && "error",
                    wrapperClassName
                )}
            >
                <Input
                    ref={ref}
                    value={value}
                    className={cn(
                        "h-9 text-xs font-normal bg-card border-transparent focus-visible:ring-0 focus-visible:border-transparent placeholder:text-muted-foreground/50 transition-colors w-full",
                        className
                    )}
                    {...props}
                />
            </div>
        )
    }
)
GradientInput.displayName = "GradientInput"

export { GradientInput }
