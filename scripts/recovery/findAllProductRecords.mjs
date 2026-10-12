import fs from 'fs';
import path from 'path';

const allDirs = [
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\IndexedDB\\https_cartaz-ia-playcomunique.web.app_0.indexeddb.leveldb',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 7\\IndexedDB',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 11\\IndexedDB',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 15\\IndexedDB\\https_cartaz-ia-playcomunique.web.app_0.indexeddb.leveldb',
];

const results = [];

function searchInFile(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    const str = buf.toString('latin1');

    // Look for JSON product objects or campaign objects
    // Pattern: {"id":"...","title":"...","price":"...","imageUrl":"..."}
    const regex = /"id"\s*:\s*"([^"]+)"[^{}]*"title"\s*:\s*"([^"]+)"[^{}]*"imageUrl"\s*:\s*"([^"]+)"/g;
    let m;
    while ((m = regex.exec(str)) !== null) {
      results.push({
        file: path.basename(filePath),
        id: m[1],
        title: m[2],
        imageUrlPrefix: m[3].slice(0, 60),
        imageLen: m[3].length,
        fullImageUrl: m[3]
      });
    }

    // Also regex with reversed order (title before id or imageUrl before title)
    const regex2 = /"title"\s*:\s*"([^"]+)"[^{}]*"imageUrl"\s*:\s*"([^"]+)"/g;
    while ((m = regex2.exec(str)) !== null) {
      if (m[2].length > 100) { // likely base64 or meaningful URL
        results.push({
          file: path.basename(filePath),
          id: 'unknown',
          title: m[1],
          imageUrlPrefix: m[2].slice(0, 60),
          imageLen: m[2].length,
          fullImageUrl: m[2]
        });
      }
    }
  } catch (e) {
    // Ignore read errors
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const full = path.join(dir, e);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full);
    } else if (e.endsWith('.ldb') || e.endsWith('.log')) {
      searchInFile(full);
    }
  }
}

for (const d of allDirs) {
  walkDir(d);
}

console.log(`Found ${results.length} total product/image records!`);
const uniqueByTitle = new Map();
results.forEach(r => {
  const key = `${r.title} | ${r.imageLen}`;
  if (!uniqueByTitle.has(key)) {
    uniqueByTitle.set(key, r);
  }
});

console.log(`\nUnique products/images: ${uniqueByTitle.size}`);
for (const [k, v] of uniqueByTitle.entries()) {
  console.log(`- File: ${v.file} | ID: ${v.id} | Title: "${v.title}" | ImgLen: ${v.imageLen} | Prefix: ${v.imageUrlPrefix}`);
}
