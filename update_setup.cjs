const fs = require('fs');

const filePath = 'tests/setup.js';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `global.supabase = {
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
        })),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis()
        }))
    }))
};`;

content = content.replace(/global\.supabase = \{[\s\S]*?\}\)\n\};\n/, replacement + '\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log("updated");
