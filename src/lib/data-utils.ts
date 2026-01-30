export type CellValue = string | number | boolean | string[] | null;
export type TableRow = Record<string, CellValue>;

export type ColumnType = 'text' | 'number' | 'boolean' | 'list' | 'object' | 'auto';
export type ColumnSchema = Record<string, ColumnType>;

/**
 * Flattens a nested object using dot notation.
 * { address: { city: "Amsterdam" } } → { "address.city": "Amsterdam" }
 */
export const flattenObject = (obj: Record<string, any>, prefix = ''): TableRow => {
    const result: TableRow = {};

    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively flatten nested objects
            Object.assign(result, flattenObject(value, newKey));
        } else {
            // Primitive, array, or null - keep as is
            result[newKey] = value;
        }
    }

    return result;
};

/**
 * Unflattens a dot-notation object back to nested structure.
 * { "address.city": "Amsterdam" } → { address: { city: "Amsterdam" } }
 */
export const unflattenObject = (obj: TableRow): Record<string, any> => {
    const result: Record<string, any> = {};

    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        const keys = key.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current)) {
                current[k] = {};
            }
            current = current[k];
        }

        current[keys[keys.length - 1]] = obj[key];
    }

    return result;
};

export const inferColumns = (data: TableRow[]): string[] => {
    if (data.length === 0) return [];
    const keys = new Set<string>();
    data.forEach(row => {
        Object.keys(row).forEach(k => keys.add(k));
    });
    return Array.from(keys).sort(); // Sort alphabetically for consistency
};

export const inferSchema = (data: TableRow[]): ColumnSchema => {
    const schema: ColumnSchema = {};
    if (data.length === 0) return schema;

    const keys = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(k => keys.add(k)));

    keys.forEach(key => {
        // Find first non-null value to infer type
        const value = data.find(row => row[key] !== null && row[key] !== undefined)?.[key];

        if (Array.isArray(value)) {
            schema[key] = 'list';
        } else if (value && typeof value === 'object') {
            schema[key] = 'object';
        } else if (typeof value === 'boolean') {
            schema[key] = 'boolean';
        } else if (typeof value === 'number') {
            schema[key] = 'number';
        } else {
            schema[key] = 'text';
        }
    });

    return schema;
};

export const parseArrayInput = (input: string): any[] => {
    // Split by comma and trim. Then infer types.
    return input.split(',').map(s => {
        const trimmed = s.trim();
        if (trimmed === "") return ""; // Will be filtered out
        if (!isNaN(Number(trimmed))) return Number(trimmed);
        if (trimmed.toLowerCase() === 'true') return true;
        if (trimmed.toLowerCase() === 'false') return false;
        return trimmed;
    }).filter(s => s !== "");
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
        if (Array.isArray(parsed)) {
            // Return as-is, nested objects/arrays will be shown as clickable chips
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
};
