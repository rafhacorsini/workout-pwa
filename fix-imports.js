const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix static imports: from './xxx' or from "../xxx"
    content = content.replace(
        /from\s+['"](\.\/?[^'"]+)['"]/g,
        (match, importPath) => {
            if (importPath.startsWith('./') || importPath.startsWith('../')) {
                modified = true;
                // Resolve absolute path logic
                // This is a simplified regex approach, might need manual check for complex ../../
                // But for this project structure it should work if we standardize to /src/js/

                // Better approach: just replace known patterns
                // ../core/ -> /src/js/core/
                // ../views/ -> /src/js/views/
                // ../components/ -> /src/js/components/
                // ./ -> (depends on file location)

                // Let's use a safer replacement strategy based on the user's prompt logic
                // The user suggested: remove ./ or ../ and add /src/js/
                // This assumes flat structure or simple depth. 
                // Let's try to be smart:

                let cleanPath = importPath;
                if (cleanPath.startsWith('../')) cleanPath = cleanPath.substring(3);
                else if (cleanPath.startsWith('./')) cleanPath = cleanPath.substring(2);

                // If path starts with 'js/', remove it to avoid double js/js
                if (cleanPath.startsWith('js/')) cleanPath = cleanPath.substring(3);

                // If we are in a view importing core, it might be ../core/db.js -> core/db.js
                // So /src/js/core/db.js is correct.

                return `from '/src/js/${cleanPath}'`;
            }
            return match;
        }
    );

    // Fix dynamic imports: import('./xxx') or import("../xxx")
    content = content.replace(
        /import\s*\(\s*['"](\.\/?[^'"]+)['"]\s*\)/g,
        (match, importPath) => {
            if (importPath.startsWith('./') || importPath.startsWith('../')) {
                modified = true;
                let cleanPath = importPath;
                if (cleanPath.startsWith('../')) cleanPath = cleanPath.substring(3);
                else if (cleanPath.startsWith('./')) cleanPath = cleanPath.substring(2);

                if (cleanPath.startsWith('js/')) cleanPath = cleanPath.substring(3);

                return `import('/src/js/${cleanPath}')`;
            }
            return match;
        }
    );

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
    }
}

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            processDirectory(fullPath);
        } else if (file.endsWith('.js')) {
            fixImportsInFile(fullPath);
        }
    });
}

console.log('🔧 Fixing imports in all JS files...\n');
processDirectory('./src/js');
console.log('\n✨ Done!');
