const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /blue-400/g, to: 'clinica-secondary' },
    { from: /blue-500/g, to: 'clinica-secondary' },
    { from: /blue-600/g, to: 'clinica-primary' },
    { from: /blue-700/g, to: 'clinica-primary' },
    { from: /blue-800/g, to: 'clinica-primary' },
    { from: /blue-50/g, to: 'clinica-primary/10' },
    { from: /blue-100/g, to: 'clinica-primary/20' },
    { from: /cyan-400/g, to: 'clinica-secondary' },
    { from: /cyan-500/g, to: 'clinica-secondary' },
    { from: /cyan-600/g, to: 'clinica-primary' },
    { from: /green-500/g, to: 'clinica-secondary' },
    { from: /green-600/g, to: 'clinica-primary' }
];

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
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
