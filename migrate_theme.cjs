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

            // Backgrounds
            content = content.replace(/bg-slate-900\/(?:\d+)/g, 'bg-white');
            content = content.replace(/bg-slate-800\/(?:\d+)/g, 'bg-white');
            content = content.replace(/bg-slate-[0-9]{3}/g, 'bg-white');
            content = content.replace(/bg-\[\#0f172a\]/g, 'bg-white');
            content = content.replace(/bg-\[radial-gradient[^\]]+\]/g, 'bg-white');
            content = content.replace(/bg-black\/80/g, 'bg-black/50');
            content = content.replace(/bg-black\/50/g, 'bg-white border-r');

            // Add simple styling to replace glass-morphism effects which were heavily used
            // Glass morphism class itself is updated in index.css

            // Text colors
            // In a white bg, text should be black.
            content = content.replace(/text-slate-200/g, 'text-black');
            content = content.replace(/text-slate-300/g, 'text-gray-900');
            content = content.replace(/text-gray-400/g, 'text-gray-600');
            content = content.replace(/text-gray-300/g, 'text-gray-700');
            content = content.replace(/text-white/g, 'text-black'); // We will fix button text-white later if needed

            // We want text inside orange buttons, badges, etc to stay white
            content = content.replace(/bg-orange-([0-9]{3}) text-black/g, 'bg-orange-$1 text-white');
            content = content.replace(/bg-orange-500 flex items-center justify-center text-black/g, 'bg-orange-500 flex items-center justify-center text-white');
            content = content.replace(/bg-orange-600\/20 rounded-2xl flex items-center justify-center text-orange-500/g, 'bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600');
            
            // Borders
            content = content.replace(/border-slate-[0-9]{3}\/(?:\d+)/g, 'border-black');
            content = content.replace(/border-slate-[0-9]{3}/g, 'border-gray-200');
            content = content.replace(/border-white\/(?:\d+)/g, 'border-gray-200');
            content = content.replace(/border-white/g, 'border-black');

            // Hovers
            content = content.replace(/hover:bg-slate-800/g, 'hover:bg-gray-100');
            content = content.replace(/hover:bg-slate-700/g, 'hover:bg-gray-200');

            fs.writeFileSync(fullPath, content);
        }
    }
}

processDir(path.join(__dirname, 'src'));

console.log("Done");
