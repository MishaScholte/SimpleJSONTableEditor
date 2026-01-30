import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatArrayOutput, parseArrayInput, type TableRow as RowData, type ColumnSchema, type ColumnType } from "@/lib/data-utils";
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown, X, Plus } from "lucide-react";
import { NestedTableModal } from "./NestedTableModal";
import { SlashMenu } from "./SlashMenu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddColumnForm } from "./AddColumnForm";

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
    // Column Management Handlers
    onAddColumn?: (name: string, type: ColumnType, defaultValue?: any) => void;
    isAddColumnOpen?: boolean;
    onAddColumnOpenChange?: (open: boolean) => void;
    lockColumns?: boolean;
    onDeleteColumn?: (col: string) => void;
    onRenameColumn?: (oldName: string, newName: string) => void;
    onOpenReorder?: () => void;
    schema?: ColumnSchema;
    readOnly?: boolean;
    onEditingChange?: (isEditing: boolean) => void;
}

// --- Sub-components for Performance ---

// 1. Editable Cell: Manages its own input state to prevent table-wide re-renders
interface EditableCellProps {
    initialValue: any;
    onSave: (val: any) => void;
    onCancel: () => void;
    onNavigate?: (dir: 'next' | 'prev') => void;
}

const EditableCell: React.FC<EditableCellProps> = ({ initialValue, onSave, onCancel, onNavigate }) => {
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
            e.preventDefault(); // Prevent Dialog from closing
            e.stopPropagation(); // Prevent table listener from catching this
            isCanceling.current = true; // Flag to ignore blur
            onCancel(); // Cancel without saving
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            e.stopPropagation(); // Ensure space works in input
        } else if (e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
            onNavigate?.(e.shiftKey ? 'prev' : 'next');
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
    onOpenNested: (rowIdx: number, col: string, data: any) => void;
    onNavigate: (dir: 'next' | 'prev') => void;
}

