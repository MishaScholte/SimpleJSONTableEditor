import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Command, Hash, ToggleLeft, Braces, List } from "lucide-react";

interface SlashMenuProps {
    query: string;
    onSelect: (command: string) => void;
    onClose: () => void;
    anchorEl: HTMLElement | null; // Element to position against
}

const COMMANDS = [
    { id: "text", label: "Text", icon: Command, description: "Plain text input" },
    { id: "number", label: "Number", icon: Hash, description: "Numeric value" },
    { id: "bool", label: "Boolean", icon: ToggleLeft, description: "True / False" },
    { id: "obj", label: "Object", icon: Braces, description: "Nested object" },
    { id: "list", label: "List", icon: List, description: "Array of items" },
];

export const SlashMenu: React.FC<SlashMenuProps> = ({ query, onSelect, onClose, anchorEl }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredCommands = COMMANDS.filter(cmd =>
        cmd.id.toLowerCase().startsWith(query.toLowerCase()) ||
        cmd.label.toLowerCase().startsWith(query.toLowerCase())
    );

    // Calculate position
    useLayoutEffect(() => {
        if (anchorEl && menuRef.current) {
            const rect = anchorEl.getBoundingClientRect(); // Viewport relative
            const menuHeight = menuRef.current.offsetHeight;

            // Fixed positioning relative to viewport
            // Place ABOVE the input
            setPosition({
                top: rect.top - menuHeight - 8,
                left: rect.left
            });
        }
    }, [anchorEl, filteredCommands.length]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex].id);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [filteredCommands, selectedIndex, onSelect, onClose]);

    // Close on click outside (but ignore anchor click which is handled by cleanup)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node) && anchorEl && !anchorEl.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose, anchorEl]);

    if (!anchorEl || filteredCommands.length === 0) return null;

    return createPortal(
        <div
            ref={menuRef}
            style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                position: 'fixed', // Use FIXED to stay with viewport
                zIndex: 99999,
                opacity: position ? 1 : 0 // Hide until positioned
            }}
            className="w-48 bg-popover text-popover-foreground rounded-md border shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-100"
        >
            <div className="p-1">
                {filteredCommands.map((cmd, idx) => (
                    <button
                        key={cmd.id}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors text-left ${idx === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                            }`}
                        onMouseDown={(e) => e.preventDefault()} // Prevent taking focus from input
                        onClick={() => onSelect(cmd.id)}
                    >
                        <cmd.icon className="w-4 h-4 shrink-0 opacity-70" />
                        <div className="flex flex-col gap-0.5">
                            <span className="leading-none font-medium">{cmd.label}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
};
