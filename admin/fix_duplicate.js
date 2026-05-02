const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'admin/app/(dashboard)/master-data/page.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix: Remove the second declaration of isVideo in the file (which is the duplicate in ShopSettingsSection)
// We look for the pattern where isVideo is declared twice in a row with some code in between.
// Actually, we'll just replace the specific block if found.

const target = `        if (!isImage && !isVideo) {
            alert('Please upload an image or video file.');
            return;
        }

        const isVideo = file.type.startsWith('video/');
        try {`;

const fixed = `        if (!isImage && !isVideo) {
            alert('Please upload an image or video file.');
            return;
        }

        try {`;

if (content.includes(target)) {
    content = content.replace(target, fixed);
    fs.writeFileSync(filePath, content);
    console.log('Duplicate definition fixed.');
} else {
    // Fallback: search-and-replace the specific line if it appears after the check
    console.log('Target block not found exactly. Trying line-by-line...');
    const lines = content.split(/\r?\n/);
    let foundFirst = false;
    let newLines = [];
    for (let line of lines) {
        if (line.includes('const isVideo = file.type.startsWith(\'video/\');')) {
            if (!foundFirst) {
                foundFirst = true; // Keep first one
                newLines.push(line);
            } else {
                // Check if we are in the same scope or if it's a legitimate second one
                // In this file, there are 3 onFileChange functions.
                // EditableRow (line 37), AddRowForm (line 182), ShopSettingsSection (line 406 AND 413).
                // So we want to keep 3 but remove the 4th.
                // Wait, let's count them properly.
            }
        } else {
            newLines.push(line);
        }
    }
    // Actually, let's just use the exact string replacement on the whole file for the specific problematic block
    // I will read the file again to be 100% sure of the surrounding lines.
}
