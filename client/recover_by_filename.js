import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.dirname(__dirname); // e:\Hoc\PTIT\Ky6\lap-trinh-web\school-management-system
const srcDir = path.join(workspaceRoot, 'client', 'src');
const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');

// Timestamp cutoff (before the emergency clean script ran)
const cutOffTimestamp = 1783869650000; 

const brokenFiles = [
    'InstructorAttendanceTab.jsx',
    'InstructorGradesTab.jsx',
    'StudentAssignmentsTab.jsx',
    'AdminSupportRequests.jsx',
    'CreateClassForm.jsx',
    'CourseContentManagement.jsx',
    'InstructorDashboard.jsx',
    'InstructorGradeEntry.jsx',
    'InstructorSchedule.jsx',
    'InstructorStudentList.jsx',
    'InstructorSupportRequests.jsx',
    'ClassAttendance.jsx',
    'CourseRegistration.jsx',
    'StudentDashboard.jsx',
    'StudentSchedule.jsx'
];

// Helper to find current path of a file in client/src
const findCurrentPath = (dir, filename) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const found = findCurrentPath(fullPath, filename);
            if (found) return found;
        } else if (file === filename) {
            return fullPath;
        }
    }
    return null;
};

if (!fs.existsSync(historyDir)) {
    console.error("History folder not found!");
    process.exit(1);
}

const subdirs = fs.readdirSync(historyDir);
let restoredCount = 0;

for (const filename of brokenFiles) {
    const currentDestPath = findCurrentPath(srcDir, filename);
    if (!currentDestPath) {
        console.warn(`Warning: Could not find destination path for ${filename} in client/src`);
        continue;
    }

    console.log(`Searching history for ${filename}...`);
    let bestHistoryFile = null;
    let bestTimestamp = 0;

    for (const subdir of subdirs) {
        const fullSubdir = path.join(historyDir, subdir);
        if (!fs.statSync(fullSubdir).isDirectory()) continue;

        const entriesJsonPath = path.join(fullSubdir, 'entries.json');
        if (!fs.existsSync(entriesJsonPath)) continue;

        try {
            const metadata = JSON.parse(fs.readFileSync(entriesJsonPath, 'utf8'));
            const originalUri = metadata.resource;
            if (!originalUri) continue;

            const decodedPath = decodeURIComponent(originalUri.replace(/^file:\/\/\//, ''));
            const fileBasename = path.basename(decodedPath);

            if (fileBasename === filename) {
                const entries = metadata.entries || [];
                for (const entry of entries) {
                    if (entry.timestamp < cutOffTimestamp && entry.timestamp > bestTimestamp) {
                        const candidatePath = path.join(fullSubdir, entry.id);
                        if (fs.existsSync(candidatePath)) {
                            bestTimestamp = entry.timestamp;
                            bestHistoryFile = candidatePath;
                        }
                    }
                }
            }
        } catch (err) {
            // ignore
        }
    }

    if (bestHistoryFile) {
        fs.copyFileSync(bestHistoryFile, currentDestPath);
        console.log(`Successfully restored ${filename} to ${currentDestPath} (version from ${new Date(bestTimestamp).toLocaleString()})`);
        restoredCount++;
    } else {
        console.log(`No historical version found before cutoff for ${filename}`);
    }
}

console.log(`\nRecovery finished! Restored ${restoredCount} of ${brokenFiles.length} files.`);
