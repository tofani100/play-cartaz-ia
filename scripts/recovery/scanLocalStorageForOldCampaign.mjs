import fs from 'fs';
import path from 'path';

const dir = 'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));

for (const f of files) {
  const full = path.join(dir, f);
  const buf = fs.readFileSync(full);
  const str16 = buf.toString('utf16le');
  
  // Search for "playcomunique_campanha" or "playcomunique_clientes"
  let idx = 0;
  while ((idx = str16.indexOf('playcomunique', idx)) !== -1) {
    const slice = str16.substring(Math.max(0, idx - 50), idx + 1000);
    console.log(`\n=== Match in ${f} at ${idx} ===`);
    console.log(slice.replace(/[\x00-\x1F\x7F]/g, ' '));
    idx += 13;
  }
}
