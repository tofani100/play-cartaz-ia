import fs from 'fs';
import path from 'path';

const files = [
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb\\002435.ldb',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb\\002433.log',
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const buf = fs.readFileSync(f);
  const str16 = buf.toString('utf16le');

  let idx = 0;
  while ((idx = str16.indexOf('playcomunique_clientes', idx)) !== -1) {
    console.log(`\n=== playcomunique_clientes in ${path.basename(f)} at ${idx} ===`);
    const slice = str16.substring(idx - 50, idx + 8000);
    console.log(slice.replace(/[\x00-\x1F\x7F]/g, ' '));
    idx += 22;
  }
}
