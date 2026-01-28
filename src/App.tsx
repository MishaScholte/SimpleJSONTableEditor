import { useState, useRef, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { DataTable, type SortConfig } from "@/components/Editor/DataTable";
import { inferColumns, safeParseJSON, type TableRow } from "@/lib/data-utils";
import { Button } from "@/components/ui/button";
import { FileUp, Download, Trash2, FileJson, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function App() {
  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
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
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* Top Header - Only visible when data exists */}
      {data.length > 0 && (
        <header className="h-14 border-b border-border/40 glass sticky top-0 z-50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <FileJson className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">JSON Table Editor</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs bg-transparent border-border/50 hover:bg-muted/50 px-2 lg:px-3">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(data, null, 2));
              toast.success("Copied to clipboard");
            }} className="h-8 text-xs bg-transparent border-border/50 hover:bg-muted/50 px-2 lg:px-3">
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy JSON
            </Button>
            <div className="h-4 w-[1px] bg-border mx-1" />
            <Button variant="outline" size="sm" onClick={handleClear} className="h-8 text-xs bg-transparent border-border/50 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 px-2 lg:px-3">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Erase table
            </Button>
          </div>
        </header>
      )}

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/5 gap-8"> {/* Slight tint for empty state bg */}
            <Card className="max-w-md w-full border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-4">
                  <FileUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">The <span className="line-through decoration-muted-foreground/50 text-muted-foreground">simple</span> overengineered JSON table editor</CardTitle>
                <CardDescription>
                  Import an existing JSON file to start editing your data.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pt-4">
                <Button onClick={() => fileInputRef.current?.click()}>
                  Import JSON File
                </Button>
              </CardContent>
            </Card>

            <div className="text-center space-y-1 text-xs text-muted-foreground/70 max-w-xs mx-auto">
              <p>Your data stays in your browser.</p>
              <p>Nothing is uploaded to a server or saved to your device. Refreshing the page will clear your workspace.</p>
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

      <Toaster position="bottom-right" theme="dark" className="font-sans" offset={80} style={{ right: 16 }} />
    </div>
  );
}

export default App;
