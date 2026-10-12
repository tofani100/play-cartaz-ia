import fs from 'fs';
import path from 'path';

const idbPath = 'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\IndexedDB\\https_cartaz-ia-playcomunique.web.app_0.indexeddb.leveldb';
const lsPath = 'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb';

function extractProducts(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    const content = buf.toString('latin1');
    console.log(`\n=== Scanning ${path.basename(filePath)} (${buf.length} bytes) ===`);
    
    // Search for JSON objects containing "title" and "price" or "products"
    const regex = /\{[^{}]*"title"\s*:\s*"([^"]+)"[^{}]*"price"\s*:\s*"([^"]+)"[^{}]*\}/g;
    let match;
    const found = new Map();
    while ((match = regex.exec(content)) !== null) {
      try {
        const fullStr = match[0];
        // clean up control characters if any
        const cleaned = fullStr.replace(/[\x00-\x1F\x7F]/g, ' ');
        const parsed = JSON.parse(cleaned);
        if (parsed.title && (parsed.price || parsed.id)) {
          found.set(parsed.id || parsed.title, parsed);
        }
      } catch (e) {
        // try partial regex match
        found.set(match[1], { title: match[1], price: match[2] });
      }
    }
    
    console.log(`Found ${found.size} potential product items in ${path.basename(filePath)}:`);
    for (const [k, v] of found.entries()) {
      console.log(`  - [${v.id || k}] title="${v.title}" price=${v.price} badge="${v.badge || ''}" unit="${v.unit || ''}" img=${v.imageUrl ? v.imageUrl.substring(0, 30) + '...' : 'none'}`);
    }

    // Also look for larger "products": [ ... ]
    const prodArrayRegex = /"products"\s*:\s*\[\s*\{/g;
    let arrMatch;
    while ((arrMatch = prodArrayRegex.exec(content)) !== null) {
      console.log(`Found "products": [ at offset ${arrMatch.index}`);
      // grab next 10000 chars and try to see what's in there
      const slice = content.substring(arrMatch.index, arrMatch.index + 20000);
      const titleMatches = [...slice.matchAll(/"title"\s*:\s*"([^"]+)"/g)];
      console.log(`  Titles in this block (${titleMatches.length}):`, titleMatches.map(m => m[1]));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

const idbFiles = fs.readdirSync(idbPath).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
for (const f of idbFiles) {
  extractProducts(path.join(idbPath, f));
}

const lsFiles = fs.readdirSync(lsPath).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
for (const f of lsFiles) {
  extractProducts(path.join(lsPath, f));
}
