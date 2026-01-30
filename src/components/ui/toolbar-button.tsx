import type { ReactNode } from "react";
import { SecondaryButton } from "@/components/ui/secondary-button";
import type { ComponentProps } from "react";

interface ToolbarButtonProps extends ComponentProps<typeof SecondaryButton> {
    icon: ReactNode;
    label: string;
    shortcut?: string;
}

export function ToolbarButton({ icon, label, shortcut, className, ...props }: ToolbarButtonProps) {
    return (
        <SecondaryButton className={`h-9 w-9 px-0 group relative ${className}`} {...props}>
            {icon}
            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 hidden group-hover:inline-flex h-8 select-none items-center gap-2 rounded-md border bg-popover px-3 text-sm shadow-md z-50 whitespace-nowrap">
                <span className="text-foreground font-medium">{label}</span>
                {shortcut && <span className="text-muted-foreground font-mono text-xs">{shortcut}</span>}
            </div>
        </SecondaryButton>
    )
}