const DataTableRow = memo(({
    row, rowIdx, columns, isEditingCell, focusedCol, isDeleteFocused, lastAddedIndex, readOnly,
    onStartEdit, onUpdateCell, onCancelEdit, onDeleteRow, onFocusCell, onFocusDelete, onOpenNested, onNavigate
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
                                onNavigate={onNavigate}
                            />
                        ) : (
                            <div className="flex items-center w-full overflow-hidden">
                                {val !== null && typeof val === 'object' && !Array.isArray(val) ? (
                                    // Object Chip - clickable to open modal, shows key names
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenNested(rowIdx, col, val); }}
                                        className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-mono cursor-pointer hover:bg-amber-500/30 transition-colors truncate max-w-full"
                                        title={Object.keys(val).join(", ")}
                                    >
                                        {Object.keys(val).join(", ")}
                                    </button>
                                ) : Array.isArray(val) ? (
                                    // Check if array contains objects
                                    val.some(item => typeof item === 'object' && item !== null && !Array.isArray(item)) ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenNested(rowIdx, col, val); }}
                                            className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs font-mono cursor-pointer hover:bg-blue-500/30 transition-colors"
                                        >
                                            {"[ "}{val.length} items{" ]"}
                                        </button>
                                    ) : (
                                        <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium truncate max-w-full">
                                            {formatArrayOutput(val)}
                                        </span>
                                    )
                                ) : typeof val === 'boolean' ? (
                                    <div className="flex">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${val ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                                            {val ? "True" : "False"}
                                        </span>
                                    </div>
                                ) : (
                                    <span className={`truncate text-sm w-full ${typeof val === 'number' ? "font-mono" : ""}`}>{String(val ?? "")}</span>
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
    onOpenNested: (col: string, initialData: any, onSave: (data: any) => void) => void;
    onFocus?: () => void;
}

const QuickAddFooter: React.FC<QuickAddFooterProps> = ({ columns, onAdd, firstInputRef, onOpenNested, onFocus }) => {
    const [values, setValues] = useState<Record<string, any>>({});
    const [types, setTypes] = useState<Record<string, 'auto' | 'text' | 'number' | 'boolean'>>({});
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Slash Menu State
    const [menuState, setMenuState] = useState<{ col: string; query: string; anchorEl: HTMLElement | null } | null>(null);
    const [focusTarget, setFocusTarget] = useState<string | null>(null);

    // Deterministic Focus Management
    React.useLayoutEffect(() => {
        if (focusTarget) {
            const el = inputRefs.current[focusTarget];
            if (el) {
                el.focus();
            }
            setFocusTarget(null);
        }
    }, [focusTarget]);

    const handleAdd = () => {
        const newRow: RowData = {};
        let hasData = false;
        // ... (omitted unchanged parts) ...


        columns.forEach(col => {
            const rawVal = values[col];
            if (rawVal !== undefined && rawVal !== "") hasData = true;

            // If complex type (Object/Array), use as is
            if (rawVal !== null && typeof rawVal === 'object') {
                newRow[col] = rawVal;
                return;
            }

            // Primitive Handling with Type Enforcement
            const type = types[col] || 'auto';
            const valStr = String(rawVal || "");

            if (type === 'text') {
                newRow[col] = valStr;
            } else if (type === 'number') {
                const num = Number(valStr);
                newRow[col] = isNaN(num) ? valStr : num;
            } else if (type === 'boolean') {
                newRow[col] = valStr.toLowerCase() === 'true';
            } else {
                // Auto (Default)
                if (valStr.includes(',')) {
                    newRow[col] = parseArrayInput(valStr);
                } else if (!isNaN(Number(valStr)) && valStr !== "") {
                    newRow[col] = Number(valStr);
                } else {
                    newRow[col] = valStr;
                }
            }
        });

        if (hasData) {
            onAdd(newRow);
            setValues({});
            setTypes({});
            // Focus back to first input
            setTimeout(() => {
                firstInputRef.current?.focus();
            }, 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // If menu is open, let it handle arrows/enter (except Esc)
        if (menuState) {
            if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
                // SlashMenu attaches its own listener, but we must stop propagation here
                // to prevent table actions.
                // However, SlashMenu uses document listener.
                // We just need to ensure we don't trigger OUR Insert/Nav logic.
                // Wait, if Insert triggers on Enter, we must stop it if menu is selecting.
                // Since SlashMenu handles Enter on 'keydown' globally, strict timing matters.
                // Ideally input onKeyDown fires first.
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setMenuState(null);
                return;
            }
        }

        if (e.key === 'Enter') {
            e.stopPropagation();
            handleAdd();
            return;
        }

        if (['Backspace', 'Delete', ' ', 'Spacebar', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.stopPropagation();
        }
    };

    const handleInputChange = (col: string, val: string, anchor?: HTMLElement) => {
        // Check for Slash Command
        if (val.startsWith('/')) {
            setMenuState({ col, query: val.slice(1), anchorEl: anchor || null });
        } else {
            if (menuState?.col === col) setMenuState(null);
        }
        setValues(prev => ({ ...prev, [col]: val }));
    };

    const handleCommandSelect = (command: string) => {
        if (!menuState) return;
        const col = menuState.col;

        switch (command) {
            case 'text':
            case 'number':
                setTypes(prev => ({ ...prev, [col]: command as any }));
                setValues(prev => ({ ...prev, [col]: "" }));
                setFocusTarget(col);
                break;
            case 'bool':
                setTypes(prev => ({ ...prev, [col]: 'boolean' })); // Normalize 'bool' to 'boolean'
                setValues(prev => ({ ...prev, [col]: "" }));
                setFocusTarget(col);
                break;
            case 'obj':
            case 'list':
                // Open Nested Modal immediately
                const initialData = command === 'obj' ? {} : [];
                onOpenNested(col, initialData, (savedData) => {
                    setValues(prev => ({ ...prev, [col]: savedData }));
                });
                setValues(prev => ({ ...prev, [col]: "" })); // Clear input while modal opens
                break;
        }
        setMenuState(null);
    };

    return (
        <TableFooter className="glass z-10 border-t flex-none w-full block">
            <TableRow
                className="grid w-full items-center hover:bg-transparent"
                style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(100px, 1fr)) 50px` }}
            >
                {columns.map((col, idx) => {
                    const value = values[col];
                    const isComplex = value !== null && typeof value === 'object';
                    const currentType = types[col];

                    return (
                        <TableCell key={`input-${col}`} className="p-4 py-5 flex items-center justify-center relative">
                            {/* Slash Menu */}
                            {menuState?.col === col && (
                                <SlashMenu
                                    query={menuState.query}
                                    onSelect={handleCommandSelect}
                                    onClose={() => setMenuState(null)}
                                    anchorEl={menuState.anchorEl}
                                />
                            )}

                            <div className={`input-gradient-wrapper w-full relative group rounded-[8px] ${value ? "has-value" : ""}`}>
                                {isComplex ? (
                                    <div className="flex items-center gap-1 pl-2 pr-1 py-1 h-8 w-full bg-secondary/50 rounded-[8px] border border-white/10">
                                        {Array.isArray(value) ? (
                                            <span className="text-xs text-blue-400 font-mono flex-1 truncate">Array [{value.length}]</span>
                                        ) : (
                                            <span className="text-xs text-amber-400 font-mono flex-1 truncate">Object &#123;...&#125;</span>
                                        )}
                                        <button
                                            onClick={() => setValues(prev => {
                                                const next = { ...prev };
                                                delete next[col];
                                                return next;
                                            })}
                                            className="hover:bg-destructive/20 text-muted-foreground hover:text-destructive p-1 rounded"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => onOpenNested(col, value, (saved) => setValues(prev => ({ ...prev, [col]: saved })))}
                                            className="hover:bg-primary/20 text-muted-foreground hover:text-primary p-1 rounded font-bold text-xs"
                                        >
                                            ✎
                                        </button>
                                    </div>
                                ) : (
                                    <Input
                                        ref={(el) => {
                                            if (idx === 0) firstInputRef.current = el; // Keep existing firstRef logic
                                            inputRefs.current[col] = el;
                                        }}
                                        key={`input-el-${col}`} // Stable key to prevent remounting
                                        onFocus={onFocus} // Clear table focus
                                        placeholder={currentType && currentType !== 'auto' ? `${currentType}:` : col}
                                        value={typeof value === 'string' ? value : ""}
                                        onChange={(e) => handleInputChange(col, e.target.value, e.target as HTMLElement)}
                                        onKeyDown={handleKeyDown}
                                        className={`h-8 text-xs font-normal bg-card border-transparent focus-visible:ring-0 focus-visible:border-transparent placeholder:text-muted-foreground/50 transition-colors w-full pr-8 ${currentType === 'number' ? "font-mono" : (currentType && currentType !== 'auto' ? "font-medium" : "")}`}
                                    />
                                )}

                                {!isComplex && value?.length > 0 && !menuState && (
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
                    );
                })}
                <TableCell className="w-[50px] p-4 py-5 flex items-center justify-center">

                </TableCell>
            </TableRow>
        </TableFooter>
    );
};

// --- Main Component ---

export const DataTable: React.FC<DataTableProps> = ({
    data,
    columns,
    sortConfig,
    onSort,
    onUpdateCell,
    onDeleteRow,
    onAdd,
    readOnly = false,
    onEditingChange,
    onAddColumn,
    isAddColumnOpen,
    onAddColumnOpenChange
}) => {
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
    const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
    const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null);
    // nestedModal state updated to support onSave callback
    const [nestedModal, setNestedModal] = useState<{ open: boolean; title: string; type?: string; data: any; rowIdx: number; col: string; onSave?: (data: any) => void } | null>(null);

    const tableBodyRef = useRef<HTMLTableSectionElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null); // For capturing key events
    const firstInputRef = useRef<HTMLInputElement>(null);
    const shouldScrollRef = useRef(false);

    // Notify parent about editing state
    useEffect(() => {
        onEditingChange?.(!!editingCell);
    }, [editingCell, onEditingChange]);

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

    // Use callbacks to maintain referential identity for Memoized rows
    const handleStartEdit = useCallback((rowIdx: number, col: string) => {
        if (readOnly) return;

        const val = data[rowIdx]?.[col];
        // If value is object, always open modal
        // If value is array, check content:
        // - Array of objects -> Modal
        // - Array of primitives -> Inline Edit (comma separated)
        if (val !== null && typeof val === 'object') {
            if (Array.isArray(val)) {
                // Check if any item is an object
                const hasObjects = val.some(v => v !== null && typeof v === 'object');
                if (!hasObjects) {
                    setEditingCell({ row: rowIdx, col });
                    return;
                }
            }

            setNestedModal({
                open: true,
                title: col,
                type: columnTypes[col],
                data: val,
                rowIdx,
                col
            });
            return;
        }

        setEditingCell({ row: rowIdx, col });
    }, [data, readOnly, columnTypes]);

    const handleCancelEdit = useCallback(() => {
        setEditingCell(null);
        // Return focus to container so navigation works
        tableContainerRef.current?.focus();
    }, []);

    const handleNavigate = useCallback((dir: 'next' | 'prev') => {
        if (!editingCell) return;
        const { row, col: colName } = editingCell;
        const colIdx = columns.indexOf(colName);
        const colCount = columns.length;
        const rowCount = data.length;

        if (dir === 'next') {
            if (colIdx < colCount) {
                setFocusedCell({ row, col: colIdx + 1 });
            } else if (row < rowCount - 1) {
                setFocusedCell({ row: row + 1, col: 0 });
            }
        } else {
            if (colIdx > 0) {
                setFocusedCell({ row, col: colIdx - 1 });
            } else if (row > 0) {
                setFocusedCell({ row: row - 1, col: colCount });
            }
        }
        setEditingCell(null);
        tableContainerRef.current?.focus();
    }, [editingCell, columns, data.length]);

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


    useEffect(() => {
        if (focusedCell) {
            if (focusedCell.row >= data.length) {
                setFocusedCell({ row: Math.max(0, data.length - 1), col: focusedCell.col });
            }
        }
    }, [data.length, focusedCell]);

    // Keyboard Navigation Logic
    const handleTableKeyDown = (e: React.KeyboardEvent) => {
        // Ignore events when Add Column popover is open
        if (isAddColumnOpen) return;

        // Ignore events from Inputs, Textareas, Buttons, and ContentEditable elements
        // This prevents the table from stealing focus/events from these interactive elements
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'BUTTON' ||
            target.isContentEditable ||
            target.closest('[role="dialog"]') // Ignore if inside a dialog/popover
        ) return;

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
                        <TableHead className="w-[50px] p-0">
                            {!readOnly && onAddColumn && (
                                <Popover open={isAddColumnOpen} onOpenChange={(open) => {
                                    if (open) setFocusedCell(null);
                                    onAddColumnOpenChange?.(open);
                                }}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-full w-full rounded-none hover:bg-muted"
                                            title="Add Column"
                                        >
                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-80">
                                        <AddColumnForm
                                            onAdd={(name, type, defaultValue) => onAddColumn(name, type, defaultValue)}
                                            onCancel={() => onAddColumnOpenChange?.(false)}
                                            existingColumns={columns}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </TableHead>
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
                            onOpenNested={(rowIdx, col, nestedData) => setNestedModal({ open: true, title: col, type: columnTypes[col], data: nestedData, rowIdx, col })}
                            readOnly={readOnly}
                            onNavigate={handleNavigate}
                        />
                    ))}
                </TableBody>

                {!readOnly && (
                    <QuickAddFooter
                        columns={columns}
                        onAdd={handleAddRow}
                        firstInputRef={firstInputRef}
                        onFocus={() => setFocusedCell(null)} // Clear table focus when footer is active
                        onOpenNested={(col, data, onSave) => setNestedModal({
                            open: true,
                            title: col,
                            type: columnTypes[col],
                            data: data,
                            rowIdx: -1, // New row
                            col: col,
                            onSave: onSave
                        })}
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
                    type={nestedModal.type}
                    data={nestedModal.data}
                    onUpdateData={(newData) => {
                        // Support saving to temporary state (Footer)
                        if (nestedModal.onSave) {
                            nestedModal.onSave(newData);
                            // Do not close modal automatically? Or closer handles it?
                            // NestedTableModal doesn't close itself. We just update data.
                            // But for Footer, we might want to update and propagate?
                            // Actually NestedTableModal updates internal state.
                            // Wait, NestedTableModal calls onUpdateData when data changes.
                            // It's up to us to persist or not.
                            // For a new row, we update the Footer state.
                            return;
                        }

                        // Propagate nested changes back to parent
                        if (onUpdateCell && nestedModal) {
                            onUpdateCell(nestedModal.rowIdx, nestedModal.col, newData);
                        }
                    }}
                />
            )}
        </div>
    );
};
