
import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
    id: string;
}

const SortableItem = ({ id }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted/60 rounded-md border border-white/5 mb-2 select-none">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-white/80 text-muted-foreground outline-none">
                <GripVertical className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">{id}</span>
        </div>
    );
};

interface ReorderColumnsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columns: string[];
    onReorder: (newOrder: string[]) => void;
}

export function ReorderColumnsDialog({ open, onOpenChange, columns, onReorder }: ReorderColumnsDialogProps) {
    const [items, setItems] = useState(columns);

    // Sync items when dialog opens
    React.useEffect(() => {
        if (open) {
            setItems(columns);
        }
    }, [open, columns]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    const handleSave = () => {
        onReorder(items);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Reorder Columns</DialogTitle>
                    <DialogDescription>
                        Drag and drop items to reorder the columns.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 max-h-[60vh] overflow-y-auto pr-1">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items}
                            strategy={verticalListSortingStrategy}
                        >
                            {items.map(id => <SortableItem key={id} id={id} />)}
                        </SortableContext>
                    </DndContext>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Order</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
