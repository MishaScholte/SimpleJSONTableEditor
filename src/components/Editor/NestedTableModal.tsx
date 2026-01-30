import React, { useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "./DataTable";
import { inferColumns, inferSchema } from "@/lib/data-utils";
import { ReorderColumnsDialog } from "./ReorderColumnsDialog";

interface NestedTableModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    data: Record<string, any> | Array<Record<string, any>>;
    onUpdateData?: (newData: Record<string, any> | Array<Record<string, any>>) => void;
    type?: string;
}

export const NestedTableModal: React.FC<NestedTableModalProps> = ({
    open,
    onOpenChange,
    title,
    data: initialData,
    onUpdateData,
    type,
}) => {
    // Local state for the data we're editing
    const [localData, setLocalData] = useState(initialData);

    // Reset local data when modal opens with new data
    React.useEffect(() => {
        setLocalData(initialData);
    }, [initialData]);

    const [nestedModal, setNestedModal] = useState<{
        open: boolean;
        title: string;
        data: any;
        rowIdx: number;
        col: string;
    } | null>(null);

    // Track editing state to prevent closing modal on Escape when editing
    const [isEditing, setIsEditing] = useState(false);

    // Column Reordering State
    const [columnOrder, setColumnOrder] = useState<string[]>([]);
    const [isReorderOpen, setIsReorderOpen] = useState(false);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    const isArray = Array.isArray(localData);


    // Sync column order with data changes
    React.useEffect(() => {
        if (!isArray) return;

        const currentColumns = inferColumns(localData as Array<Record<string, any>>);
        setColumnOrder(prev => {
            // Keep existing order for known columns, append new ones
            const existing = prev.filter(c => currentColumns.includes(c));
            const newCols = currentColumns.filter(c => !prev.includes(c));

            // If strictly equal sets, don't update to avoid loops (though strict equality check is hard here, 
            // but length check + every check helps)
            if (existing.length === prev.length && newCols.length === 0) return prev;

            return [...existing, ...newCols];
        });
    }, [localData, isArray]);

    // Handle cell updates for array data
    const handleUpdateCell = useCallback((rowIdx: number, col: string, value: any) => {
        if (!isArray) {
            // For key-value object display
            const entries = Object.entries(localData);
            const oldKey = entries[rowIdx][0];

            if (col === "key") {
                // Renaming the key
                // 1. Create new object to maintain order (roughly)
                const newData: Record<string, any> = {};
                entries.forEach(([k, v], idx) => {
                    if (idx === rowIdx) {
                        newData[value] = v; // Use new key
                    } else {
                        newData[k] = v;
                    }
                });
                setLocalData(newData);
                onUpdateData?.(newData);
            } else {
                // Updating the value
                const newData = { ...localData, [oldKey]: value };
                setLocalData(newData);
                onUpdateData?.(newData);
            }
        } else {
            // For arrays
            const newData = [...(localData as Array<Record<string, any>>)];
            newData[rowIdx] = { ...newData[rowIdx], [col]: value };
            setLocalData(newData);
            onUpdateData?.(newData);
        }
    }, [localData, isArray, onUpdateData]);

    // Handle nested modal updates
    const handleNestedUpdate = useCallback((nestedData: any) => {
        if (!nestedModal) return;

        if (!isArray) {
            // For key-value object display
            const entries = Object.entries(localData);
            const key = entries[nestedModal.rowIdx][0];
            const newData = { ...localData, [key]: nestedData };
            setLocalData(newData);
            onUpdateData?.(newData);
        } else {
            // For arrays
            const newData = [...(localData as Array<Record<string, any>>)];
            newData[nestedModal.rowIdx] = {
                ...newData[nestedModal.rowIdx],
                [nestedModal.col]: nestedData
            };
            setLocalData(newData);
            onUpdateData?.(newData);
        }
    }, [nestedModal, localData, isArray, onUpdateData]);

    const handleDeleteRow = useCallback((rowIdx: number) => {
        if (!isArray) {
            // For key-value, remove the key
            const entries = Object.entries(localData);
            const keyToRemove = entries[rowIdx][0];
            const { [keyToRemove]: _, ...rest } = localData as Record<string, any>;
            setLocalData(rest);
            onUpdateData?.(rest);
        } else {
            // For array, splice the item
            const newData = [...(localData as Array<Record<string, any>>)];
            newData.splice(rowIdx, 1);
            setLocalData(newData);
            onUpdateData?.(newData);
        }
    }, [localData, isArray, onUpdateData]);

    const handleAddRow = useCallback((row: any) => {
        if (!isArray) {
            // For key-value object: row is { key: "newKey", value: "newValue" }
            // We need to ensure key is unique
            let newKey = row.key || "new_key";
            let counter = 1;
            while (newKey in localData) {
                newKey = `${row.key || "new_key"}_${counter++}`;
            }

            const newData = { ...localData, [newKey]: row.value || "" };
            setLocalData(newData);
            onUpdateData?.(newData);
        } else {
            // For array, push the new row
            const newData = [...(localData as Array<Record<string, any>>), row];
            setLocalData(newData);
            onUpdateData?.(newData);
        }
    }, [localData, isArray, onUpdateData]);

    const handleAddColumn = useCallback((name: string, type: string, defaultValue: any = null) => {
        if (isArray) {
            // Determine default value based on type if not provided
            if (defaultValue === undefined || defaultValue === null) {
                if (type === 'text') defaultValue = "";
                else if (type === 'number') defaultValue = 0;
                else if (type === 'boolean') defaultValue = false;
                else if (type === 'list') defaultValue = [];
                else if (type === 'object') defaultValue = {};
            }

            // Add new property to all items in array
            const newData = (localData as Array<Record<string, any>>).map(item => ({
                ...item,
                [name]: defaultValue
            }));
            setLocalData(newData);
            onUpdateData?.(newData);
        }
    }, [localData, isArray, onUpdateData]);

    const handleRenameColumn = useCallback((oldName: string, newName: string) => {
        if (isArray) {
            // Rename property in all items
            const newData = (localData as Array<Record<string, any>>).map(item => {
                const { [oldName]: value } = item;
                // Place new key at end or try to preserve order? 
                // Simple spread puts it at end. To preserve order we act like Object.entries logic usually
                const newItem: Record<string, any> = {};
                Object.keys(item).forEach(k => {
                    if (k === oldName) newItem[newName] = value;
                    else newItem[k] = item[k];
                });
                return newItem;
            });
            setLocalData(newData);
            onUpdateData?.(newData);
        }
    }, [localData, isArray, onUpdateData]);

    const handleDeleteColumn = useCallback((colName: string) => {
        if (isArray) {
            // Remove property from all items
            const newData = (localData as Array<Record<string, any>>).map(item => {
                const { [colName]: _, ...rest } = item;
                return rest;
            });
            setLocalData(newData);
            onUpdateData?.(newData);
        }
    }, [localData, isArray, onUpdateData]);

    // Prepare data for DataTable
    const tableData = isArray
        ? (localData as Array<Record<string, any>>)
        : Object.entries(localData).map(([key, value]) => ({ key, value }));

    const tableColumns = isArray
        ? columnOrder
        : ["key", "value"];

    const tableSchema = isArray
        ? inferSchema(localData as Array<Record<string, any>>)
        : { key: "text", value: "text" } as const;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none flex flex-col rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
                    style={{ width: "calc(100vw - 32px)", height: "calc(100vh - 32px)", maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 32px)" }}
                    onEscapeKeyDown={(e) => {
                        if (isEditing) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader className="flex flex-row items-center justify-between shrink-0">
                        <DialogTitle className="text-xl font-semibold flex items-baseline gap-2">
                            <span>Column: {title}</span>
                            {type && <span className="text-base font-normal text-muted-foreground opacity-80">({type})</span>}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        <DataTable
                            data={tableData}
                            columns={tableColumns}
                            schema={tableSchema}
                            onUpdateCell={handleUpdateCell}
                            onDeleteRow={handleDeleteRow}
                            onAdd={handleAddRow}
                            onAddColumn={handleAddColumn}
                            onRenameColumn={handleRenameColumn}
                            onDeleteColumn={handleDeleteColumn}
                            onEditingChange={setIsEditing}
                            lockColumns={!isArray}
                            onOpenReorder={isArray ? () => setIsReorderOpen(true) : undefined}
                            isAddColumnOpen={isAddColumnOpen}
                            onAddColumnOpenChange={setIsAddColumnOpen}
                        />
                    </div>

                    {/* Reorder Dialog */}
                    {isArray && (
                        <ReorderColumnsDialog
                            open={isReorderOpen}
                            onOpenChange={setIsReorderOpen}
                            columns={columnOrder}
                            onReorder={setColumnOrder}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Nested modal for drilling down */}
            {nestedModal && (
                <NestedTableModal
                    open={nestedModal.open}
                    onOpenChange={(open) => {
                        if (!open) setNestedModal(null);
                    }}
                    title={nestedModal.title}
                    data={nestedModal.data}
                    onUpdateData={handleNestedUpdate}
                />
            )}
        </>
    );
};
