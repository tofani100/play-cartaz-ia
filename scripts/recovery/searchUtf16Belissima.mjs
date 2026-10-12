import fs from 'fs';
import path from 'path';

const chromeDir = 'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4';

function searchUtf16(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    // Search both Belíssima and Belissima (without accent)
    const needles = [
      Buffer.from('Belíssima', 'utf16le'),
      Buffer.from('Belissima', 'utf16le'),
      Buffer.from('playcomunique', 'utf16le'),
      Buffer.from('playcomunique_campanha', 'utf16le'),
    ];

    for (const needle of needles) {
      let idx = 0;
      let foundCount = 0;
      while ((idx = buf.indexOf(needle, idx)) !== -1) {
        foundCount++;
        const start = Math.max(0, idx - 1000);
        const end = Math.min(buf.length, idx + 4000);
        const sliceBuf = buf.subarray(start, end);
        const text = sliceBuf.toString('utf16le');
        const clean = text.replace(/[\x00-\x1F\x7F]/g, ' ');
        console.log(`\n=== Match [${needle.toString('utf16le')}] in ${path.basename(filePath)} at ${idx} ===`);
        console.log(clean.slice(0, 600));

        const pIdx = clean.indexOf('"products"');
        if (pIdx !== -1) {
          console.log('\n--- FOUND "products" ---');
          console.log(clean.substring(pIdx, pIdx + 1200));
        }

        idx += needle.length;
        if (foundCount > 3) break;
      }
    }
  } catch (e) {}
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const full = path.join(dir, e);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (e.endsWith('.ldb') || e.endsWith('.log')) {
        searchUtf16(full);
      }
    } catch (_) {}
  }
}

walk(chromeDir);
