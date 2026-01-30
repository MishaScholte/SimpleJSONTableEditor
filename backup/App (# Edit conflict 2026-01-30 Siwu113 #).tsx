import { useState, useRef, useEffect, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { DataTable, type SortConfig } from "@/components/Editor/DataTable";
import { inferColumns, safeParseJSON, unflattenObject, type TableRow, type ColumnType, type ColumnSchema, inferSchema } from "@/lib/data-utils";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Import, Download, Trash2, FileJson, Copy, ClipboardPaste, Shield, WifiOff, Undo, Redo, Command, Columns3 } from "lucide-react";
import { ReorderColumnsDialog } from "@/components/Editor/ReorderColumnsDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { DebugPanel } from "@/components/Debug/DebugPanel"; // Debug


// Helper to load initial data
const loadInitialData = (): TableRow[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem("jte-data");
    if (!saved) return [];
    const parsed = safeParseJSON(saved);
    return parsed || [];
  } catch (e) {
    console.error("Failed to load data from local storage", e);
    return [];
  }
};

function App() {
  // State
  // Initialize with data from local storage if available
  const [initialData] = useState<TableRow[]>(loadInitialData);

  const [data, setData, undo, redo, reset, canUndo, canRedo] = useUndoRedo<TableRow[]>(initialData, 100);

  // Initialize columns based on the initial data
  const [columns, setColumns] = useState<string[]>(() => inferColumns(initialData));
  // Global Schema State (Future-proofing for strict type management)
  // Global Schema State (Future-proofing for strict type management)
  const [schema, setSchema] = useState<ColumnSchema>(() => inferSchema(initialData)); // Initialize schema from initial data
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false); // Reorder Modal State

  // --- Phase 1: Column Management Logic ---

  // Helper: Strictly validate column names
  const isValidColumnName = (name: string, existingCols: string[]): { valid: boolean; error?: string } => {
    const trimmed = name.trim();
    if (!trimmed) return { valid: false, error: "Column name cannot be empty." };
    if (trimmed.includes(" ")) return { valid: false, error: "Column name cannot contain spaces." };
    if (existingCols.includes(trimmed)) return { valid: false, error: "Column name must be unique." };
    return { valid: true };
  };

  const handleAddColumn = useCallback((name: string, type: ColumnType, defaultValue: any = null) => {
    const validation = isValidColumnName(name, columns);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // 1. Add to columns list
    setColumns(prev => [...prev, name]);

    // 2. Add to data with default value
    setData(prev => prev.map(row => ({ ...row, [name]: defaultValue })));

    // 3. Update schema
    setSchema(prev => ({ ...prev, [name]: type }));

    toast.success(`Column "${name}" added`);
  }, [columns, setData, setColumns, setSchema]);

  const handleDeleteColumn = (colName: string) => {
    // 1. Remove from Schema
    const newSchema = { ...schema };
    delete newSchema[colName];
    setSchema(newSchema);

    // 2. Remove from Columns List
    const newColumns = columns.filter(c => c !== colName);
    setColumns(newColumns);

    // 3. Remove key from ALL rows (Expensive but necessary for 'Delete')
    const newData = data.map(row => {
      const newRow = { ...row };
      delete newRow[colName];
      return newRow;
    });
    setData(newData); // Undo/Redo handles this automatically because we use 'setData'
    toast.success(`Column "${colName}" deleted.`);
  };

  const handleRenameColumn = (oldName: string, newName: string) => {
    const validation = isValidColumnName(newName, columns);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // 1. Update Schema Key
    const newSchema = { ...schema };
    const type = newSchema[oldName] || 'text'; // preserve type
    delete newSchema[oldName];
    newSchema[newName] = type;
    setSchema(newSchema);

    // 2. Update Columns List
    const newColumns = columns.map(c => c === oldName ? newName : c);
    setColumns(newColumns);

    // 3. Update Data Keys (Expensive)
    const newData = data.map(row => {
      const val = row[oldName];
      const newRow = { ...row };
      delete newRow[oldName];
      // Only start tracking the new key if old key existed (or we can just force migration)
      if (val !== undefined) {
        newRow[newName] = val;
      }
      return newRow;
    });
    setData(newData);
    toast.success(`Renamed "${oldName}" to "${newName}".`);
  };

  const handleReorderColumns = (newOrder: string[]) => {
    setColumns(newOrder); // Update state directly
    toast.success("Columns reordered.");
  };

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence Effect
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem("jte-data", JSON.stringify(data));
    } else {
      localStorage.removeItem("jte-data");
    }
  }, [data]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = safeParseJSON(text);

      if (parsed) {
        reset(parsed); // Use reset to establish new baseline (cannot undo to empty)
        setColumns(inferColumns(parsed));
        setSchema(inferSchema(parsed)); // Infer schema
        setSortConfig(null);
        toast.success(`Imported ${parsed.length} rows successfully.`);
      } else {
        toast.error("Invalid JSON file. Expected an array of objects.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.warning("Nothing to export.");
      return;
    }
    // Unflatten data to restore nested structure
    const exportData = data.map(row => unflattenObject(row));
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File exported.");
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setData([]);
      setColumns([]);
      setSchema({}); // Clear schema
      setSortConfig(null);
      // localStorage removal handled by useEffect
      toast.info("Workspace cleared.");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = safeParseJSON(text);

      if (parsed) {
        reset(parsed); // New baseline
        setColumns(inferColumns(parsed));
        setSchema(inferSchema(parsed)); // Infer schema
        setSortConfig(null);
        toast.success(`Imported ${parsed.length} rows from clipboard.`);
      } else {
        toast.error("Invalid JSON in clipboard. Expected an array of objects.");
      }
    } catch (err) {
      toast.error("Could not read clipboard. Please grant permission.");
    }
  };

  const updateCell = (rowIdx: number, col: string, val: any) => {
    setData(prev => {
      // Optimization: Don't update if value hasn't changed.
      // This prevents duplicate history states if save is triggered multiple times.
      if (prev[rowIdx][col] === val) return prev;

      const newData = [...prev];
      newData[rowIdx] = { ...newData[rowIdx], [col]: val };
      return newData;
    });
  };

  const deleteRow = (rowIdx: number) => {
    setData(prev => {
      const newData = [...prev];
      newData.splice(rowIdx, 1);
      return newData;
    });
    toast.success("Row deleted.");
  };

  const addRow = (row: TableRow) => {
    setData(prev => [...prev, row]);
  };

  const handleSort = (col: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.column === col && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ column: col, direction });

    // Sorting doesn't technically mutate "data" in a way that needs undo history 
    // IF we consider sort view-only. BUT here we were settingData.
    // If we want undo for SORT, use setData. If NOT, we should separate viewData from actualData.
    // For now, let's keep it as is: sorting changes the order in data, so it IS undoable.

    setData(prev => {
      const sorted = [...prev].sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return direction === "asc" ? -1 : 1;
        if (strA > strB) return direction === "asc" ? 1 : -1;
        return 0;
      });
      return sorted;
    });
  };

  const handleUndo = () => {
    if (!canUndo) return;
    undo();
    toast.info("Undone");
  };

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      if (data.length > 0) {
        handleExport();
      }
    },
    onOpen: () => {
      fileInputRef.current?.click();
    },
    onClear: () => {
      if (data.length > 0) {
        if (window.confirm("Are you sure you want to clear the workspace? This cannot be undone.")) {
          setData([]);
          // localStorage removal handled by useEffect
        }
      }
    },
    onUndo: handleUndo,
    onRedo: () => {
      if (canRedo) {
        redo();
        toast.info("Redone");
      }
    },
    onCopy: () => {
      if (data.length > 0) {
        const json = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(json);
        toast.success("JSON copied to clipboard");
      }
    },
    onReorderColumns: () => setIsReorderOpen(true)
  });

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Ignore if user is interacting with an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const text = e.clipboardData?.getData('text');
      if (!text) return;

      const parsed = safeParseJSON(text);

      if (parsed) {
        e.preventDefault(); // Prevent default paste behavior
        reset(parsed); // Reset history on global paste
        setColumns(inferColumns(parsed));
        setSchema(inferSchema(parsed)); // Infer schema
        setSortConfig(null);
        toast.success(`Imported ${parsed.length} rows from clipboard.`);
      } else {
        // Optional: toast.error("Invalid JSON..."); 
        // Decided to show error only if it fails but we tried to parse it? 
        // User requested functionality same as button. Button shows error.
        toast.error("Invalid JSON in clipboard. Expected an array of objects.");
      }
    };

    // window.addEventListener("beforeunload", handleBeforeUnload); // Removed warning
    window.addEventListener("paste", handleGlobalPaste);

    return () => {
      // window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [data, reset, setColumns, setSchema, setSortConfig]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = safeParseJSON(text);
        if (parsed) {
          reset(parsed); // Reset history on drop
          setColumns(inferColumns(parsed));
          setSchema(inferSchema(parsed)); // Infer schema
          setSortConfig(null);
          toast.success(`Imported ${parsed.length} rows.`);
        } else {
          toast.error("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDebugData = (debugData: TableRow[]) => {
    reset(debugData);
    setColumns(inferColumns(debugData));
    setSchema(inferSchema(debugData)); // Infer schema
    setSortConfig(null);
    toast.success(`Loaded debug dataset: ${debugData.length} rows.`);
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans ${data.length === 0 ? 'mesh-background' : ''}`}>
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* Top Header - Only visible when data exists */}
      {data.length > 0 && (
        <header className="h-14 sticky top-0 z-50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5">
              <FileJson className="w-5 h-5" style={{ stroke: 'url(#icon-gradient)' }} />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">JSON Table Editor</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 mr-2">
              <SecondaryButton
                onClick={handleUndo}
                disabled={!canUndo}
                className="h-9 w-9 px-0 disabled:opacity-30"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </SecondaryButton>
              <SecondaryButton
                onClick={redo}
                disabled={!canRedo}
                className="h-9 w-9 px-0 disabled:opacity-30"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo className="w-4 h-4" />
              </SecondaryButton>
            </div>
            <div className="w-px h-6 bg-border mx-1" />

            <SecondaryButton onClick={() => setIsReorderOpen(true)} className="h-9 w-9 px-0 group relative" title="Reorder Columns">
              <Columns3 className="w-4 h-4" />
              <kbd className="absolute top-full mt-2 hidden group-hover:inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground opacity-100 whitespace-nowrap z-50">
                <span>⇧⌘</span>O
              </kbd>
            </SecondaryButton>

            <div className="w-px h-6 bg-border mx-1" />

            <SecondaryButton onClick={() => {
              const json = JSON.stringify(data, null, 2);
              navigator.clipboard.writeText(json);
              toast.success("JSON copied to clipboard");
            }} className="h-9 px-3 text-xs gap-1.5 group relative">
              <Copy className="w-4 h-4" /> Copy JSON
              <kbd className="absolute top-full mt-2 hidden group-hover:inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground opacity-100 whitespace-nowrap z-50">
                <span>⌘</span>C
              </kbd>
            </SecondaryButton>
            <SecondaryButton onClick={handleExport} className="h-9 px-3 text-xs gap-1.5 group relative">
              <Download className="w-4 h-4" /> Download JSON
              <kbd className="absolute top-full mt-2 hidden group-hover:inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground opacity-100 whitespace-nowrap z-50">
                <span>⌘</span>S
              </kbd>
            </SecondaryButton>
            <div className="w-px h-6 bg-border mx-1" />
            <SecondaryButton onClick={handleClear} variant="destructive" className="h-9 px-3 text-xs gap-1.5 group relative">
              <Trash2 className="w-4 h-4" /> Clear workspace
              <kbd className="absolute top-full mt-2 hidden group-hover:inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground opacity-100 whitespace-nowrap z-50">
                <span>⌘</span>⌫
              </kbd>
            </SecondaryButton>
          </div>
        </header>
      )}

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 relative overflow-hidden">
            <div className="relative w-full max-w-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[55%] z-20 w-full text-center pointer-events-none">
                <h1 className="neon-hero-title">
                  TableJSON
                </h1>
              </div>
              <Card
                className="w-full jte-card rounded-[3.5rem] transition-colors relative border-0"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragging && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-card/95 backdrop-blur-sm rounded-[3.5rem] pointer-events-none">
                    <h2 className="text-3xl font-semibold text-white">Drop to import</h2>
                  </div>
                )}
                <CardHeader className="p-16 pb-8 space-y-0 text-left pointer-events-none">
                  <CardTitle className="text-4xl font-semibold tracking-tight leading-[1.15]">The <span className="line-through decoration-white decoration-2 text-muted-foreground">simple</span> <span className="bg-gradient-to-r from-[rgb(245,190,85)] via-[rgb(217,126,75)] to-[rgb(190,70,70)] bg-clip-text text-transparent">overengineered</span><br />JSON table editor</CardTitle>
                  <CardDescription className="text-xl pt-6 leading-relaxed text-white/80">
                    Because juggling JSON and Excel sucks. TableJSON is a beautifully overengineerd Excel-like editor for JSON files. All the simplicity, none of the suffering. <br /><br />Everything stays on your machine. Nowhere else.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-16 pb-16 pt-4 flex flex-col gap-8">
                  <div className="flex flex-row gap-6">
                    <PrimaryButton onClick={handlePaste} className="flex-1 h-14 text-base [&_svg]:size-6 group relative">
                      <ClipboardPaste className="w-6 h-6" /> Paste JSON
                      <kbd className="absolute right-4 hidden group-hover:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">⌘</span>V
                      </kbd>
                    </PrimaryButton>
                    <SecondaryButton onClick={() => fileInputRef.current?.click()} className="flex-1 h-14 text-base [&_svg]:size-6 group relative">
                      <Import className="w-6 h-6" /> Import JSON File
                      <kbd className="absolute right-4 hidden group-hover:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">⌘</span>O
                      </kbd>
                    </SecondaryButton>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* USPs below card */}
            <div className="flex flex-row justify-center gap-10 text-base text-white/80">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" style={{ stroke: 'url(#icon-gradient)' }} />
                <span>Privacy by design</span>
              </div>
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5" style={{ stroke: 'url(#icon-gradient)' }} />
                <span>100% offline</span>
              </div>
              <div className="flex items-center gap-3">
                <Command className="w-5 h-5" style={{ stroke: 'url(#icon-gradient)' }} />
                <span>Shortcuts for everything</span>
              </div>
            </div>

            {/* Debug Panel (Dev Only) */}
            {import.meta.env.DEV && (
              <>
                <DebugPanel onLoad={handleLoadDebugData} />
              </>
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {/* Table Area - Fixed Height for Internal Scrolling */}
            <div className="flex-1 overflow-hidden px-6 py-2 h-full">
              <DataTable
                data={data}
                columns={columns}
                schema={schema} // Pass schema prop
                onUpdateCell={updateCell}
                onDeleteRow={deleteRow}
                sortConfig={sortConfig}
                onSort={handleSort}
                onAdd={addRow}
                onAddColumn={(name, type, defaultValue) => {
                  handleAddColumn(name, type as ColumnType, defaultValue);
                  setIsAddColumnOpen(false);
                }}

                isAddColumnOpen={isAddColumnOpen}
                onAddColumnOpenChange={setIsAddColumnOpen}
                onDeleteColumn={handleDeleteColumn}
                onRenameColumn={handleRenameColumn}
                onOpenReorder={() => setIsReorderOpen(true)}
              />
            </div>



          </div>
        )}
      </main>

      {/* SVG gradient definition for icons - always rendered */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(245,190,85)" />
            <stop offset="50%" stopColor="rgb(217,126,75)" />
            <stop offset="100%" stopColor="rgb(190,70,70)" />
          </linearGradient>
        </defs>
      </svg>

      <Toaster position="bottom-right" theme="dark" className="font-sans" offset={80} style={{ right: 16 }} />

      {/* Reorder Dialog */}
      <ReorderColumnsDialog
        open={isReorderOpen}
        onOpenChange={setIsReorderOpen}
        columns={columns}
        onReorder={handleReorderColumns}
      />
    </div>
  );
}

export default App;
