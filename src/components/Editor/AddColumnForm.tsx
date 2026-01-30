import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientInput } from "@/components/ui/gradient-input";
import type { ColumnType } from "@/lib/data-utils";

interface AddColumnFormProps {
    onAdd: (name: string, type: ColumnType, defaultValue?: any) => void;
    onCancel: () => void;
    existingColumns: string[];
}

export const AddColumnForm = ({ onAdd, onCancel, existingColumns }: AddColumnFormProps) => {
    const [name, setName] = useState("");
    const [type, setType] = useState<ColumnType>("text");
    const [defaultValue, setDefaultValue] = useState<string>("null"); // "true", "false", "null"
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when mounted
    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Name cannot be empty");
            return;
        }

        if (trimmedName.includes(" ")) {
            setError("Column names cannot contain spaces");
            return;
        }

        if (existingColumns.includes(trimmedName)) {
            setError("Column name already exists");
            return;
        }

        let finalDefaultValue: any = null;
        if (type === 'boolean') {
            if (defaultValue === 'true') finalDefaultValue = true;
            else if (defaultValue === 'false') finalDefaultValue = false;
            else finalDefaultValue = null;
        }

        onAdd(trimmedName, type, finalDefaultValue);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Add Column</h4>
                <p className="text-sm text-muted-foreground">
                    Create a new column in your table.
                </p>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <GradientInput
                    id="name"
                    ref={inputRef}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder="e.g. status"
                    autoComplete="off"
                    noSuccessState={true}
                    error={!!error}
                />
                {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                {/* Manual wrapper for Select since GradientInput only wraps Input */}
                <div className="input-gradient-wrapper">
                    <Select value={type} onValueChange={(val) => setType(val as ColumnType)}>
                        <SelectTrigger id="type" className="h-8 text-xs font-normal bg-card border-transparent focus:ring-0 focus:border-transparent">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">Text (String)</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="list">List (Array)</SelectItem>
                            <SelectItem value="object">Object (Nested)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {type === 'boolean' && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="defaultValue">Default Value</Label>
                    <div className="input-gradient-wrapper">
                        <Select value={defaultValue} onValueChange={setDefaultValue}>
                            <SelectTrigger id="defaultValue" className="h-8 text-xs font-normal bg-card border-transparent focus:ring-0 focus:border-transparent">
                                <SelectValue placeholder="Select default" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">Null (Empty)</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                                <SelectItem value="true">True</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" size="sm">Add</Button>
            </div>
        </form >
    );
};
