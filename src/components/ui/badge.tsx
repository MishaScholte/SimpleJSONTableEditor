import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[4px] border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success:
          "border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20",
        error:
          "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
        info:
          "border-purple-500/20 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
      },
    },
    defaultVariants: {
      variant: "success",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
