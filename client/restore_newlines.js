import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.dirname(__dirname); // e:\Hoc\PTIT\Ky6\lap-trinh-web\school-management-system
const srcDir = path.join(workspaceRoot, 'client', 'src');

const tokensToNewline = [
    { search: / const /g, replace: '\nconst ' },
    { search: / let /g, replace: '\nlet ' },
    { search: / var /g, replace: '\nvar ' },
    { search: / function /g, replace: '\nfunction ' },
    { search: / return /g, replace: '\nreturn ' },
    { search: / if \(/g, replace: '\nif (' },
    { search: / else /g, replace: '\nelse ' },
    { search: / try {/g, replace: '\ntry {' },
    { search: / catch \(/g, replace: '\ncatch (' },
    { search: / finally {/g, replace: '\nfinally {' },
    { search: / for \(/g, replace: '\nfor (' },
    { search: / while \(/g, replace: '\nwhile (' },
    { search: / import /g, replace: '\nimport ' },
    { search: / export /g, replace: '\nexport ' },
    { search: / await /g, replace: '\nawait ' },
    { search: / async /g, replace: '\nasync ' },
    { search: / useEffect\(/g, replace: '\nuseEffect(' },
    { search: / useState\(/g, replace: '\nuseState(' },
    { search: / return \(/g, replace: '\nreturn (' },
    { search: /<\/?div/g, replace: match => '\n' + match },
    { search: /<\/?span/g, replace: match => '\n' + match },
    { search: /<\/?button/g, replace: match => '\n' + match },
    { search: /<\/?table/g, replace: match => '\n' + match },
    { search: /<\/?thead/g, replace: match => '\n' + match },
    { search: /<\/?tbody/g, replace: match => '\n' + match },
    { search: /<\/?tr/g, replace: match => '\n' + match },
    { search: /<\/?th/g, replace: match => '\n' + match },
    { search: /<\/?td/g, replace: match => '\n' + match },
    { search: /<\/?h1/g, replace: match => '\n' + match },
    { search: /<\/?h2/g, replace: match => '\n' + match },
    { search: /<\/?h3/g, replace: match => '\n' + match },
    { search: /<\/?p/g, replace: match => '\n' + match },
    { search: /<\/?input/g, replace: match => '\n' + match },
    { search: /<\/?form/g, replace: match => '\n' + match },
    { search: /<\/?select/g, replace: match => '\n' + match },
    { search: /<\/?option/g, replace: match => '\n' + match },
    { search: /<\/?label/g, replace: match => '\n' + match },
    { search: /};/g, replace: '};\n' },
    { search: /];/g, replace: '];\n' },
    { search: /\);/g, replace: ');\n' },
    { search: /(?<!https?:)\/\//g, replace: '\n//' } // Add newline before single-line comments
];

const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    if (lines.length > 1) return; // Not minified

    console.log(`Restoring newlines in minified file: ${filePath}`);

    for (const rule of tokensToNewline) {
        content = content.replace(rule.search, rule.replace);
    }

    fs.writeFileSync(filePath, content, 'utf8');
};

const scanDir = (dir) => {
    if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist')) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
};

scanDir(path.join(srcDir, 'pages'));
scanDir(path.join(srcDir, 'components'));
console.log("Newline restoration complete!");
