import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatArrayOutput, parseArrayInput, type TableRow as RowData } from "@/lib/data-utils";
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

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

// --- Sub-components for Performance ---

// 1. Editable Cell: Manages its own input state to prevent table-wide re-renders
interface EditableCellProps {
    initialValue: any;
    onSave: (val: any) => void;
    onCancel: () => void;
}

const EditableCell: React.FC<EditableCellProps> = ({ initialValue, onSave, onCancel }) => {
    const [value, setValue] = useState<string>("");

    useEffect(() => {
        if (Array.isArray(initialValue)) {
            setValue(formatArrayOutput(initialValue));
        } else {
            setValue(String(initialValue ?? ""));
        }
    }, [initialValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleSave = () => {
        let finalValue: any = value;
        if (Array.isArray(initialValue)) {
            finalValue = parseArrayInput(value);
        } else if (typeof initialValue === 'number') {
            finalValue = Number(value);
            if (isNaN(finalValue)) finalValue = value;
        } else if (typeof initialValue === 'boolean') {
            finalValue = value.toLowerCase() === 'true';
        }
        onSave(finalValue);
    };

    return (
        <div className="input-gradient-wrapper w-full relative group">
            <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="h-8 w-full focus-visible:ring-0 focus-visible:border-transparent bg-background pr-8"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-100 transition-opacity duration-200">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs text-green-500">
                        ⏎
                    </span>
                </kbd>
            </div>
        </div>
    );
};

// 2. Memoized Row: Only re-renders if its data or editing state changes
interface DataTableRowProps {
    row: RowData;
    rowIdx: number;
    columns: string[];
    isEditingCell: { col: string } | null; // Only pass the col if this row is being edited
    lastAddedIndex: number | null;
    onStartEdit: (rowIdx: number, col: string, val: any) => void;
    onUpdateCell: (rowIdx: number, col: string, val: any) => void;
    onCancelEdit: () => void;
    onDeleteRow: (rowIdx: number) => void;
}

const DataTableRow = memo(({
    row, rowIdx, columns, isEditingCell, lastAddedIndex,
    onStartEdit, onUpdateCell, onCancelEdit, onDeleteRow
}: DataTableRowProps) => {
    return (
        <TableRow
            className={`grid w-full items-center border-b last:border-0 hover:bg-muted/5 ${rowIdx === lastAddedIndex ? "animate-new-row" : ""}`}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr)) 50px` }}
        >
            {columns.map((col) => {
                const val = row[col];
                const isEditing = isEditingCell?.col === col;

                return (
                    <TableCell
                        key={col}
                        className="cursor-pointer transition-colors px-4 py-5 overflow-hidden h-full flex items-center"
                        onClick={() => !isEditing && onStartEdit(rowIdx, col, val)}
                    >
                        {isEditing ? (
                            <EditableCell
                                initialValue={val}
                                onSave={(newVal) => onUpdateCell(rowIdx, col, newVal)}
                                onCancel={onCancelEdit}
                            />
                        ) : (
                            <div className="flex items-center w-full overflow-hidden">
                                {Array.isArray(val) ? (
                                    <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium truncate max-w-full">
                                        {formatArrayOutput(val)}
                                    </span>
                                ) : (
                                    <span className="truncate text-sm w-full">{String(val ?? "")}</span>
                                )}
                            </div>
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
    );
});
DataTableRow.displayName = "DataTableRow";

// 3. Quick Add Footer: Manages its own state
interface QuickAddFooterProps {
    columns: string[];
    onAdd: (row: RowData) => void;
    firstInputRef: React.RefObject<HTMLInputElement | null>;
}

const QuickAddFooter: React.FC<QuickAddFooterProps> = ({ columns, onAdd, firstInputRef }) => {
    const [values, setValues] = useState<Record<string, string>>({});

    const handleAdd = () => {
        const newRow: RowData = {};
        let hasData = false;

        columns.forEach(col => {
            const rawVal = values[col] || "";
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
            onAdd(newRow);
            setValues({});
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    return (
        <TableFooter className="glass z-10 border-t flex-none w-full block">
            <TableRow
                className="grid w-full items-center hover:bg-transparent"
                style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr)) 50px` }}
            >
                {columns.map((col, idx) => (
                    <TableCell key={`input-${col}`} className="p-4 py-5 flex items-center justify-center">
                        <div className="input-gradient-wrapper w-full relative group">
                            <Input
                                ref={idx === 0 ? firstInputRef : null}
                                placeholder={col}
                                value={values[col] || ""}
                                onChange={(e) => setValues(prev => ({ ...prev, [col]: e.target.value }))}
                                onKeyDown={handleKeyDown}
                                className="h-8 text-xs font-normal bg-card border-transparent focus-visible:ring-0 focus-visible:border-transparent placeholder:text-muted-foreground/50 transition-colors w-full pr-8"
                            />
                            {values[col]?.length > 0 && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
                                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                        <span className="text-xs text-green-500">
                                            ⏎
                                        </span>
                                    </kbd>
                                </div>
                            )}
                        </div>
                    </TableCell>
                ))}
                <TableCell className="w-[50px] p-4 py-5 flex items-center justify-center">

                </TableCell>
            </TableRow>
        </TableFooter>
    );
};

