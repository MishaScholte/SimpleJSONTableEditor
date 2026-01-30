import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface ObjectInputPopoverProps {
    inferredKeys: string[];
    value: Record<string, any>;
    onChange: (val: Record<string, any>) => void;
    columnName: string;
    children: React.ReactNode;
}

export const ObjectInputPopover: React.FC<ObjectInputPopoverProps> = ({ inferredKeys, value, onChange, children, columnName }) => {
    const [open, setOpen] = useState(false);
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

    const handleRemoveKey = (key: string) => {
        const next = { ...localValue };
        delete next[key];
        setLocalValue(next);
        onChange(next);
    };

    const handleManualAddKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const key = e.currentTarget.value.trim();
            if (key) {
                if (!(key in localValue)) {
                    handleKeyChange(key, "");
                }
                e.currentTarget.value = "";
            }
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

    // If inferredKeys is empty and value is empty, show a way to add a key.

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 glass border border-white/10 rounded-[8px]" align="start">
                <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <h4 className="font-medium leading-none text-sm text-amber-400 font-mono">
                            {columnName} <span className="text-muted-foreground opacity-50">&#123; &#125;</span>
                        </h4>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {displayKeys.map(key => (
                            <div key={key} className="grid grid-cols-[1fr_auto] gap-2 items-center group">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono pl-1">{key}</label>
                                    <Input
                                        value={localValue[key] || ""}
                                        onChange={(e) => handleKeyChange(key, e.target.value)}
                                        className="h-7 text-xs bg-muted/20 border-white/5 focus:bg-muted/40"
                                        placeholder="value..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.stopPropagation(); // Prevent Form Submit
                                        }}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-4"
                                    onClick={() => handleRemoveKey(key)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                        {displayKeys.length === 0 && (
                            <div className="text-xs text-muted-foreground py-2 text-center italic">
                                No keys inferred. Add one below.
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t border-white/10">
                        <div className="relative">
                            <Plus className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <Input
                                placeholder="Add new key (Press Enter)..."
                                className="h-7 pl-7 text-xs bg-transparent border-dashed border-white/20 focus:border-solid"
                                onKeyDown={handleManualAddKey}
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
