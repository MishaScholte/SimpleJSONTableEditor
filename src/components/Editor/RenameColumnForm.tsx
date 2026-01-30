import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GradientInput } from "@/components/ui/gradient-input";

interface RenameColumnFormProps {
    initialName: string;
    existingColumns: string[];
    onRename: (newName: string) => void;
    onCancel: () => void;
}

export const RenameColumnForm = ({ initialName, existingColumns, onRename, onCancel }: RenameColumnFormProps) => {
    const [name, setName] = useState(initialName);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when mounted
    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select(); // Select all text for easy replacement
        }, 50);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Name cannot be empty");
            return;
        }

        if (trimmedName !== initialName) { // Only validate if changed
            if (trimmedName.includes(" ")) {
                setError("Column names cannot contain spaces");
                return;
            }

            if (existingColumns.includes(trimmedName)) {
                setError("Column name already exists");
                return;
            }
        }

        onRename(trimmedName);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Rename Column</h4>
                <p className="text-sm text-muted-foreground">
                    Enter a new name for this column.
                </p>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="rename-name">Name</Label>
                <GradientInput
                    id="rename-name"
                    ref={inputRef}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder={initialName}
                    autoComplete="off"
                    noSuccessState={true}
                    error={!!error}
                />
                {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!!error || !name.trim()}>Save</Button>
            </div>
        </form>
    );
};
