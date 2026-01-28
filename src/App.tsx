import { useState, useRef, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { DataTable, type SortConfig } from "@/components/Editor/DataTable";
import { inferColumns, safeParseJSON, type TableRow } from "@/lib/data-utils";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Import, Download, Trash2, FileJson, Copy, ClipboardPaste, Shield, WifiOff, CloudOff, HammerIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function App() {
  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = safeParseJSON(text);

      if (parsed) {
        setData(parsed);
        setColumns(inferColumns(parsed));
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
    const jsonString = JSON.stringify(data, null, 2);
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
      setSortConfig(null);
      toast.info("Workspace cleared.");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = safeParseJSON(text);

      if (parsed) {
        setData(parsed);
        setColumns(inferColumns(parsed));
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
    const newData = [...data];
    newData[rowIdx] = { ...newData[rowIdx], [col]: val };
    setData(newData);
  };

  const deleteRow = (rowIdx: number) => {
    const newData = [...data];
    newData.splice(rowIdx, 1);
    setData(newData);
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
    const sorted = [...data].sort((a, b) => {
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
    setData(sorted);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (data.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

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
        setData(parsed);
        setColumns(inferColumns(parsed));
        setSortConfig(null);
        toast.success(`Imported ${parsed.length} rows from clipboard.`);
      } else {
        // Optional: toast.error("Invalid JSON..."); 
        // Decided to show error only if it fails but we tried to parse it? 
        // User requested functionality same as button. Button shows error.
        toast.error("Invalid JSON in clipboard. Expected an array of objects.");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("paste", handleGlobalPaste);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("paste", handleGlobalPaste);
    };
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [data]);

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
          setData(parsed);
          setColumns(inferColumns(parsed));
          setSortConfig(null);
          toast.success(`Imported ${parsed.length} rows.`);
        } else {
          toast.error("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    }
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

          <div className="flex items-center gap-2">
            <SecondaryButton size="sm" onClick={handleExport} className="h-8 text-xs px-3">
              <Download className="w-3.5 h-3.5" /> Download JSON
            </SecondaryButton>
            <SecondaryButton size="sm" onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(data, null, 2));
              toast.success("Copied to clipboard");
            }} className="h-8 text-xs px-3">
              <Copy className="w-3.5 h-3.5" /> Copy JSON
            </SecondaryButton>
            <div className="h-4 w-[1px] bg-border mx-1" />
            <SecondaryButton variant="destructive" size="sm" onClick={handleClear} className="h-8 text-xs px-3">
              <Trash2 className="w-3.5 h-3.5" /> Clear workspace
            </SecondaryButton>
          </div>
        </header>
      )}

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
            <Card
              className="max-w-2xl w-full jte-card rounded-[3.5rem] transition-colors relative border-0"
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
                  <PrimaryButton onClick={handlePaste} className="flex-1 h-14 text-base [&_svg]:size-6">
                    <ClipboardPaste className="w-6 h-6" /> Paste JSON
                  </PrimaryButton>
                  <SecondaryButton onClick={() => fileInputRef.current?.click()} className="flex-1 h-14 text-base [&_svg]:size-6">
                    <Import className="w-6 h-6" /> Import JSON File
                  </SecondaryButton>
                </div>
              </CardContent>
            </Card>

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
                <HammerIcon className="w-5 h-5" style={{ stroke: 'url(#icon-gradient)' }} />
                <span>Simply overengineered</span>
              </div>
            </div>


          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {/* Table Area - Fixed Height for Internal Scrolling */}
            <div className="flex-1 overflow-hidden px-6 py-2 h-full">
              <DataTable
                data={data}
                columns={columns}
                onUpdateCell={updateCell}
                onDeleteRow={deleteRow}
                sortConfig={sortConfig}
                onSort={handleSort}
                onAdd={addRow}
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
    </div>
  );
}

export default App;
