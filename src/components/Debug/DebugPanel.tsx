import React from 'react';
import { DEBUG_DATASETS } from '@/lib/debug-data';
import { Button } from '@/components/ui/button';

interface DebugPanelProps {
    onLoad: (data: any[]) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ onLoad }) => {
    return (
        <div className="flex flex-col items-center gap-2 mt-8 opacity-50 hover:opacity-100 transition-opacity">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Debug / Test Data</div>
            <div className="flex gap-2 justify-center flex-wrap">
                {DEBUG_DATASETS.map((ds) => (
                    <Button
                        key={ds.label}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs border border-dashed border-muted-foreground/30 hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                        onClick={() => onLoad(ds.data)}
                    >
                        {ds.label}
                    </Button>
                ))}
            </div>
        </div>
    );
};
