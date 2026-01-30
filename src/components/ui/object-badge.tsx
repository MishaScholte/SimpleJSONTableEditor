import { cn } from "@/lib/utils";
import { badgeVariants } from "@/components/ui/badge";

interface ObjectBadgeProps extends React.HTMLAttributes<HTMLButtonElement> {
    keys: string[];
    className?: string; // Allow overrides
}

export const ObjectBadge = ({ keys, className, ...props }: ObjectBadgeProps) => {
    return (
        <button
            type="button"
            className={cn(
                badgeVariants({ variant: "warning" }),
                "font-mono cursor-pointer truncate max-w-full block hover:opacity-80", // badgeVariants has hover bg logic, but we can tweak
                className
            )}
            title={keys.join(", ")}
            {...props}
        >
            {keys.length > 0 ? (
                <span>&#123; {keys.join(", ")} &#125;</span>
            ) : (
                <span>&#123; &#125;</span>
            )}
        </button>
    );
};
