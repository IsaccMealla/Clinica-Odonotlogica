const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /bg-blue-600/g, to: 'bg-clinica-primary' },
    { from: /hover:bg-blue-700/g, to: 'hover:bg-clinica-primary/90' },
    { from: /text-blue-600/g, to: 'text-clinica-primary' },
    { from: /text-blue-500/g, to: 'text-clinica-primary' },
    { from: /text-blue-700/g, to: 'text-clinica-primary' },
    { from: /bg-blue-50/g, to: 'bg-clinica-primary/10' },
    { from: /border-blue-200/g, to: 'border-clinica-primary/20' },
    { from: /bg-green-600/g, to: 'bg-clinica-secondary' },
    { from: /hover:bg-green-700/g, to: 'hover:bg-clinica-secondary/90' },
    { from: /text-green-600/g, to: 'text-clinica-secondary' },
    { from: /bg-green-50/g, to: 'bg-clinica-secondary/10' },
    { from: /bg-cyan-500/g, to: 'bg-clinica-secondary' },
    { from: /text-cyan-500/g, to: 'text-clinica-secondary' }
];

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath);
        } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
            let content = fs.readFileSync(dirPath, 'utf8');
            let modified = false;
            for (const r of replacements) {
                if (content.match(r.from)) {
                    content = content.replace(r.from, r.to);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(dirPath, content);
                console.log('Modified:', dirPath);
            }
        }
    });
}

walkDir(path.join(__dirname, 'components'));
walkDir(path.join(__dirname, 'app'));
