import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatArrayOutput, parseArrayInput, type TableRow as RowData } from "@/lib/data-utils";
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { NestedTableModal } from "./NestedTableModal";

export interface SortConfig {
    column: string;
    direction: "asc" | "desc";
}

interface DataTableProps {
    data: RowData[];
    columns: string[];
    sortConfig?: SortConfig | null;
    onSort?: (col: string) => void;
    onUpdateCell?: (rowIdx: number, col: string, value: any) => void;
    onDeleteRow?: (rowIdx: number) => void;
    onAdd?: (row: RowData) => void;
    readOnly?: boolean;
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
    const isCanceling = useRef(false);
    const isSaving = useRef(false);

    useEffect(() => {
        if (Array.isArray(initialValue)) {
            setValue(formatArrayOutput(initialValue));
        } else {
            setValue(String(initialValue ?? ""));
        }
    }, [initialValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.stopPropagation(); // Prevent table listener from catching this
            handleSave();
        } else if (e.key === 'Escape') {
            e.stopPropagation(); // Prevent table listener from catching this
            isCanceling.current = true; // Flag to ignore blur
            onCancel(); // Cancel without saving
        }
    };

    const handleSave = () => {
        if (isCanceling.current || isSaving.current) return;
        isSaving.current = true;

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

    // Auto-focus the input when it mounts
    return (
        <div className="input-gradient-wrapper w-full relative group rounded-[8px]">
            <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="h-8 w-full focus-visible:ring-0 focus-visible:border-transparent bg-background pr-8"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-100 transition-opacity duration-200">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border-[1px] border-solid border-green-500/20 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
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
    focusedCol: string | null; // Only pass the col if this row is focused
    isDeleteFocused: boolean; // Is the delete button focused?
    lastAddedIndex: number | null;
    readOnly?: boolean;
    onStartEdit: (rowIdx: number, col: string) => void;
    onUpdateCell: (rowIdx: number, col: string, val: any) => void;
    onCancelEdit: () => void;
    onDeleteRow: (rowIdx: number) => void;
    onFocusCell: (rowIdx: number, col: string) => void;
    onFocusDelete: (rowIdx: number) => void;
    onOpenNested: (title: string, data: any) => void;
}

const DataTableRow = memo(({
    row, rowIdx, columns, isEditingCell, focusedCol, isDeleteFocused, lastAddedIndex, readOnly,
    onStartEdit, onUpdateCell, onCancelEdit, onDeleteRow, onFocusCell, onFocusDelete, onOpenNested
}: DataTableRowProps) => {
    return (
        <TableRow
            className={`grid w-full items-center border-b last:border-0 hover:bg-muted/5 ${rowIdx === lastAddedIndex ? "animate-new-row" : ""}`}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr)) 50px` }}
        >
            {columns.map((col) => {
                const val = row[col];
                const isEditing = isEditingCell?.col === col;
                const isFocused = focusedCol === col && !isEditing;

                return (
                    <TableCell
                        key={col}
                        className={`cursor-pointer transition-colors px-4 py-5 overflow-hidden h-full flex items-center relative ${isFocused ? "outline-2 outline-white outline-offset-[-2px] outline-double z-10" : "outline-none"}`}
                        onClick={() => {
                            onFocusCell(rowIdx, col);
                            // Optional: Double click to edit handled via onDoubleClick? Or keep single click = focus, double = edit? 
                            // For now, click sets focus. Enter triggers edit.
                        }}
                        onDoubleClick={() => onStartEdit(rowIdx, col)}
                    >
                        {isEditing ? (
                            <EditableCell
                                initialValue={val}
                                onSave={(newVal) => onUpdateCell(rowIdx, col, newVal)}
                                onCancel={onCancelEdit}
                            />
                        ) : (
                            <div className="flex items-center w-full overflow-hidden">
                                {val !== null && typeof val === 'object' && !Array.isArray(val) ? (
                                    // Object Chip - clickable to open modal, shows key names
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenNested(col, val); }}
                                        className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-mono cursor-pointer hover:bg-amber-500/30 transition-colors truncate max-w-full"
                                        title={Object.keys(val).join(", ")}
                                    >
                                        {Object.keys(val).join(", ")}
                                    </button>
                                ) : Array.isArray(val) ? (
                                    // Check if array contains objects
                                    val.some(item => typeof item === 'object' && item !== null && !Array.isArray(item)) ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenNested(col, val); }}
                                            className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs font-mono cursor-pointer hover:bg-blue-500/30 transition-colors"
                                        >
                                            {"[ "}{val.length} items{" ]"}
                                        </button>
                                    ) : (
                                        <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium truncate max-w-full">
                                            {formatArrayOutput(val)}
                                        </span>
                                    )
                                ) : (
                                    <span className="truncate text-sm w-full">{String(val ?? "")}</span>
                                )}
                            </div>
                        )}
                    </TableCell>
                );
            })}
            {!readOnly && (
                <TableCell className="w-[50px] flex items-center justify-center p-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 ${isDeleteFocused ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""}`}
                        onClick={(e) => { e.stopPropagation(); onDeleteRow(rowIdx); }}
                        onFocus={() => onFocusDelete(rowIdx)}
                        tabIndex={-1} // Handled by manual focus state
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TableCell>
            )}
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
            e.stopPropagation();
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
                        <div className={`input-gradient-wrapper w-full relative group rounded-[8px] ${values[col]?.length > 0 ? "has-value" : ""}`}>
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
                                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border-[1px] border-solid border-green-500/20 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
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

