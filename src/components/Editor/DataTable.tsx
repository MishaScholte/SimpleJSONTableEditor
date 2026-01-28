import React, { useState, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatArrayOutput, parseArrayInput, type TableRow as RowData } from "@/lib/data-utils";
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown, Plus } from "lucide-react";

export interface SortConfig {
    column: string;
    direction: "asc" | "desc";
}

interface DataTableProps {
    data: RowData[];
    columns: string[];
    sortConfig: SortConfig | null;
    onSort: (col: string) => void;
    onUpdateCell: (rowIdx: number, col: string, value: any) => void;
    onDeleteRow: (rowIdx: number) => void;
    onAdd: (row: RowData) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, columns, sortConfig, onSort, onUpdateCell, onDeleteRow, onAdd }) => {
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);

    // Refs for interaction logic
    const tableBodyRef = useRef<HTMLTableSectionElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const shouldScrollRef = useRef(false);

    // Quick Add State
    const [newRowValues, setNewRowValues] = useState<Record<string, string>>({});

    // Scroll to bottom and focus first input when a new row is added (triggered by shouldScrollRef)
    useEffect(() => {
        if (shouldScrollRef.current && tableBodyRef.current) {
            // Scroll to bottom
            tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
            shouldScrollRef.current = false;

            // Refocus first input
            if (firstInputRef.current) {
                firstInputRef.current.focus();
            }

            // Trigger animation for the new last row
            setLastAddedIndex(data.length - 1);
            const timer = setTimeout(() => setLastAddedIndex(null), 2000); // Animation duration + buffer
            return () => clearTimeout(timer);
        }
    }, [data.length]);

    const handleQuickAdd = () => {
        const newRow: RowData = {};
        let hasData = false;

        columns.forEach(col => {
            const rawVal = newRowValues[col] || "";
            if (rawVal) hasData = true;

            if (rawVal.includes(',')) {
                newRow[col] = parseArrayInput(rawVal);
            } else if (!isNaN(Number(rawVal)) && rawVal !== "") {
                newRow[col] = Number(rawVal);
            } else {
                newRow[col] = rawVal;
            }
        });

        if (hasData) {
            shouldScrollRef.current = true;
            onAdd(newRow);
            setNewRowValues({});
        }
    };

    const handleQuickAddKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleQuickAdd();
        }
    };

    const startEditing = (rowIdx: number, col: string, initialValue: any) => {
        setEditingCell({ row: rowIdx, col });

        if (Array.isArray(initialValue)) {
            setEditValue(formatArrayOutput(initialValue));
        } else {
            setEditValue(String(initialValue ?? ""));
        }
    };

    const saveEdit = () => {
        if (!editingCell) return;
        const originalValue = data[editingCell.row][editingCell.col];
        let newValue: any = editValue;

        if (Array.isArray(originalValue)) {
            newValue = parseArrayInput(editValue);
        } else if (typeof originalValue === 'number') {
            newValue = Number(editValue);
            if (isNaN(newValue)) newValue = editValue;
        } else if (typeof originalValue === 'boolean') {
            newValue = editValue.toLowerCase() === 'true';
        }

        onUpdateCell(editingCell.row, editingCell.col, newValue);
        setEditingCell(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                <p>No data loaded. Import a JSON file to get started.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card h-full flex flex-col overflow-hidden">
            <Table className="flex flex-col h-full w-full">
                <TableHeader className="bg-muted z-10 shadow-sm flex-none w-full block">
                    {/* Header Row */}
                    <TableRow
                        className="grid w-full items-center border-b hover:bg-transparent"
                        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr)) 50px` }}
                    >
                        {columns.map((col) => {
                            const isSorted = sortConfig?.column === col;
                            return (
                                <TableHead
                                    key={col}
                                    className={`flex items-center h-10 px-2 font-semibold cursor-pointer hover:bg-muted/50 transition-colors select-none overflow-hidden ${isSorted ? "text-foreground font-bold" : ""}`}
                                    onClick={() => onSort(col)}
                                >
                                    <div className="flex items-center gap-2 truncate w-full">
                                        <span className="truncate">{col}</span>
                                        {isSorted ? (
                                            sortConfig.direction === "asc" ? (
                                                <ArrowUp className="w-3 h-3 text-primary shrink-0" />
                                            ) : (
                                                <ArrowDown className="w-3 h-3 text-primary shrink-0" />
                                            )
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-50 shrink-0" />
                                        )}
                                    </div>
                                </TableHead>
                            );
                        })}
                        <TableHead className="w-[50px] p-0"></TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody ref={tableBodyRef} className="flex-1 overflow-y-auto w-full block min-h-0">
                    {data.map((row, rowIdx) => (
                        <TableRow
                            key={rowIdx}
                            className={`grid w-full items-center border-b last:border-0 hover:bg-muted/5 ${rowIdx === lastAddedIndex ? "animate-new-row" : ""}`}
                            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr)) 50px` }}
                        >
                            {columns.map((col) => {
                                const val = row[col];
                                const isEditing = editingCell?.row === rowIdx && editingCell?.col === col;

                                return (
                                    <TableCell
                                        key={col}
                                        className="cursor-pointer transition-colors p-2 overflow-hidden h-full flex items-center"
                                        onClick={() => !isEditing && startEditing(rowIdx, col, val)}
                                    >
                                        {isEditing ? (
                                            <Input
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={handleKeyDown}
                                                className="h-8 w-full"
                                            />
                                        ) : (
                                            <span className="block w-full truncate text-sm">
                                                {Array.isArray(val) ? (
                                                    <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium inline-block truncate max-w-full">
                                                        {formatArrayOutput(val)}
                                                    </span>
                                                ) : (
                                                    String(val ?? "")
                                                )}
                                            </span>
                                        )}
                                    </TableCell>
                                );
                            })}
                            <TableCell className="w-[50px] flex items-center justify-center p-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => { e.stopPropagation(); onDeleteRow(rowIdx); }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>

                <TableFooter className="bg-muted z-10 shadow-sm border-t flex-none w-full block">
                    <TableRow
                        className="grid w-full items-center hover:bg-transparent"
                        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr)) 50px` }}
                    >
                        {columns.map((col, idx) => (
                            <TableCell key={`input-${col}`} className="p-2 py-4 flex items-center justify-center">
                                <Input
                                    ref={idx === 0 ? firstInputRef : null}
                                    placeholder={col}
                                    value={newRowValues[col] || ""}
                                    onChange={(e) => setNewRowValues(prev => ({ ...prev, [col]: e.target.value }))}
                                    onKeyDown={handleQuickAddKeyDown}
                                    className="h-8 text-xs font-normal bg-card border-transparent focus:border-primary focus:ring-0 placeholder:text-muted-foreground/50 transition-colors w-full"
                                />
                            </TableCell>
                        ))}
                        <TableCell className="w-[50px] p-2 py-4 flex items-center justify-center">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={handleQuickAdd}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
};
