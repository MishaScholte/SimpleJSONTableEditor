import { cn } from "@/lib/utils";

interface ObjectBadgeProps extends React.HTMLAttributes<HTMLButtonElement> {
    keys: string[];
    className?: string;
}

export const ObjectBadge = ({ keys, className, ...props }: ObjectBadgeProps) => {
    return (
        <button
            type="button"
            className={cn(
                "bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-mono cursor-pointer hover:bg-amber-500/30 transition-colors truncate max-w-full block",
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
