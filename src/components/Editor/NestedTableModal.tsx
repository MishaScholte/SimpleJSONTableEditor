import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "./DataTable";
import { inferColumns } from "@/lib/data-utils";

interface NestedTableModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    data: Record<string, any> | Array<Record<string, any>>;
}

export const NestedTableModal: React.FC<NestedTableModalProps> = ({
    open,
    onOpenChange,
    title,
    data,
}) => {
    const [nestedModal, setNestedModal] = useState<{
        open: boolean;
        title: string;
        data: any;
    } | null>(null);

    const isArray = Array.isArray(data);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none flex flex-col rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
                    style={{ width: "calc(100vw - 32px)", height: "calc(100vh - 32px)", maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 32px)" }}
                >
                    <DialogHeader className="flex flex-row items-center justify-between shrink-0">
                        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        {isArray ? (
                            // Use DataTable for arrays
                            <DataTable
                                data={data as Array<Record<string, any>>}
                                columns={inferColumns(data as Array<Record<string, any>>)}
                                readOnly
                            />
                        ) : (
                            // Convert single object to array format for consistent styling
                            <DataTable
                                data={Object.entries(data).map(([key, value]) => ({ key, value }))}
                                columns={["key", "value"]}
                                readOnly
                            />
                        )}
                    </div>
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
                />
            )}
        </>
    );
};
