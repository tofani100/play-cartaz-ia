import fs from 'fs';
import path from 'path';

const idbDir = 'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\IndexedDB\\https_cartaz-ia-playcomunique.web.app_0.indexeddb.leveldb';
const lsDir = 'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb';
const outDir = 'C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\da335eb3-d6e0-4861-ada0-f4c1c071d678\\scratch\\extracted_db_images';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function scanFile(filePath) {
  console.log(`\nScanning ${path.basename(filePath)}...`);
  const buf = fs.readFileSync(filePath);
  const str = buf.toString('latin1');

  // Look for data:image/(jpeg|png|webp);base64,...
  const imgRegex = /data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)/g;
  let m;
  let count = 0;
  while ((m = imgRegex.exec(str)) !== null) {
    const format = m[1];
    const b64 = m[2];
    if (b64.length < 5000) continue; // skip tiny icons

    // Try to find product title near this offset
    const start = Math.max(0, m.index - 500);
    const end = Math.min(str.length, m.index + m[0].length + 500);
    const context = str.substring(start, end).replace(/[\x00-\x1F\x7F]/g, ' ');

    let title = 'unknown';
    const titleMatch = context.match(/"title"\s*:\s*"([^"]+)"/);
    if (titleMatch) title = titleMatch[1];

    let id = 'unknown';
    const idMatch = context.match(/"id"\s*:\s*"([^"]+)"/);
    if (idMatch) id = idMatch[1];

    count++;
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const filename = `${path.basename(filePath, path.extname(filePath))}_${count}_${safeTitle}.${format}`;
    const outPath = path.join(outDir, filename);

    // Write file
    const imgBuf = Buffer.from(b64, 'base64');
    fs.writeFileSync(outPath, imgBuf);
    console.log(`  Saved [${count}]: ${filename} (${imgBuf.length} bytes) - Title: "${title}" - ID: "${id}"`);
  }
}

const files = [
  ...fs.readdirSync(idbDir).filter(f => f.endsWith('.ldb') || f.endsWith('.log')).map(f => path.join(idbDir, f)),
  ...fs.readdirSync(lsDir).filter(f => f.endsWith('.ldb') || f.endsWith('.log')).map(f => path.join(lsDir, f)),
];

for (const f of files) {
  scanFile(f);
}
