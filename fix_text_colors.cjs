const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Find classes that have bg-{color}-something and text-black, replace to text-white
            const colors = ['orange', 'blue', 'green', 'red', 'cyan', 'emerald', 'yellow', 'purple', 'black'];
            
            for (const color of colors) {
                // simple replace for bg-color-600 ... text-black
                content = content.replace(new RegExp(`(bg-${color}-[5-9]00[^'"]*?)text-black`, 'g'), '$1text-white');
            }

            fs.writeFileSync(fullPath, content);
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log("Fixed button text colors");
