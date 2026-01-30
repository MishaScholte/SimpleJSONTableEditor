export function inferObjectKeys(data: any[], column: string): string[] {
    const keys = new Set<string>();

    data.forEach(row => {
        const val = row[column];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            Object.keys(val).forEach(k => keys.add(k));
        }
    });

    // Convert to array and sort.
    // Prioritize 'id', 'name', 'title' if present, then alphabetical.
    const sortedKeys = Array.from(keys).sort((a, b) => {
        const priority = ['id', 'name', 'title', 'label', 'type'];
        const aIdx = priority.indexOf(a.toLowerCase());
        const bIdx = priority.indexOf(b.toLowerCase());

        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;

        return a.localeCompare(b);
    });

    return sortedKeys;
}
