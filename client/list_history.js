import fs from 'fs';
import path from 'path';

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
const targetWorkspace = 'school-management-system';

if (!fs.existsSync(historyDir)) {
    console.error("History folder not found!");
    process.exit(1);
}

const subdirs = fs.readdirSync(historyDir);
console.log(`Scanning history folders under: ${historyDir}\n`);

for (const subdir of subdirs) {
    const fullSubdir = path.join(historyDir, subdir);
    if (!fs.statSync(fullSubdir).isDirectory()) continue;

    const entriesJsonPath = path.join(fullSubdir, 'entries.json');
    if (!fs.existsSync(entriesJsonPath)) continue;

    try {
        const metadata = JSON.parse(fs.readFileSync(entriesJsonPath, 'utf8'));
        const originalUri = metadata.resource;
        if (originalUri && originalUri.includes(targetWorkspace)) {
            console.log(`Found History for: ${originalUri}`);
            const entries = metadata.entries || [];
            console.log(`  Entries count: ${entries.length}`);
            for (const entry of entries) {
                console.log(`    - ID: ${entry.id}, Timestamp: ${entry.timestamp} (${new Date(entry.timestamp).toLocaleString()})`);
            }
        }
    } catch (err) {
        // ignore
    }
}
