import fs from 'fs';
import path from 'path';

const searchRoots = [
  'C:\\Users\\Samsung\\.gemini',
  'C:\\Users\\Samsung\\Downloads',
  'C:\\Users\\Samsung\\Documents',
  'C:\\Users\\Samsung\\Desktop',
];

const keywords = ['Paganini', 'Queensberry', 'Lecoq', 'Copacol', 'Brasilê', 'Brasile'];

function checkFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 20 * 1024 * 1024) return; // skip files > 20MB
    const buf = fs.readFileSync(filePath);
    const strUtf8 = buf.toString('utf8');
    const strUtf16 = buf.toString('utf16le');

    for (const kw of keywords) {
      if (strUtf8.includes(kw) || strUtf16.includes(kw)) {
        console.log(`FOUND "${kw}" in: ${filePath} (${stat.size} bytes, modified: ${stat.mtime.toISOString()})`);
        break;
      }
    }
  } catch (_) {}
}

function walk(dir, depth = 0) {
  if (depth > 6) return;
  try {
    const entries = fs.readdirSync(dir);
    for (const e of entries) {
      if (e === 'node_modules' || e === '.git' || e === 'dist' || e === '.cache') continue;
      const full = path.join(dir, e);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full, depth + 1);
        } else {
          checkFile(full);
        }
      } catch (_) {}
    }
  } catch (_) {}
}

console.log('Searching roots...');
for (const r of searchRoots) {
  walk(r);
}
console.log('Done searching.');