// --- Main Component ---

export const DataTable: React.FC<DataTableProps> = ({ data, columns, sortConfig, onSort, onUpdateCell, onDeleteRow, onAdd }) => {
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
    const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);

    const tableBodyRef = useRef<HTMLTableSectionElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const shouldScrollRef = useRef(false);

    useEffect(() => {
        if (shouldScrollRef.current && tableBodyRef.current) {
            tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
            shouldScrollRef.current = false;

            if (firstInputRef.current) {
                firstInputRef.current.focus();
            }

            setLastAddedIndex(data.length - 1);
            const timer = setTimeout(() => setLastAddedIndex(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [data.length]);

    // Use callbacks to maintain referential identity for Memoized rows
    const handleStartEdit = useCallback((rowIdx: number, col: string) => {
        setEditingCell({ row: rowIdx, col });
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingCell(null);
    }, []);

    const handleUpdateCell = useCallback((rowIdx: number, col: string, val: any) => {
        onUpdateCell(rowIdx, col, val);
        setEditingCell(null);
    }, [onUpdateCell]);

    const handleAddRow = useCallback((row: RowData) => {
        shouldScrollRef.current = true;
        onAdd(row);
    }, [onAdd]);


    const columnTypes = React.useMemo(() => {
        const types: Record<string, string> = {};
        columns.forEach(col => {
            const rowWithData = data.find(row => row[col] !== null && row[col] !== undefined);
            if (rowWithData) {
                const val = rowWithData[col];
                if (Array.isArray(val)) types[col] = "array";
                else if (val === null) types[col] = "string";
                else types[col] = typeof val;
            } else {
                types[col] = "string";
            }
        });
        return types;
    }, [data, columns]);


    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                <p>No data loaded. Import a JSON file to get started.</p>
            </div>
        );
    }

    return (
        <div className="jte-card-table h-full flex flex-col overflow-hidden">
            <Table className="flex flex-col h-full w-full">
                <TableHeader className="glass z-10 flex-none w-full block">
                    <TableRow
                        className="grid w-full items-center border-b hover:bg-transparent"
                        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr)) 50px` }}
                    >
                        {columns.map((col) => {
                            const isSorted = sortConfig?.column === col;
                            return (
                                <TableHead
                                    key={col}
                                    className={`flex items-center px-4 py-5 font-semibold cursor-pointer hover:bg-muted/50 transition-colors select-none overflow-hidden ${isSorted ? "text-foreground font-bold" : ""}`}
                                    onClick={() => onSort(col)}
                                >
                                    <div className="flex items-center gap-2 truncate w-full">
                                        <div className="flex items-baseline gap-1.5 truncate">
                                            <span className="truncate text-white">{col}</span>
                                            <span className="text-white/80 text-[10px] font-normal">({columnTypes[col]})</span>
                                        </div>
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
                        <DataTableRow
                            key={rowIdx}
                            row={row}
                            rowIdx={rowIdx}
                            columns={columns}
                            isEditingCell={editingCell?.row === rowIdx ? editingCell : null}
                            lastAddedIndex={lastAddedIndex}
                            onStartEdit={handleStartEdit}
                            onUpdateCell={handleUpdateCell}
                            onCancelEdit={handleCancelEdit}
                            onDeleteRow={onDeleteRow}
                        />
                    ))}
                </TableBody>

                <QuickAddFooter
                    columns={columns}
                    onAdd={handleAddRow}
                    firstInputRef={firstInputRef}
                />
            </Table>
        </div>
    );
};
