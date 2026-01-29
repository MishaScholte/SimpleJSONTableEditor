import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
    onSave?: () => void;
    onOpen?: () => void;
    onClear?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onCopy?: () => void;
}

export function useKeyboardShortcuts({
    onSave,
    onOpen,
    onClear,
    onUndo,
    onRedo,
    onCopy,
}: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd (Mac) or Ctrl (Windows/Linux)
            const isModifier = e.metaKey || e.ctrlKey;
            const isShift = e.shiftKey;

            if (isModifier) {
                switch (e.key.toLowerCase()) {
                    case "s":
                        if (onSave) {
                            e.preventDefault();
                            onSave();
                        }
                        break;
                    case "o":
                        if (onOpen) {
                            e.preventDefault();
                            onOpen();
                        }
                        break;
                    case "backspace":
                        if (onClear) {
                            e.preventDefault();
                            onClear();
                        }
                        break;
                    case "z":
                        e.preventDefault();
                        if (isShift) {
                            if (onRedo) onRedo();
                        } else {
                            if (onUndo) onUndo();
                        }
                        break;
                    case "y":
                        e.preventDefault();
                        if (onRedo) onRedo(); // Windows habit
                        break;
                    case "c":
                        // Smart Copy:
                        // Only override if the user is NOT editing text and has NO text selected.
                        const activeEl = document.activeElement;
                        const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement || (activeEl as HTMLElement)?.isContentEditable;
                        const hasSelection = window.getSelection()?.toString().length ?? 0 > 0;

                        if (!isInput && !hasSelection) {
                            if (onCopy) {
                                e.preventDefault();
                                onCopy();
                            }
                        }
                        break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onSave, onOpen, onClear, onUndo, onRedo, onCopy]);
}
