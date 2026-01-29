import { useReducer, useCallback, useRef } from 'react';

// Actions
type Action<T> =
    | { type: 'SET'; payload: T | ((prev: T) => T); limit: number }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'RESET'; payload: T };

// State
interface State<T> {
    past: T[];
    present: T;
    future: T[];
}

function undoRedoReducer<T>(state: State<T>, action: Action<T>): State<T> {
    switch (action.type) {
        case 'SET': {
            const { payload, limit } = action;
            const nextPresent = typeof payload === 'function'
                ? (payload as Function)(state.present)
                : payload;

            // Deep equality check to prevent duplicates
            if (nextPresent === state.present) return state;
            if (JSON.stringify(nextPresent) === JSON.stringify(state.present)) return state;

            const newPast = [...state.past, state.present];
            if (newPast.length > limit) {
                newPast.shift(); // Remove oldest
            }

            return {
                past: newPast,
                present: nextPresent,
                future: [] // Clear future on new change
            };
        }
        case 'UNDO': {
            if (state.past.length === 0) return state;
            const previous = state.past[state.past.length - 1];
            const newPast = state.past.slice(0, state.past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [state.present, ...state.future]
            };
        }
        case 'REDO': {
            if (state.future.length === 0) return state;
            const next = state.future[0];
            const newFuture = state.future.slice(1);
            return {
                past: [...state.past, state.present],
                present: next,
                future: newFuture
            };
        }
        case 'RESET': {
            return {
                past: [],
                present: action.payload,
                future: []
            };
        }
        default:
            return state;
    }
}

/**
 * A hook for managing state with Undo/Redo capabilities.
 * Uses useReducer to ensure strict-mode compatibility and predictable state updates.
 */
export function useUndoRedo<T>(initialState: T, limit: number = 100) {
    const limitRef = useRef(limit);
    limitRef.current = limit;

    const [state, dispatch] = useReducer(undoRedoReducer<T>, {
        past: [],
        present: initialState,
        future: []
    });

    const set = useCallback((newState: T | ((prev: T) => T)) => {
        dispatch({ type: 'SET', payload: newState, limit: limitRef.current });
    }, []);

    const reset = useCallback((newState: T) => {
        dispatch({ type: 'RESET', payload: newState });
    }, []);

    const undo = useCallback(() => {
        dispatch({ type: 'UNDO' });
    }, []);

    const redo = useCallback(() => {
        dispatch({ type: 'REDO' });
    }, []);

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    // Expose history for inspection (e.g. "will undo clear the workspace?")
    const history = state;

    return [state.present, set, undo, redo, reset, canUndo, canRedo, history] as const;
}
