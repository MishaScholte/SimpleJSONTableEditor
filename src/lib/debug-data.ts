export const DEBUG_DATASETS = [
    {
        label: "Simple Users",
        data: [
            { id: 1, name: "Alice", role: "Admin", active: true },
            { id: 2, name: "Bob", role: "User", active: false },
            { id: 3, name: "Charlie", role: "User", active: true },
        ]
    },
    {
        label: "Nested Config",
        data: [
            { id: "server-1", config: { ip: "192.168.1.1", port: 8080 }, status: "online" },
            { id: "server-2", config: { ip: "10.0.0.5", port: 3000, ssl: true }, status: "offline" },
            { id: "server-3", config: { ip: "127.0.0.1" }, status: "maintenance" },
        ]
    },
    {
        label: "Arrays & Lists",
        data: [
            { id: 1, tags: ["urgent", "bug"], scores: [10, 20, 30] },
            { id: 2, tags: ["feature"], scores: [5, 15] },
            { id: 3, tags: [], scores: [] },
        ]
    },
    {
        label: "Complex Structure",
        data: [
            {
                id: 101,
                meta: { created: "2023-01-01", author: { name: "Dave", id: 99 } },
                items: [{ id: "a", qty: 10 }, { id: "b", qty: 5 }]
            },
            {
                id: 102,
                meta: { created: "2023-01-02" },
                items: []
            }
        ]
    },
    {
        label: "Verified Types",
        data: [
            {
                "id": 1,
                "name": "Test Item 1",
                "isActive": true,
                "score": 95,
                "tags": ["test", "demo"],
                "metadata": { "created": "2024-01-01", "version": 1 }
            },
            {
                "id": 2,
                "name": "Test Item 2",
                "isActive": false,
                "score": 82.5,
                "tags": ["example"],
                "metadata": { "created": "2024-01-02", "version": 1.1 }
            },
            {
                "id": 3,
                "name": "Test Item 3",
                "isActive": true,
                "score": 100,
                "tags": [],
                "metadata": { "created": "2024-01-03" }
            }
        ]
    }
];