export const DataTable: React.FC<DataTableProps> = ({ data, columns, sortConfig, onSort, onUpdateCell, onDeleteRow, onAdd, readOnly = false }) => {
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
    const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
    const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
    const [nestedModal, setNestedModal] = useState<{ open: boolean; title: string; data: any } | null>(null);

    const tableBodyRef = useRef<HTMLTableSectionElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null); // For capturing key events
    const firstInputRef = useRef<HTMLInputElement>(null);
    const shouldScrollRef = useRef(false);

    useEffect(() => {
        // Initial focus when data loads
        if (data.length > 0 && !focusedCell) {
            setFocusedCell({ row: 0, col: 0 });
            // Defer focus to allow render
            setTimeout(() => {
                tableContainerRef.current?.focus();
            }, 50);
        }
    }, [data.length]);

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
        // Return focus to container so navigation works
        tableContainerRef.current?.focus();
    }, []);

    const handleUpdateCell = useCallback((rowIdx: number, col: string, val: any) => {
        if (readOnly || !onUpdateCell) return;
        onUpdateCell(rowIdx, col, val);
        setEditingCell(null);
        tableContainerRef.current?.focus();
    }, [onUpdateCell, readOnly]);

    const handleAddRow = useCallback((row: RowData) => {
        if (readOnly || !onAdd) return;
        shouldScrollRef.current = true;
        onAdd(row);
    }, [onAdd, readOnly]);


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


    // Clamp focused cell if data shrinks (e.g. after delete)
    useEffect(() => {
        if (focusedCell) {
            if (focusedCell.row >= data.length) {
                setFocusedCell({ row: Math.max(0, data.length - 1), col: focusedCell.col });
            }
        }
    }, [data.length, focusedCell]);

    // Keyboard Navigation Logic
    const handleTableKeyDown = (e: React.KeyboardEvent) => {
        // If we are editing, let the input handle it (unless it propagates, but we stopped prop in EditableCell)
        if (editingCell) return;

        // Handle Re-entry with Arrows if no cell is focused but container is focused
        if (!focusedCell && data.length > 0) {
            if (e.key.startsWith("Arrow")) {
                e.preventDefault();
                setFocusedCell({ row: 0, col: 0 });
            }
            return;
        }

        // If no data or focus, ignore
        if (!focusedCell || data.length === 0) return;

        const { row, col } = focusedCell;
        const colCount = columns.length;
        const rowCount = data.length;

        // Shortcuts that don't depend on specific keys first
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            firstInputRef.current?.focus();
            return;
        }

        switch (e.key) {
            case "Escape":
                e.preventDefault();
                setFocusedCell(null);
                // We keep focus on the container, so native Tab will move to the next focusable element (Buttons in header or Footer inputs)
                break;
            case "ArrowUp":
                e.preventDefault();
                if (row > 0) setFocusedCell({ row: row - 1, col });
                break;
            case "ArrowDown":
                e.preventDefault();
                if (row < rowCount - 1) setFocusedCell({ row: row + 1, col });
                break;
            case "ArrowLeft":
                e.preventDefault();
                if (col > 0) setFocusedCell({ row, col: col - 1 });
                break;
            case "ArrowRight":
                e.preventDefault();
                // Allow moving to colCount (Delete Button) check
                if (col < colCount) setFocusedCell({ row, col: col + 1 });
                break;
            case "Tab":
                if (e.shiftKey) {
                    // Shift+Tab: Move Left
                    if (col > 0) {
                        e.preventDefault();
                        setFocusedCell({ row, col: col - 1 });
                    } else if (row > 0) {
                        e.preventDefault();
                        // When going back to previous row, start at Delete Button (colCount)
                        setFocusedCell({ row: row - 1, col: colCount });
                    } else {
                        // At start: Exit table (Shift+Tab out)
                        setFocusedCell(null);
                        // Do NOT prevent default -> allow focus to move to previous element
                    }
                } else {
                    // Tab: Move Right
                    if (col < colCount) {
                        // Can move to next col (including Delete Button which is index colCount)
                        e.preventDefault();
                        setFocusedCell({ row, col: col + 1 });
                    } else if (row < rowCount - 1) {
                        e.preventDefault();
                        setFocusedCell({ row: row + 1, col: 0 });
                    } else {
                        // At end (on Delete Button of last row): Exit table (Tab out)
                        setFocusedCell(null);
                        // Do NOT prevent default -> allow focus to move to next element
                    }
                }
                break;
            case "Enter":
            case " ": // Space also activates buttons
                e.preventDefault();
                if (col === colCount) {
                    // Delete Button
                    if (!readOnly && onDeleteRow) onDeleteRow(row);
                } else {
                    // Start editing the focused cell
                    if (!readOnly) {
                        const colName = columns[col];
                        if (colName) {
                            handleStartEdit(row, colName);
                        }
                    }
                }
                break;
            case "Delete":
            case "Backspace":
                if (!readOnly && !editingCell && !e.metaKey && !e.ctrlKey) {
                    if (e.shiftKey || col === colCount) {
                        // Shift + Delete/Backspace OR on Delete Button = Delete Row
                        e.preventDefault();
                        if (onDeleteRow) onDeleteRow(row);
                    } else {
                        // Regular Delete/Backspace = Clear Value
                        e.preventDefault();
                        const colName = columns[col];
                        if (colName) {
                            handleUpdateCell(row, colName, "");
                        }
                    }
                }
                break;
            default:
                break;
        }
    };


    const handleContainerFocus = (e: React.FocusEvent) => {
        // Only if focusing the container directly (e.g. via Tab), not a child (input)
        if (e.target === e.currentTarget && !focusedCell && data.length > 0) {
            // Prevent scrolling to bottom when focusing top
            // (Browser might try to scroll to focused element)
            setFocusedCell({ row: 0, col: 0 });
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
        <div
            className="jte-card-table h-full flex flex-col overflow-hidden outline-none focus-visible:outline-none focus:outline-none focus-visible:ring-0 ring-0 border-transparent"
            ref={tableContainerRef}
            tabIndex={0}
            onKeyDown={handleTableKeyDown}
            onFocus={handleContainerFocus}
        >
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
                                    className={`flex items-center px-4 py-5 font-semibold ${!readOnly && onSort ? 'cursor-pointer hover:bg-muted/50' : ''} transition-colors select-none overflow-hidden ${isSorted ? "text-foreground font-bold" : ""}`}
                                    onClick={() => !readOnly && onSort?.(col)}
                                >
                                    <div className="flex items-center gap-2 truncate w-full">
                                        <div className="flex items-baseline gap-1.5 truncate">
                                            <span className="truncate text-white">{col}</span>
                                            <span className="text-white/80 text-[10px] font-normal">({columnTypes[col]})</span>
                                        </div>
                                        {isSorted ? (
                                            sortConfig.direction === "asc" ? (
                                                <ArrowUp className="w-3 h-3 text-green-500 shrink-0" />
                                            ) : (
                                                <ArrowDown className="w-3 h-3 text-green-500 shrink-0" />
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
                            focusedCol={focusedCell?.row === rowIdx && focusedCell?.col !== undefined && focusedCell.col < columns.length ? columns[focusedCell.col] : null}
                            isDeleteFocused={focusedCell?.row === rowIdx && focusedCell?.col === columns.length}
                            lastAddedIndex={lastAddedIndex}
                            onStartEdit={(r, c) => handleStartEdit(r, c)} // Fix type mismatch manually if needed but simplified here
                            onUpdateCell={handleUpdateCell}
                            onCancelEdit={handleCancelEdit}
                            onDeleteRow={onDeleteRow ?? (() => { })}
                            onFocusCell={(r, c) => setFocusedCell({ row: r, col: columns.indexOf(c) })}
                            onFocusDelete={(r) => setFocusedCell({ row: r, col: columns.length })}
                            onOpenNested={(title, nestedData) => setNestedModal({ open: true, title, data: nestedData })}
                            readOnly={readOnly}
                        />
                    ))}
                </TableBody>

                {!readOnly && (
                    <QuickAddFooter
                        columns={columns}
                        onAdd={handleAddRow}
                        firstInputRef={firstInputRef}
                    />
                )}
            </Table>

            {/* Nested Table Modal for objects/arrays */}
            {nestedModal && (
                <NestedTableModal
                    open={nestedModal.open}
                    onOpenChange={(open) => {
                        if (!open) setNestedModal(null);
                    }}
                    title={nestedModal.title}
                    data={nestedModal.data}
                />
            )}
        </div>
    );
};
