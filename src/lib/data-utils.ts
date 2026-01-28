export type CellValue = string | number | boolean | string[] | null;
export type TableRow = Record<string, CellValue>;

export const inferColumns = (data: TableRow[]): string[] => {
    if (data.length === 0) return [];
    const keys = new Set<string>();
    data.forEach(row => {
        Object.keys(row).forEach(k => keys.add(k));
    });
    return Array.from(keys).sort(); // Sort alphabetically for consistency
};

export const parseArrayInput = (input: string): string[] => {
    return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
};

export const formatArrayOutput = (arr: string[]): string => {
    return arr.join(', ');
};

export const getCellType = (val: unknown): 'string' | 'number' | 'boolean' | 'array' | 'object' => {
    if (Array.isArray(val)) return 'array';
    if (val === null) return 'string'; // Treat null as string input
    return typeof val as any;
};

export const safeParseJSON = (str: string): TableRow[] | null => {
    try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed;
        return null;
    } catch {
        return null;
    }
};
