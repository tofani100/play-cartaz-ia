import fs from 'fs';
import path from 'path';

const folders = [
  'C:\\Users\\Samsung\\Downloads',
  'C:\\Users\\Samsung\\Pictures',
  'C:\\Users\\Samsung\\Desktop',
  'C:\\Users\\Samsung\\Documents',
];

const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
const results = [];

function walk(dir) {
  try {
    const entries = fs.readdirSync(dir);
    for (const e of entries) {
      if (e === 'node_modules' || e === '.git' || e === 'dist' || e === '.cache') continue;
      const full = path.join(dir, e);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else {
          const ext = path.extname(e).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            if (stat.mtimeMs > sevenDaysAgo) {
              results.push({
                file: full,
                size: stat.size,
                mtime: stat.mtime.toISOString(),
              });
            }
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
}

for (const f of folders) {
  walk(f);
}

results.sort((a, b) => b.mtime.localeCompare(a.mtime));
console.log(`Found ${results.length} recent images:`);
results.slice(0, 40).forEach(r => {
  console.log(`- ${r.file} (${r.size} bytes, ${r.mtime})`);
});
