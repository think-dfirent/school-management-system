import fs from 'fs';
import path from 'path';

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
const targetWorkspace = 'school-management-system/client/src';

// Emergency script ran around 1783869660000 (July 12, 2026 22:21 Local / 15:21 UTC)
const cutOffTimestamp = 1783869650000; 

if (!fs.existsSync(historyDir)) {
    console.error("VS Code History directory not found!");
    process.exit(1);
}

const subdirs = fs.readdirSync(historyDir);
let restoredCount = 0;

for (const subdir of subdirs) {
    const fullSubdir = path.join(historyDir, subdir);
    if (!fs.statSync(fullSubdir).isDirectory()) continue;

    const entriesJsonPath = path.join(fullSubdir, 'entries.json');
    if (!fs.existsSync(entriesJsonPath)) continue;

    try {
        const metadata = JSON.parse(fs.readFileSync(entriesJsonPath, 'utf8'));
        const originalUri = metadata.resource;
        if (!originalUri) continue;

        // Decode URL encoding
        const decodedPath = decodeURIComponent(originalUri.replace(/^file:\/\/\//, ''));
        
        // Check if file is part of our client src workspace
        if (decodedPath.includes(targetWorkspace)) {
            // Normalize path for Windows/Unix compatibility
            const normalizedDestPath = path.normalize(decodedPath);

            // Sort entries descending to get the latest ones first
            const entries = metadata.entries || [];
            entries.sort((a, b) => b.timestamp - a.timestamp);

            // Find the latest entry before the emergency clean script ran
            const recoveryEntry = entries.find(e => e.timestamp < cutOffTimestamp);

            if (recoveryEntry) {
                const sourceFilePath = path.join(fullSubdir, recoveryEntry.id);
                if (fs.existsSync(sourceFilePath)) {
                    // Copy file back to the original place
                    fs.mkdirSync(path.dirname(normalizedDestPath), { recursive: true });
                    fs.copyFileSync(sourceFilePath, normalizedDestPath);
                    console.log(`Restored: ${normalizedDestPath} (version from ${new Date(recoveryEntry.timestamp).toLocaleString()})`);
                    restoredCount++;
                }
            } else {
                // If there's only one entry, or no entries before the cutoff, let's see if we have any entries
                // that look unminified (e.g. size is large and has newlines)
                const candidate = entries[entries.length - 1]; // oldest version
                if (candidate) {
                    const candidatePath = path.join(fullSubdir, candidate.id);
                    if (fs.existsSync(candidatePath)) {
                        const content = fs.readFileSync(candidatePath, 'utf8');
                        if (content.includes('\n') && !content.includes('bg-backgroundmerald-600')) {
                            fs.mkdirSync(path.dirname(normalizedDestPath), { recursive: true });
                            fs.copyFileSync(candidatePath, normalizedDestPath);
                            console.log(`Restored (fallback): ${normalizedDestPath}`);
                            restoredCount++;
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error(`Error reading ${entriesJsonPath}:`, err.message);
    }
}

console.log(`\nRecovery finished! Restored ${restoredCount} files.`);
