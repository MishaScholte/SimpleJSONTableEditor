import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { GradientInput } from "@/components/ui/gradient-input";

import { Button } from "@/components/ui/button";
import { Check, CornerDownLeft } from "lucide-react";

interface ObjectInputPopoverProps {
    inferredKeys: string[];
    value: Record<string, any>;
    onChange: (val: Record<string, any>) => void;
    columnName: string;
    children: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
    onSubmit?: () => void;
}

export const ObjectInputPopover: React.FC<ObjectInputPopoverProps> = ({ inferredKeys, value, onChange, children, columnName, onOpenChange, onSubmit }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        onOpenChange?.(open);
    }, [open, onOpenChange]);
    const [localValue, setLocalValue] = useState<Record<string, any>>({});

    // Sync local state when popover opens or value changes externally
    useEffect(() => {
        if (open) {
            setLocalValue(value || {});
        }
    }, [open, value]);

    const handleKeyChange = (key: string, val: string) => {
        const next = { ...localValue, [key]: val };
        // Clean empty keys if needed, or allow empty string?
        // Let's allow empty string.
        setLocalValue(next);
        onChange(next); // Live update? Or only on save? 
        // Plan said: "Output: Calls onChange with the constructed object." 
        // Live update feels better for "Quick Add".
    };



    const [focusedKey, setFocusedKey] = useState<string | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false); // Close on submit
            onSubmit?.();
        }
    };

    // Merge inferred keys with keys actually in the local value
    const displayKeys = Array.from(new Set([
        ...inferredKeys,
        ...Object.keys(value || {})
    ]));

    // We use PopoverAnchor to keep the trigger (input) where it is, 
    // but we can also just wrap the trigger. 
    // The previous implementation used PopoverAnchor which caused issues if not exported.
    // Let's use standard wrapping if children is the trigger.

    // Wait, the design in DataTable probably renders the Input, and we want to attach this popover to it.
    // If we wrap the Input with Popover, does it affect layout?
    // QuickAddFooter renders: TableCell > div(wrapper) > Input.
    // We can wrap the inner Input.

    // Auto-focus first input when popover opens
    useEffect(() => {
        if (open) {
            // Small delay to allow popover to render
            setTimeout(() => {
                const firstInput = document.querySelector('[data-object-input-first]');
                if (firstInput instanceof HTMLElement) firstInput.focus();
            }, 50);
        }
    }, [open]);

    // Expose a way to programmatically open? 
    // Or just rely on the trigger being focused?
    // The previous issue was: "als het volgende input field de object is, dan zie ik niet de object popover met de focus op het eerste veld"
    // This typically means we need to detect when the wrapping trigger (which is likely the Div acting as input replacement) gets focus.

    // Actually, in DataTable.tsx, the ObjectInputPopover wraps the 'inputComponent'.
    // If the 'inputComponent' (the Input replacement) gets focus, we want to open this popover.

    // We can use `onFocus` on the trigger child?
    // But `children` is opaque here.

    // Let's modify the Trigger to be an interactive element that handles `onFocus`.
    // But Radix PopoverTrigger handles click.
    // We want it to open on FOCUS too.

    // Let's wrap `children` in a `div` that handles `onFocus`? 
    // Or clone the child and add `onFocus`?

    const handleTriggerFocus = () => {
        if (!open) setOpen(true);
    };

    // Manual trigger handling instead of PopoverTrigger to avoid focus/click race conditions
    const triggerWithHandlers = React.cloneElement(children as React.ReactElement, {
        onFocus: (e: React.FocusEvent) => {
            handleTriggerFocus();
            (children as any).props.onFocus?.(e);
        },
        onClick: (e: React.MouseEvent) => {
            if (!open) setOpen(true);
            (children as any).props.onClick?.(e);
        }
    } as any);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
                {triggerWithHandlers}
            </PopoverAnchor>
            <PopoverContent
                className="w-80 p-4 glass border border-white/10 rounded-[8px]"
                align="start"
                onCloseAutoFocus={(e) => {
                    // Prevent Radix from restoring focus to the trigger, 
                    // so we can manually move focus to the next input in onSubmit
                    e.preventDefault();
                }}
            >
                <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2">
                        <h4 className="font-medium leading-none text-sm text-neutral-400 font-mono">
                            {columnName} <span className="text-muted-foreground opacity-50">&#123; &#125;</span>
                        </h4>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                        {displayKeys.map(key => (
                            <div key={key} className="flex items-center gap-2 group">
                                <label className="text-[10px] uppercase tracking-wide text-neutral-400 font-mono w-1/3 truncate text-right shrink-0" title={key}>{key}</label>
                                <GradientInput
                                    data-object-input-first={displayKeys.indexOf(key) === 0 ? "true" : undefined}
                                    value={localValue[key] || ""}
                                    onChange={(e) => handleKeyChange(key, e.target.value)}
                                    onFocus={() => setFocusedKey(key)}
                                    onKeyDown={handleKeyDown}
                                    className="" // Default (h-8 text-xs) matches AddColumnForm
                                    wrapperClassName="flex-1 min-w-0"
                                    placeholder="..."
                                    noSuccessState={true}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            size="sm"
                            className="h-7 px-3 text-xs gap-1.5 transition-all text-white bg-green-600 hover:bg-green-500"
                        >
                            {focusedKey === displayKeys[displayKeys.length - 1] ? (
                                <CornerDownLeft className="w-3.5 h-3.5" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                            Done
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
